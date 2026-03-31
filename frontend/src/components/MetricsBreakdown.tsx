import { useTranslation } from 'react-i18next';
import type { MetricsResponse } from '../types/api';

interface MetricsBreakdownProps {
  metrics: MetricsResponse;
}

function barColor(v: number): string {
  if (v <= 30) return 'bg-red-500';
  if (v <= 50) return 'bg-amber-500';
  if (v <= 70) return 'bg-amber-400';
  return 'bg-emerald-500';
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{item.label}</span>
            <span className="text-lg font-bold font-heading text-slate-900" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-700 ease-out ${barColor(item.value)}`}
              style={{ width: `${item.value}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">{item.desc}</p>
        </div>
      ))}
    </div>
  );
}
