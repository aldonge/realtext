import { useState, useCallback } from 'react';
import type { AnalyzeResponse, HumanizeResponse } from '../types/api';

interface UseAnalysisReturn {
  result: AnalyzeResponse | null;
  humanizeResult: HumanizeResponse | null;
  loading: boolean;
  error: string | null;
  remainingUses: number | null;
  analyze: (text: string, uiLanguage: string) => Promise<void>;
  humanize: (text: string, uiLanguage: string) => Promise<void>;
  reset: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [humanizeResult, setHumanizeResult] = useState<HumanizeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingUses, setRemainingUses] = useState<number | null>(null);

  const analyze = useCallback(async (text: string, uiLanguage: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ui_language: uiLanguage }),
        signal: controller.signal,
      });

      clearTimeout(tid);

      const rem = res.headers.get('X-RateLimit-Remaining');
      if (rem !== null) setRemainingUses(parseInt(rem, 10));

      if (res.status === 429) { setError('error_rate_limit'); return; }
      if (res.status === 422) { setError('error_too_short'); return; }
      if (!res.ok) { setError('error_server'); return; }

      const data: AnalyzeResponse = await res.json();
      setResult(data);
    } catch (_e) {
      clearTimeout(tid);
      setError('error_server');
    } finally {
      setLoading(false);
    }
  }, []);

  const humanize = useCallback(async (text: string, uiLanguage: string) => {
    setLoading(true);
    setError(null);
    setHumanizeResult(null);

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, ui_language: uiLanguage }),
        signal: controller.signal,
      });

      clearTimeout(tid);

      const rem = res.headers.get('X-RateLimit-Remaining');
      if (rem !== null) setRemainingUses(parseInt(rem, 10));

      if (res.status === 429) { setError('error_rate_limit'); return; }
      if (res.status === 422) { setError('error_too_short'); return; }
      if (!res.ok) {
        try {
          const errData = await res.json();
          if (errData.error) { setError(errData.error); return; }
        } catch (_e2) { /* ignore parse error */ }
        setError('error_server');
        return;
      }

      const data: HumanizeResponse = await res.json();
      setHumanizeResult(data);
    } catch (_e) {
      clearTimeout(tid);
      setError('error_server');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setHumanizeResult(null);
    setError(null);
  }, []);

  return { result, humanizeResult, loading, error, remainingUses, analyze, humanize, reset };
}
