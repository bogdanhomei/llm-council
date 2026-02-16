import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage2.css';

function deAnonymizeText(text, labelToModel) {
  if (!labelToModel) return text;

  let result = text;
  Object.entries(labelToModel).forEach(([label, model]) => {
    const modelShortName = model.split('/')[1] || model;
    result = result.replace(new RegExp(label, 'g'), `**${modelShortName}**`);
  });
  return result;
}

export default function Stage2({ rankings, labelToModel, aggregateRankings }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) {
    return null;
  }

  return (
    <div className="stage stage2">
      <div className="stage-header">
        <div className="stage-badge stage2-badge">2</div>
        <h3 className="stage-title">Peer Rankings</h3>
      </div>

      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className="aggregate-rankings">
          <h4 className="aggregate-title">Aggregate Results</h4>
          <p className="aggregate-description">
            Combined rankings across all peer evaluations (lower is better)
          </p>
          <div className="aggregate-list">
            {aggregateRankings.map((agg, index) => (
              <div key={index} className="aggregate-item">
                <span className="rank-position">
                  {index === 0 ? '1st' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`}
                </span>
                <span className="rank-model">
                  {agg.model.split('/')[1] || agg.model}
                </span>
                <div className="rank-stats">
                  <span className="rank-score">{agg.average_rank.toFixed(2)}</span>
                  <span className="rank-count">{agg.rankings_count} votes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="evaluations-section">
        <h4 className="evaluations-title">Raw Evaluations</h4>
        <p className="stage-description">
          Models evaluated anonymized responses. Bold names shown for readability.
        </p>

        <div className="tabs">
          {rankings.map((rank, index) => (
            <button
              key={index}
              className={`tab ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {rank.model.split('/')[1] || rank.model}
            </button>
          ))}
        </div>

        <div className="tab-content">
          <div className="ranking-model">
            {rankings[activeTab].model}
          </div>
          <div className="ranking-content markdown-content">
            <ReactMarkdown>
              {deAnonymizeText(rankings[activeTab].ranking, labelToModel)}
            </ReactMarkdown>
          </div>

          {rankings[activeTab].parsed_ranking &&
           rankings[activeTab].parsed_ranking.length > 0 && (
            <div className="parsed-ranking">
              <strong>Extracted Ranking:</strong>
              <ol>
                {rankings[activeTab].parsed_ranking.map((label, i) => (
                  <li key={i}>
                    {labelToModel && labelToModel[label]
                      ? labelToModel[label].split('/')[1] || labelToModel[label]
                      : label}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
