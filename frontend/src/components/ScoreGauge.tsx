import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ScoreGaugeProps {
  score: number;
}

function getColor(score: number): string {
  if (score <= 30) return '#DC2626';
  if (score <= 50) return '#D97706';
  if (score <= 70) return '#D97706';
  return '#059669';
}

function getLabel(score: number, t: (key: string) => string): string {
  if (score <= 30) return t('score_label_ai');
  if (score <= 50) return t('score_label_possibly_ai');
  if (score <= 70) return t('score_label_mixed');
  return t('score_label_human');
}

export default function ScoreGauge({ score }: ScoreGaugeProps) {
  const { t } = useTranslation();
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 900;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimated(Math.round(eased * score));
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const r = 64;
  const stroke = 10;
  const nr = r - stroke / 2;
  const circ = Math.PI * nr;
  const offset = circ - (animated / 100) * circ;
  const color = getColor(animated);
  const size = r * 2;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <svg width={size} height={r + 16} viewBox={`0 0 ${size} ${r + 16}`}>
        <path
          d={`M ${stroke / 2} ${r} A ${nr} ${nr} 0 0 1 ${size - stroke / 2} ${r}`}
          fill="none" stroke="#F1F5F9" strokeWidth={stroke} strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2} ${r} A ${nr} ${nr} 0 0 1 ${size - stroke / 2} ${r}`}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke 0.2s' }}
        />
        <text x={r} y={r - 4} textAnchor="middle" fill="#0F172A" fontSize="32" fontWeight="700" fontFamily="'Plus Jakarta Sans', sans-serif">
          {animated}
        </text>
      </svg>
      <span className="text-sm font-semibold font-heading" style={{ color }}>{getLabel(animated, t)}</span>
    </div>
  );
}
