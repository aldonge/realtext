import { useTranslation } from 'react-i18next';
import type { SuggestionResponse } from '../types/api';

interface SuggestionsProps {
  suggestions: SuggestionResponse[];
  llmAvailable: boolean;
}

const impactColors = {
  high: 'bg-red-50 text-red-700 border border-red-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

export default function Suggestions({ suggestions, llmAvailable }: SuggestionsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-base font-heading font-bold text-slate-900">{t('suggestions_title')}</h3>

      {!llmAvailable && suggestions.length > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">{t('fallback_note')}</p>
      )}

      {suggestions.length === 0 ? null : (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md ${impactColors[s.impact]}`}>
                {t(`impact_${s.impact}`)}
              </span>
              {s.original_excerpt && (
                <p className="text-sm text-slate-500 italic bg-slate-50 rounded-lg px-3 py-2">
                  "{s.original_excerpt}"
                </p>
              )}
              <p className="text-sm text-slate-600">{s.issue}</p>
              <p className="text-sm text-accent bg-accent-light rounded-lg px-3 py-2.5 font-medium">{s.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
