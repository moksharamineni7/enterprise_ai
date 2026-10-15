import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Layers, GitBranch } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea, Select } from '../../components/ui/Input';

export function NewWorkflowPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('engineering');
  const [triggerType, setTriggerType] = useState('task_created');

  const [steps, setSteps] = useState<any[]>([
    {
      step_id: 'step-1',
      name: 'Request Manager Authorization',
      action_type: 'request_approval',
      config: { title: 'Operational Change Review' },
    },
    {
      step_id: 'step-2',
      name: 'Log Audit Trail',
      action_type: 'add_activity',
      config: { message: 'Automated step recorded.' },
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddStep = () => {
    const newStepNum = steps.length + 1;
    setSteps(prev => [
      ...prev,
      {
        step_id: `step-${newStepNum}`,
        name: `Automated Action #${newStepNum}`,
        action_type: 'create_task',
        config: { title: `Automated Task #${newStepNum}` },
      },
    ]);
  };

  const handleUpdateStep = (idx: number, field: string, val: any) => {
    setSteps(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.length === 0) {
      setError('A workflow must contain at least one action step.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const created = await apiClient('/workflows', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          category,
          trigger_type: triggerType,
          trigger_config: {},
          definition: { steps },
        }),
      });

      // Automatically publish
      await apiClient(`/workflows/${created.id}/publish`, { method: 'POST' });

      navigate(`/app/workflows/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/app/workflows" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Cancel & Return to Workflows
      </Link>

      <Card>
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Build Automated Workflow Pipeline</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure triggers, action steps, and approval gates executed deterministically by the backend.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Workflow Name *"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Critical Infrastructure Release Protocol"
          />

          <Textarea
            label="Description & Purpose"
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the operational process automated by this pipeline..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Pipeline Trigger Type"
              value={triggerType}
              onChange={e => setTriggerType(e.target.value)}
            >
              <option value="manual">Manual Execution</option>
              <option value="task_created">Task Created</option>
              <option value="task_status_changed">Task Status Changed</option>
              <option value="document_analysis_completed">Document Analysis Completed</option>
              <option value="approval_submitted">Approval Submitted</option>
            </Select>

            <Select
              label="Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="engineering">Engineering & IT</option>
              <option value="operations">Operations & SLA</option>
              <option value="finance">Finance & Procurement</option>
              <option value="compliance">Compliance & Legal</option>
            </Select>
          </div>

          {/* Sequential Step Builder */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Pipeline Execution Steps ({steps.length})</h3>
                <p className="text-xs text-slate-400">Actions triggered in strict sequential order</p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={handleAddStep} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Action Step
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <Input
                      placeholder="Step Name"
                      value={step.name}
                      onChange={e => handleUpdateStep(idx, 'name', e.target.value)}
                      className="flex-1"
                    />
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-9">
                    <Select
                      label="Action Type"
                      value={step.action_type}
                      onChange={e => handleUpdateStep(idx, 'action_type', e.target.value)}
                    >
                      <option value="create_task">Create Deliverable Task</option>
                      <option value="request_approval">Request Formal Approval</option>
                      <option value="add_activity">Append Audit Log Entry</option>
                      <option value="generate_summary">Generate AI Operational Summary</option>
                      <option value="update_task_status">Update Task Status</option>
                    </Select>

                    <Input
                      label="Step Target / Parameter"
                      placeholder="e.g. Critical Review"
                      value={step.config?.title || step.config?.message || ''}
                      onChange={e =>
                        handleUpdateStep(idx, 'config', {
                          ...step.config,
                          title: e.target.value,
                          message: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
            <Link to="/app/workflows">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isLoading} leftIcon={<GitBranch className="w-4 h-4" />}>
              Publish & Activate Workflow
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
