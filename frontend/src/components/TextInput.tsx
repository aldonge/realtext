import { useTranslation } from 'react-i18next';
import type { AppMode } from '../types/api';

interface TextInputProps {
  text: string;
  setText: (text: string) => void;
  onSubmit: () => void;
  loading: boolean;
  mode: AppMode;
}

export default function TextInput({ text, setText, onSubmit, loading, mode }: TextInputProps) {
  const { t } = useTranslation();
  const charCount = text.length;
  const isValid = charCount >= 50;
  const placeholder = mode === 'detect' ? t('placeholder_detect') : t('placeholder_humanize');
  const buttonText = mode === 'detect' ? t('analyze_button') : t('humanize_button');
  const loadingText = mode === 'detect' ? t('analyzing') : t('humanizing');

  return (
    <div className="flex flex-col">
      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= 10000) setText(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full min-h-[280px] md:min-h-[320px] p-6 text-base text-slate-800 font-body placeholder-slate-400 resize-none bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent-light leading-relaxed transition-all"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && isValid && !loading) {
              onSubmit();
            }
          }}
        />
        {/* Clear button */}
        {text.length > 0 && !loading && (
          <button
            onClick={() => setText('')}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            title={t('clear')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-body">
            {charCount.toLocaleString()} / 10.000 {t('characters')}
          </span>
          {charCount > 0 && charCount < 50 && (
            <span className="text-xs text-amber-600">{t('min_chars')}</span>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={!isValid || loading}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white text-base font-semibold rounded-xl hover:bg-accent-hover active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? loadingText : buttonText}
        </button>
      </div>
    </div>
  );
}
