import { useTranslation } from 'react-i18next';
import type { SuggestionResponse } from '../types/api';

interface SuggestionsProps {
  suggestions: SuggestionResponse[];
  llmAvailable: boolean;
}

const impactColors = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function Suggestions({ suggestions, llmAvailable }: SuggestionsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">{t('suggestions_title')}</h3>

      {!llmAvailable && suggestions.length > 0 && (
        <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">{t('fallback_note')}</p>
      )}

      {suggestions.length === 0 ? null : (
        <div className="space-y-2">
          {suggestions.map((s, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
              <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${impactColors[s.impact]}`}>
                {t(`impact_${s.impact}`)}
              </span>
              {s.original_excerpt && (
                <p className="text-xs text-gray-500 italic bg-gray-50 rounded px-2 py-1">
                  "{s.original_excerpt}"
                </p>
              )}
              <p className="text-sm text-gray-600">{s.issue}</p>
              <p className="text-sm text-blue-700 bg-blue-50 rounded px-2 py-1.5">{s.suggestion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
