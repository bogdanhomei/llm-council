import { supabase } from './lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const api = {
  async listConversations() {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const withCounts = await Promise.all(
      conversations.map(async (conv) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);
        return { ...conv, message_count: count || 0 };
      })
    );

    return withCounts;
  },

  async createConversation() {
    const { data, error } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getConversation(conversationId) {
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .maybeSingle();

    if (convError) throw convError;
    if (!conversation) throw new Error('Conversation not found');

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) throw msgError;

    return { ...conversation, messages: messages || [] };
  },

  async deleteConversation(conversationId) {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  async sendMessageStream(conversationId, content, onEvent) {
    const { error: userMsgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content,
      });

    if (userMsgError) throw userMsgError;

    const apiUrl = `${SUPABASE_URL}/functions/v1/council`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation_id: conversationId, content }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Council request failed: ${errText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6));
            onEvent(event.type, event);
          } catch (e) {
            // skip unparseable lines
          }
        }
      }
    }

    if (buffer.startsWith('data: ')) {
      try {
        const event = JSON.parse(buffer.slice(6));
        onEvent(event.type, event);
      } catch (e) {
        // skip
      }
    }
  },
};
