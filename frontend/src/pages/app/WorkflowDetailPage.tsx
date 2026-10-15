import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export function WorkflowDetailPage() {
  const { workflowId } = useParams<{ workflowId: string }>();

  const [workflow, setWorkflow] = useState<any>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  // Recommendations
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);

  const loadWorkflow = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient(`/workflows/${workflowId}`);
      setWorkflow(data);
      setExecutions(data.executions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (workflowId) loadWorkflow();
  }, [workflowId]);

  const handleExecute = async () => {
    try {
      setIsExecuting(true);
      await apiClient(`/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ input: { executed_by_user: true } }),
      });
      await loadWorkflow();
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleFetchRecommendations = async () => {
    try {
      setIsAiLoading(true);
      const rec = await apiClient(`/workflows/${workflowId}/recommendations`, { method: 'POST' });
      setRecommendations(rec);
      setIsRecModalOpen(true);
    } catch (err: any) {
      alert(`Recommendation query failed: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  if (isLoading || !workflow) {
    return <div className="py-20 text-center text-slate-500">Loading workflow pipeline...</div>;
  }

  const steps = workflow.definition?.steps || [];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/app/workflows" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Workflows
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleFetchRecommendations}
            isLoading={isAiLoading}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
          >
            AI Process Audit
          </Button>
          <Button
            size="sm"
            onClick={handleExecute}
            isLoading={isExecuting}
            leftIcon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Trigger Execution
          </Button>
        </div>
      </div>

      {/* Header Info */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={workflow.status} />
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono">
                Trigger: {workflow.trigger_type}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                Version {workflow.version}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{workflow.name}</h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{workflow.description}</p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 p-3 rounded-xl flex-shrink-0">
            <p><strong className="text-slate-300">Creator:</strong> {workflow.creator?.full_name || 'System'}</p>
            <p className="mt-1"><strong className="text-slate-300">Created:</strong> {new Date(workflow.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Visual Step Pipeline */}
      <Card>
        <CardHeader
          title="Sequential Action Pipeline"
          description="Ordered tasks and approval gates executed deterministically"
        />

        <div className="relative mt-6 space-y-4">
          {steps.map((step: any, idx: number) => (
            <div key={idx} className="flex items-start gap-4 relative">
              {/* Step Number Circle */}
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 z-10">
                {idx + 1}
              </div>

              {/* Connecting line */}
              {idx < steps.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-800 -translate-x-1/2 z-0" />
              )}

              {/* Step Card */}
              <div className="flex-1 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{step.name}</h4>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {step.action_type}
                  </span>
                </div>
                {step.config && Object.keys(step.config).length > 0 && (
                  <pre className="mt-2 p-2 rounded bg-slate-950 text-[11px] text-slate-400 font-mono">
                    {JSON.stringify(step.config, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Execution Audit History */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">Execution Audit History</h3>
          <p className="text-xs text-slate-400 mt-0.5">Immutable trace of past automated pipeline runs</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Execution ID</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Idempotency Key</th>
                <th className="py-3 px-4">Started At</th>
                <th className="py-3 px-4">Result / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No executions recorded yet. Click "Trigger Execution" above to run this workflow.
                  </td>
                </tr>
              ) : (
                executions.map(exec => (
                  <tr key={exec.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {exec.id.slice(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={exec.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {exec.idempotency_key}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(exec.started_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {exec.error_message ? (
                        <span className="text-rose-400">{exec.error_message}</span>
                      ) : (
                        <span className="text-emerald-400 font-mono text-[11px]">
                          {exec.result ? JSON.stringify(exec.result) : 'Success'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Recommendations Modal */}
      <Modal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        title="Nexus AI Workflow Improvement Audit"
        description="Automated recommendations to eliminate bottlenecks and optimize operational cycle time"
        maxWidth="lg"
      >
        {recommendations && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
              <strong className="block text-white mb-1">Architecture Summary:</strong>
              {recommendations.workflow_summary}
            </div>

            {recommendations.recommendations?.map((rec: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white">{rec.title}</h4>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {rec.suggested_trigger}
                  </span>
                </div>
                <p className="text-slate-300">{rec.description}</p>
                <p className="text-emerald-400 text-[11px]">
                  <strong>Expected Benefit:</strong> {rec.expected_benefit}
                </p>
              </div>
            ))}

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={() => setIsRecModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
