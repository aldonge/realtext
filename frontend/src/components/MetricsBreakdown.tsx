import { useTranslation } from 'react-i18next';
import type { MetricsResponse } from '../types/api';

interface MetricsBreakdownProps {
  metrics: MetricsResponse;
}

function barColor(v: number): string {
  if (v <= 30) return 'bg-red-500';
  if (v <= 50) return 'bg-orange-400';
  if (v <= 70) return 'bg-yellow-400';
  return 'bg-green-500';
}

export default function MetricsBreakdown({ metrics }: MetricsBreakdownProps) {
  const { t } = useTranslation();

  const items = [
    { label: t('metric_burstiness'), desc: t('metric_burstiness_desc'), value: metrics.burstiness_score },
    { label: t('metric_lexical'), desc: t('metric_lexical_desc'), value: metrics.lexical_diversity },
    { label: t('metric_sentence_var'), desc: t('metric_sentence_var_desc'), value: metrics.sentence_length_variance },
    { label: t('metric_repetition'), desc: t('metric_repetition_desc'), value: metrics.repetition_score },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">{item.label}</span>
            <span className="text-xs text-gray-500">{item.value}/100</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ease-out ${barColor(item.value)}`}
              style={{ width: `${item.value}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
