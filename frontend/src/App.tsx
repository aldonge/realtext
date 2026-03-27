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
      <div className="min-h-screen flex flex-col bg-white">
        <Header currentSection="pricing" onNavigate={setSection} />
        <Pricing />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header currentSection="tool" onNavigate={setSection} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {/* Mode tabs — stile Google Translate */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => handleModeChange('detect')}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
              mode === 'detect'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('mode_detect')}
          </button>
          <button
            onClick={() => handleModeChange('humanize')}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
              mode === 'humanize'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('mode_humanize')}
          </button>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Left panel — input */}
          <div className="border-b lg:border-b-0 lg:border-r border-gray-200">
            <TextInput
              text={text}
              setText={setText}
              onSubmit={handleSubmit}
              loading={loading}
              mode={mode}
            />
          </div>

          {/* Right panel — results */}
          <div ref={resultRef} className="min-h-[300px] flex flex-col">
            {/* Error */}
            {error && (
              <div className="m-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {t(error)}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm text-gray-500">
                    {mode === 'detect' ? t('analyzing') : t('humanizing')}
                  </span>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && !result && !humanizeResult && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {mode === 'detect' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      )}
                    </svg>
                  </div>
                  <p className="text-sm text-gray-400">
                    {mode === 'detect' ? t('placeholder_detect') : t('placeholder_humanize')}
                  </p>
                </div>
              </div>
            )}

            {/* Detect result */}
            {!loading && result && mode === 'detect' && (
              <div className="p-5 space-y-6 animate-fadeIn overflow-y-auto">
                <div className="flex items-start justify-between">
                  <ScoreGauge score={result.score} />
                  <span className="text-xs text-gray-400 mt-1">
                    {t('detected_language')}: {result.detected_language.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{result.summary}</p>
                <MetricsBreakdown metrics={result.metrics} />
                <Suggestions suggestions={result.suggestions} llmAvailable={result.llm_available} />
              </div>
            )}

            {/* Humanize result */}
            {!loading && humanizeResult && mode === 'humanize' && (
              <div className="flex flex-col h-full animate-fadeIn">
                <div className="flex-1 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">{t('humanize_result_title')}</h3>
                    <button
                      onClick={() => handleCopy(humanizeResult.humanized_text)}
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
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
                  <div className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {humanizeResult.humanized_text}
                  </div>
                </div>
                {humanizeResult.changes_made.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-2">{t('changes_made')}</h4>
                    <ul className="space-y-1">
                      {humanizeResult.changes_made.map((c, i) => (
                        <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                          <span className="text-blue-500 mt-0.5">•</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
