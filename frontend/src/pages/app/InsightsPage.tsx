import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { InsightItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { PriorityBadge } from '../../components/ui/Badge';

export function InsightsPage() {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryMeta, setSummaryMeta] = useState<any>(null);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<InsightItem[]>('/insights');
      setInsights(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await apiClient<{
        generated_count: number;
        insights: InsightItem[];
        overall_summary: string;
      }>('/insights/generate', { method: 'POST' });
      setSummaryMeta(res);
      await fetchInsights();
    } catch (err: any) {
      alert(`Insight synthesis error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDismiss = async (insightId: string) => {
    try {
      await apiClient(`/insights/${insightId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'dismissed' }),
      });
      setInsights(prev => prev.filter(i => i.id !== insightId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            AI Operational Intelligence Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded organizational bottlenecks, deadline risks, and workload imbalances identified from verified application data.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleGenerate}
          isLoading={isGenerating}
          leftIcon={<Sparkles className="w-4 h-4 text-cyan-400" />}
        >
          Synthesize New Insights
        </Button>
      </div>

      {/* Synthesis Meta Banner */}
      {summaryMeta && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
          <strong className="block text-white mb-1">Synthesis Completed:</strong>
          {summaryMeta.overall_summary}
        </div>
      )}

      {/* Insights Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">Synthesizing active operational insights...</div>
        ) : insights.length === 0 ? (
          <Card className="text-center py-16 text-slate-500">
            No active risks or bottlenecks detected. Click "Synthesize New Insights" to scan active metrics.
          </Card>
        ) : (
          insights.map(item => (
            <Card key={item.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <PriorityBadge priority={item.severity} />
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Category: {item.category}
                    </span>
                    {item.confidence_label && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                        Confidence: {item.confidence_label}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{item.title}</h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{item.summary}</p>

                  {/* Recommendation block */}
                  <div className="mt-3.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
                    <strong className="text-blue-300">Evidence-Based Action:</strong> {item.recommendation}
                  </div>

                  {/* Supporting records */}
                  {item.evidence?.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500 text-[11px]">Supporting Record References:</span>
                      {item.evidence.map((recId, idx) => (
                        <Link
                          key={idx}
                          to={`/app/tasks/${recId}`}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 text-[10px] font-mono flex items-center gap-1"
                        >
                          <span>{recId.slice(0, 8)}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col items-end gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(item.id)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
