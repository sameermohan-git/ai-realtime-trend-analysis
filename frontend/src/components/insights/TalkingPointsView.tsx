import { useState, useEffect } from 'react';
import { api, type TimeRange, type TalkingPointsResponse } from '../../api';
import { WidgetHeading } from '../WidgetHeading';
import '../Widget.css';

interface TalkingPointsViewProps {
  timeRange: TimeRange;
  onDrillDown: (callIds: string[]) => void;
}

export function TalkingPointsView({ timeRange, onDrillDown }: TalkingPointsViewProps) {
  const [data, setData] = useState<TalkingPointsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getTalkingPoints(timeRange).then(setData).finally(() => setLoading(false));
  }, [timeRange]);

  if (loading) return <div className="widget widget-loading">Loading what people are talking about…</div>;
  if (!data) return null;

  const { topTopics, topIntents, totalCalls } = data;

  return (
    <div className="widget insight-widget talking-points-view">
      <WidgetHeading title="What people are talking about" infoText="Top topics and intents from member calls. Click an item to open the related calls." />
      <p className="widget-insight-caption">
        Top conversation drivers for the selected period — topics and intents from member calls.
      </p>
      <div className="talking-points-meta">
        <span className="talking-points-total">{totalCalls.toLocaleString()} calls</span> in range
      </div>
      <div className="talking-points-grid">
        <div className="talking-points-col">
          <h3 className="talking-points-col-title">Top topics</h3>
          <ul className="talking-points-list">
            {topTopics.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="talking-points-item"
                  onClick={() => t.callIds?.length && onDrillDown(t.callIds)}
                >
                  <span className="talking-points-name">{t.name}</span>
                  <span className="talking-points-count">{t.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="talking-points-col">
          <h3 className="talking-points-col-title">Top intents</h3>
          <ul className="talking-points-list">
            {topIntents.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  className="talking-points-item"
                  onClick={() => i.callIds?.length && onDrillDown(i.callIds)}
                >
                  <span className="talking-points-name">{i.name}</span>
                  <span className="talking-points-count">{i.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="widget-hint">C-level view: click a topic or intent to drill down to calls.</p>
    </div>
  );
}
