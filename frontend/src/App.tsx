import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Footer from './components/Footer';
import TextInput from './components/TextInput';
import ScoreGauge from './components/ScoreGauge';
import MetricsBreakdown from './components/MetricsBreakdown';
import Suggestions from './components/Suggestions';
import Pricing from './components/Pricing';
import { useAnalysis } from './hooks/useAnalysis';
import type { AppMode } from './types/api';

export default function App() {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<AppMode>('detect');
  const [section, setSection] = useState<'tool' | 'pricing'>('tool');
  const [copied, setCopied] = useState(false);
  const { result, humanizeResult, loading, error, analyze, humanize, reset } = useAnalysis();
  const resultRef = useRef<HTMLDivElement>(null);

  // Read ?lang= parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');
    if (langParam && ['it', 'en', 'es'].includes(langParam)) {
      i18n.changeLanguage(langParam);
    }
  }, [i18n]);

  const handleSubmit = () => {
    const uiLang = i18n.language?.substring(0, 2) || 'it';
    if (mode === 'detect') {
      analyze(text, uiLang);
    } else {
      humanize(text, uiLang);
    }
  };

  const handleModeChange = (m: AppMode) => {
    setMode(m);
    reset();
  };

  useEffect(() => {
    if ((result || humanizeResult) && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [result, humanizeResult]);

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (section === 'pricing') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Header currentSection="pricing" onNavigate={setSection} />
        <Pricing />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header currentSection="tool" onNavigate={setSection} />

      <main className="flex-1 max-w-[720px] w-full mx-auto px-5 py-8">
        {/* Mode tabs — underline style */}
        <div className="flex gap-0 mb-6 border-b border-slate-200">
          <button
            onClick={() => handleModeChange('detect')}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-[3px] -mb-px ${
              mode === 'detect'
                ? 'border-accent text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t('mode_detect')}
          </button>
          <button
            onClick={() => handleModeChange('humanize')}
            className={`px-5 py-3 text-sm font-semibold transition-colors border-b-[3px] -mb-px ${
              mode === 'humanize'
                ? 'border-accent text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t('mode_humanize')}
          </button>
        </div>

        {/* Input */}
        <TextInput
          text={text}
          setText={setText}
          onSubmit={handleSubmit}
          loading={loading}
          mode={mode}
        />

        {/* Error */}
        {error && (
          <div className="mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {t(error)}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-slate-400">
                {mode === 'detect' ? t('analyzing') : t('humanizing')}
              </span>
            </div>
          </div>
        )}

        {/* Detect results */}
        {!loading && result && mode === 'detect' && (
          <div ref={resultRef} className="mt-8 space-y-8 animate-fadeIn">
            <div className="flex items-start justify-between">
              <ScoreGauge score={result.score} />
              <span className="text-xs text-slate-400 mt-2">
                {t('detected_language')}: {result.detected_language.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-600 bg-slate-100 rounded-xl px-4 py-3">{result.summary}</p>
            <MetricsBreakdown metrics={result.metrics} />
            <Suggestions suggestions={result.suggestions} llmAvailable={result.llm_available} />
          </div>
        )}

        {/* Humanize results */}
        {!loading && humanizeResult && mode === 'humanize' && (
          <div ref={resultRef} className="mt-8 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-heading font-bold text-slate-900">{t('humanize_result_title')}</h3>
                  <button
                    onClick={() => handleCopy(humanizeResult.humanized_text)}
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover px-3 py-1.5 rounded-lg hover:bg-accent-light transition-colors font-medium"
                  >
                    {copied ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        {t('copy')}
                      </>
                    )}
                  </button>
                </div>
                <div className="text-base text-slate-800 leading-relaxed whitespace-pre-wrap font-body">
                  {humanizeResult.humanized_text}
                </div>
              </div>
              {humanizeResult.changes_made.length > 0 && (
                <div className="border-t border-slate-100 px-6 py-4 bg-slate-50">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{t('changes_made')}</h4>
                  <ul className="space-y-1">
                    {humanizeResult.changes_made.map((c, i) => (
                      <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
                        <span className="text-accent mt-0.5">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
