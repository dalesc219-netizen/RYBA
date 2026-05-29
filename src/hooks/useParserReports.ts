import { useState, useEffect } from 'react';

export interface ParserReportData {
  location?: string;
  summary?: string;
  modifiers?: Record<string, number>;
  hot_lures?: string[];
}

const REPORT_URL = 'https://raw.githubusercontent.com/dalesc219-netizen/ryba-parser/main/reports.json';

export function useParserReports() {
  const [data, setData] = useState<ParserReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadReport() {
      try {
        const response = await fetch(REPORT_URL);
        if (!response.ok) throw new Error('Report download failed');
        const json = await response.json();

        if (!mounted) return;

        setData({
          location: json.location,
          summary: json.summary,
          modifiers: json.modifiers ?? null,
          hot_lures: Array.isArray(json.hot_lures) ? json.hot_lures : undefined
        });
        setError(null);
      } catch (err: unknown) {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message || 'Failed to fetch report');
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadReport();

    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
