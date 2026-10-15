import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GitBranch,
  Play,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { WorkflowItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { useAuth } from '../../lib/auth-context';

export function WorkflowsPage() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/workflows');
      setWorkflows(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleQuickExecute = async (wfId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await apiClient(`/workflows/${wfId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ input: { triggered_from: 'dashboard_quick_run' } }),
      });
      alert('Workflow execution initiated.');
      fetchWorkflows();
    } catch (err: any) {
      alert(`Execution failed: ${err.message}`);
    }
  };

  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Workflow Automation Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic, auditable operational pipelines linking triggers to automated tasks and approval stages.
          </p>
        </div>

        {canCreate && (
          <Link to="/app/workflows/new">
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Build Workflow
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            Loading enterprise workflow definitions...
          </div>
        ) : workflows.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 glass-card rounded-2xl">
            No workflows defined yet. Click "Build Workflow" to create your first automated process.
          </div>
        ) : (
          workflows.map(wf => (
            <Card key={wf.id} hover className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Trigger: {wf.trigger_type}
                  </span>
                  <StatusBadge status={wf.status as any} />
                </div>

                <Link to={`/app/workflows/${wf.id}`} className="text-base font-bold text-white hover:text-blue-400 transition-colors">
                  {wf.name}
                </Link>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {wf.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500" /> Pipeline Steps:
                    </span>
                    <span className="font-semibold text-slate-200">
                      {wf.definition?.steps?.length || 0} actions
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Total Runs:</span>
                    <span className="font-semibold text-slate-200">{wf.executions_count || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={e => handleQuickExecute(wf.id, e)}
                  leftIcon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
                >
                  Run Now
                </Button>

                <Link to={`/app/workflows/${wf.id}`}>
                  <Button size="sm" variant="ghost" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
