import { useState, useRef, useEffect } from 'react';
import './InfoIcon.css';

interface InfoIconProps {
  /** Explanation shown in the tooltip */
  text: string;
  /** Optional short label for the icon (e.g. "What this means") */
  label?: string;
}

export function InfoIcon({ text, label = 'What this metric shows' }: InfoIconProps) {
  const [visible, setVisible] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setVisible(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [visible]);

  return (
    <span className="info-icon-wrap" ref={wrapRef}>
      <button
        type="button"
        className="info-icon-trigger"
        onClick={() => setVisible((v) => !v)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={label}
        title={text}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>
      {visible && (
        <span className="info-icon-tooltip" role="tooltip">
          {text}
        </span>
      )}
    </span>
  );
}
