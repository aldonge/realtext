import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ScoreGaugeProps {
  score: number;
}

function getColor(score: number): string {
  if (score <= 30) return '#ea4335';
  if (score <= 50) return '#fa7b17';
  if (score <= 70) return '#f9ab00';
  return '#34a853';
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

  const r = 54;
  const stroke = 8;
  const nr = r - stroke / 2;
  const circ = Math.PI * nr;
  const offset = circ - (animated / 100) * circ;
  const color = getColor(animated);
  const size = r * 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={r + 12} viewBox={`0 0 ${size} ${r + 12}`}>
        <path
          d={`M ${stroke / 2} ${r} A ${nr} ${nr} 0 0 1 ${size - stroke / 2} ${r}`}
          fill="none" stroke="#f1f3f4" strokeWidth={stroke} strokeLinecap="round"
        />
        <path
          d={`M ${stroke / 2} ${r} A ${nr} ${nr} 0 0 1 ${size - stroke / 2} ${r}`}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke 0.2s' }}
        />
        <text x={r} y={r - 6} textAnchor="middle" fill="#202124" fontSize="28" fontWeight="500">
          {animated}
        </text>
      </svg>
      <span className="text-sm font-medium" style={{ color }}>{getLabel(animated, t)}</span>
    </div>
  );
}
