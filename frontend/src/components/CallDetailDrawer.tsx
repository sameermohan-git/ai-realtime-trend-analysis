import { useState, useEffect } from 'react';
import { api, type CallSummary, type QmCheckId } from '../api';
import { format } from 'date-fns';
import './CallDetailDrawer.css';

const QM_LABELS: Record<QmCheckId, string> = {
  greeting_correct: 'Greeted correctly',
  sin_verified: 'SIN verified',
  phone_verified: 'Phone verified',
  identity_confirmed: 'Identity confirmed',
  disclosure_given: 'Disclosure given',
  empathy_shown: 'Empathy shown',
  next_steps_summarized: 'Next steps summarized',
  closing_courteous: 'Courteous closing',
};

interface CallDetailDrawerProps {
  callId: string | null;
  onClose: () => void;
}

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallDetailDrawer({ callId, onClose }: CallDetailDrawerProps) {
  const [call, setCall] = useState<CallSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!callId) {
      setCall(null);
      return;
    }
    setLoading(true);
    api.getCall(callId).then(setCall).finally(() => setLoading(false));
  }, [callId]);

  if (!callId) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} aria-hidden />
      <div className="drawer" role="dialog" aria-label="Call detail">
        <div className="drawer-header">
          <h2>Call detail</h2>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {loading && <div className="drawer-loading">Loading…</div>}
        {!loading && call && (
          <div className="drawer-body">
            <div className="call-meta">
              <span className="call-id">{call.externalId}</span>
              <span className="call-time">
                {format(new Date(call.startedAt), 'MMM d, yyyy HH:mm')} – {format(new Date(call.endedAt), 'HH:mm')}
              </span>
              <span className="call-duration">{formatDuration(call.durationSeconds)}</span>
              {call.isComplaint && <span className="call-badge complaint">Complaint</span>}
            </div>
            <div className="call-summary">
              <strong>Summary</strong>
              <p>{call.summary || '—'}</p>
            </div>
            <div className="call-classification">
              <div><strong>Primary intent</strong> {call.primaryIntent}</div>
              <div><strong>Primary topic</strong> {call.primaryTopic}</div>
            </div>
            {call.actions && call.actions.length > 0 && (
              <div className="call-actions">
                <strong>Actions from call</strong>
                <ul>
                  {call.actions.map((a, i) => (
                    <li key={i}>{a.description}{a.category ? ` (${a.category})` : ''}</li>
                  ))}
                </ul>
              </div>
            )}
            {call.qmChecks && Object.keys(call.qmChecks).length > 0 && (
              <div className="call-qm">
                <strong>Quality checks</strong>
                <ul className="call-qm-list">
                  {Object.entries(call.qmChecks).map(([key, value]) => (
                    <li key={key} className={value ? 'qm-pass' : 'qm-fail'}>
                      {value ? '✓' : '✗'} {QM_LABELS[key as keyof typeof QM_LABELS] ?? key}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="call-sentiment">
              <strong>Sentiment scores (0–10)</strong>
              <div className="sentiment-bars">
                <div>
                  <span>Member</span>
                  <div className="sentiment-bar"><div className="fill" style={{ width: `${(call.memberSentiment / 10) * 100}%` }} /></div>
                  <span>{call.memberSentiment}</span>
                </div>
                <div>
                  <span>Agent</span>
                  <div className="sentiment-bar"><div className="fill agent" style={{ width: `${(call.agentSentiment / 10) * 100}%` }} /></div>
                  <span>{call.agentSentiment}</span>
                </div>
              </div>
            </div>
            <div className="call-segments">
              <strong>Segments (topic / intent / sentiment)</strong>
              <ul>
                {call.segments.map((seg, i) => (
                  <li key={i}>
                    <span className="seg-time">{formatDuration(seg.startOffset)}–{formatDuration(seg.endOffset)}</span>
                    <span className="seg-topic">{seg.topic}</span>
                    <span className="seg-intent">{seg.intent}</span>
                    <span className="seg-sent">M: {seg.memberSentiment} / A: {seg.agentSentiment}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
