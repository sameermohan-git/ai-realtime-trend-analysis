import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api, type CopilotChartConfig } from '../api';
import './CopilotChat.css';

interface CopilotChatProps {
  onClose: () => void;
  onAddVisualization: (config: CopilotChartConfig) => void;
}

const SUGGESTIONS = [
  'Add a pie chart of topics',
  'Show sentiment breakdown',
  'Line chart of intents over time',
  'Bar chart of top intents',
];

export function CopilotChat({ onClose, onAddVisualization }: CopilotChatProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Describe the chart you want. For example: "Add a bar chart of intents" or "Show sentiment as pie chart".' },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  const send = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setQuery('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const { config, message } = await api.copilotVisualization(q);
      onAddVisualization(config);
      setMessages((m) => [...m, { role: 'assistant', text: message }]);
      toast.success('Visualization added');
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Sorry, I couldn’t add that chart. Try "bar chart of intents" or "pie chart of sentiment".' }]);
      toast.error('Could not add chart');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="copilot">
      <div className="copilot-header">
        <h2>Add visualization</h2>
        <button type="button" className="copilot-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="copilot-messages" ref={listRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`copilot-msg ${msg.role}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="copilot-msg assistant">Adding chart…</div>}
      </div>
      <div className="copilot-suggestions">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => setQuery(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="copilot-input-wrap">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="e.g. Add pie chart of topics"
          disabled={loading}
        />
        <button type="button" onClick={send} disabled={loading || !query.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}
