import { useState, useEffect } from 'react';
import { api, type TimeRange, type ActionByTopicItem } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
import '../Widget.css';

interface ActionsByTopicWidgetProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

export function ActionsByTopicWidget({ timeRange, onDrillDown }: ActionsByTopicWidgetProps) {
  const [byTopic, setByTopic] = useState<ActionByTopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getActionsByTopic(timeRange).then((r) => {
      setByTopic(r.byTopic);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading actions by topic…</div>;

  return (
    <div className="widget insight-widget actions-by-topic">
      <WidgetHeading title="Actions from calls (by topic)" infoText="Follow-up actions from call summaries, grouped by topic. Click a topic to see the underlying calls." />
      <p className="widget-insight-caption">
        Follow-up actions captured from call summaries, grouped by topic. Click an action to view its calls.
      </p>
      <div className="actions-by-topic-list">
        {byTopic.length === 0 ? (
          <p className="widget-empty-inline">No actions in the selected time range.</p>
        ) : (
          byTopic.map(({ topic, actions }) => (
            <div key={topic} className="actions-topic-block">
              <h3 className="actions-topic-name">{topic}</h3>
              <ul className="actions-list">
                {actions.map(({ action, count, callIds }) => (
                  <li key={action}>
                    <button
                      type="button"
                      className="actions-action-btn"
                      onClick={() => onDrillDown(callIds)}
                    >
                      <span className="actions-action-text">{action}</span>
                      <span className="actions-action-count">{count} calls</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      <p className="widget-hint">Actions are derived from call transcripts/summaries and mapped to the primary topic.</p>
    </div>
  );
}
