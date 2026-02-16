import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const COUNCIL_MODELS = [
  "openai/gpt-4.1",
  "google/gemini-2.5-pro-preview-06-05",
  "anthropic/claude-sonnet-4",
  "x-ai/grok-3",
];

const CHAIRMAN_MODEL = "google/gemini-2.5-pro-preview-06-05";

async function queryModel(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
): Promise<{ content: string } | null> {
  try {
    const resp = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });
    if (!resp.ok) {
      console.error(`Model ${model} returned ${resp.status}`);
      return null;
    }
    const data = await resp.json();
    return { content: data.choices?.[0]?.message?.content || "" };
  } catch (e) {
    console.error(`Error querying ${model}:`, e);
    return null;
  }
}

async function queryModelsParallel(
  apiKey: string,
  models: string[],
  messages: { role: string; content: string }[],
): Promise<Record<string, { content: string } | null>> {
  const results = await Promise.all(
    models.map((m) => queryModel(apiKey, m, messages)),
  );
  const out: Record<string, { content: string } | null> = {};
  models.forEach((m, i) => {
    out[m] = results[i];
  });
  return out;
}

function parseRankingFromText(text: string): string[] {
  if (text.includes("FINAL RANKING:")) {
    const parts = text.split("FINAL RANKING:");
    if (parts.length >= 2) {
      const section = parts[1];
      const numbered = section.match(/\d+\.\s*Response [A-Z]/g);
      if (numbered) {
        return numbered.map((m) => {
          const match = m.match(/Response [A-Z]/);
          return match ? match[0] : m;
        });
      }
      const fallback = section.match(/Response [A-Z]/g);
      return fallback || [];
    }
  }
  return text.match(/Response [A-Z]/g) || [];
}

function calculateAggregateRankings(
  stage2Results: { model: string; ranking: string; parsed_ranking: string[] }[],
  labelToModel: Record<string, string>,
): { model: string; average_rank: number; rankings_count: number }[] {
  const positions: Record<string, number[]> = {};
  for (const r of stage2Results) {
    const parsed = parseRankingFromText(r.ranking);
    parsed.forEach((label, idx) => {
      if (labelToModel[label]) {
        const modelName = labelToModel[label];
        if (!positions[modelName]) positions[modelName] = [];
        positions[modelName].push(idx + 1);
      }
    });
  }
  const agg = Object.entries(positions).map(([model, pos]) => ({
    model,
    average_rank: Math.round((pos.reduce((a, b) => a + b, 0) / pos.length) * 100) / 100,
    rankings_count: pos.length,
  }));
  agg.sort((a, b) => a.average_rank - b.average_rank);
  return agg;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { conversation_id, content } = await req.json();
    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");

    if (!openrouterKey) {
      return new Response(
        JSON.stringify({
          error: "OPENROUTER_API_KEY not configured. Add it as a Supabase secret.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(obj)}\n\n`),
          );
        };

        try {
          send({ type: "stage1_start" });
          const stage1Responses = await queryModelsParallel(
            openrouterKey,
            COUNCIL_MODELS,
            [{ role: "user", content }],
          );
          const stage1Results: { model: string; response: string }[] = [];
          for (const [model, resp] of Object.entries(stage1Responses)) {
            if (resp) {
              stage1Results.push({ model, response: resp.content });
            }
          }
          send({ type: "stage1_complete", data: stage1Results });

          if (stage1Results.length === 0) {
            send({
              type: "error",
              message: "All models failed to respond.",
            });
            controller.close();
            return;
          }

          send({ type: "stage2_start" });
          const labels = stage1Results.map((_, i) =>
            String.fromCharCode(65 + i),
          );
          const labelToModel: Record<string, string> = {};
          labels.forEach((l, i) => {
            labelToModel[`Response ${l}`] = stage1Results[i].model;
          });

          const responsesText = labels
            .map(
              (l, i) =>
                `Response ${l}:\n${stage1Results[i].response}`,
            )
            .join("\n\n");

          const rankingPrompt = `You are evaluating different responses to the following question:

Question: ${content}

Here are the responses from different models (anonymized):

${responsesText}

Your task:
1. First, evaluate each response individually. For each response, explain what it does well and what it does poorly.
2. Then, at the very end of your response, provide a final ranking.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as follows:
- Start with the line "FINAL RANKING:" (all caps, with colon)
- Then list the responses from best to worst as a numbered list
- Each line should be: number, period, space, then ONLY the response label (e.g., "1. Response A")
- Do not add any other text or explanations in the ranking section

Now provide your evaluation and ranking:`;

          const stage2Responses = await queryModelsParallel(
            openrouterKey,
            COUNCIL_MODELS,
            [{ role: "user", content: rankingPrompt }],
          );

          const stage2Results: {
            model: string;
            ranking: string;
            parsed_ranking: string[];
          }[] = [];
          for (const [model, resp] of Object.entries(stage2Responses)) {
            if (resp) {
              stage2Results.push({
                model,
                ranking: resp.content,
                parsed_ranking: parseRankingFromText(resp.content),
              });
            }
          }

          const aggregateRankings = calculateAggregateRankings(
            stage2Results,
            labelToModel,
          );

          send({
            type: "stage2_complete",
            data: stage2Results,
            metadata: {
              label_to_model: labelToModel,
              aggregate_rankings: aggregateRankings,
            },
          });

          send({ type: "stage3_start" });
          const stage1Text = stage1Results
            .map((r) => `Model: ${r.model}\nResponse: ${r.response}`)
            .join("\n\n");
          const stage2Text = stage2Results
            .map((r) => `Model: ${r.model}\nRanking: ${r.ranking}`)
            .join("\n\n");

          const chairmanPrompt = `You are the Chairman of an LLM Council. Multiple AI models have provided responses to a user's question, and then ranked each other's responses.

Original Question: ${content}

STAGE 1 - Individual Responses:
${stage1Text}

STAGE 2 - Peer Rankings:
${stage2Text}

Your task as Chairman is to synthesize all of this information into a single, comprehensive, accurate answer to the user's original question. Consider:
- The individual responses and their insights
- The peer rankings and what they reveal about response quality
- Any patterns of agreement or disagreement

Provide a clear, well-reasoned final answer that represents the council's collective wisdom:`;

          const chairmanResp = await queryModel(openrouterKey, CHAIRMAN_MODEL, [
            { role: "user", content: chairmanPrompt },
          ]);

          const stage3Result = {
            model: CHAIRMAN_MODEL,
            response: chairmanResp?.content || "Error: Unable to generate final synthesis.",
          };
          send({ type: "stage3_complete", data: stage3Result });

          const titleResp = await queryModel(
            openrouterKey,
            "google/gemini-2.5-flash",
            [
              {
                role: "user",
                content: `Generate a very short title (3-5 words maximum) that summarizes the following question. Do not use quotes or punctuation.\n\nQuestion: ${content}\n\nTitle:`,
              },
            ],
          );

          const title = titleResp?.content?.trim().replace(/^["']|["']$/g, "") || "New Conversation";

          await supabase
            .from("conversations")
            .update({ title })
            .eq("id", conversation_id);

          send({ type: "title_complete", data: { title } });

          await supabase.from("messages").insert({
            conversation_id,
            role: "assistant",
            stage1: stage1Results,
            stage2: stage2Results,
            stage3: stage3Result,
            metadata: {
              label_to_model: labelToModel,
              aggregate_rankings: aggregateRankings,
            },
          });

          send({ type: "complete" });
        } catch (e) {
          send({ type: "error", message: String(e) });
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
