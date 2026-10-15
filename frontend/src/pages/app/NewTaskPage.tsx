import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { TaskPriority, TaskStatus } from '../../types';

export function NewTaskPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [departmentId, setDepartmentId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');

  // Acceptance Criteria
  const [criteria, setCriteria] = useState<string[]>(['']);

  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [depts, mems] = await Promise.all([
          apiClient('/organizations/99999999-9999-4999-a999-999999999999/departments'),
          apiClient('/organizations/99999999-9999-4999-a999-999999999999/members'),
        ]);
        setDepartments(depts || []);
        setMembers(mems || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadOptions();
  }, []);

  const handleAddCriteria = () => {
    setCriteria(prev => [...prev, '']);
  };

  const handleCriteriaChange = (idx: number, val: string) => {
    setCriteria(prev => {
      const copy = [...prev];
      copy[idx] = val;
      return copy;
    });
  };

  const handleRemoveCriteria = (idx: number) => {
    setCriteria(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formattedCriteria = criteria
        .filter(c => c.trim().length > 0)
        .map(c => ({ title: c.trim(), completed: false }));

      const formattedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const task = await apiClient('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          priority,
          status,
          department_id: departmentId || null,
          assignee_id: assigneeId || null,
          due_at: dueDate || null,
          acceptance_criteria: formattedCriteria,
          tags: formattedTags,
        }),
      });

      navigate(`/app/tasks/${task.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create task.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/app/tasks" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Cancel & Return to Tasks
      </Link>

      <Card>
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Create Enterprise Deliverable</h1>
          <p className="text-xs text-slate-400 mt-1">
            Define requirements, acceptance criteria, assignment, and operational priority.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Deliverable Title *"
            required
            placeholder="e.g. Conduct Multi-Region Failover Simulation"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <Textarea
            label="Description & Scope"
            rows={4}
            placeholder="Provide context, architectural parameters, and constraints..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Operational Priority"
              value={priority}
              onChange={e => setPriority(e.target.value as TaskPriority)}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical (Blocker)</option>
            </Select>

            <Select
              label="Initial Status"
              value={status}
              onChange={e => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="completed">Completed</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Assigned Department"
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
            >
              <option value="">-- General / Unassigned --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label="Assignee"
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
            >
              <option value="">-- Unassigned --</option>
              {members.map(m => (
                <option key={m.id} value={m.user_id}>
                  {m.profile?.full_name} ({m.role})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Due Date & Time"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />

            <Input
              label="Tags (Comma separated)"
              placeholder="e.g. security, cloud, q4-audit"
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
          </div>

          {/* Acceptance Criteria Builder */}
          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200">Acceptance Criteria</label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddCriteria} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {criteria.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder={`Criterion #${idx + 1}`}
                    value={c}
                    onChange={e => handleCriteriaChange(idx, e.target.value)}
                  />
                  {criteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriteria(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
            <Link to="/app/tasks">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isLoading}>
              Publish Task
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
