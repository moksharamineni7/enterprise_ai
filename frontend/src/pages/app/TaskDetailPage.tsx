import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Layers,
  MessageSquare,
  CheckCircle,
  Clock,
  Trash2,
  FileText,
  Plus,
  Send,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { TaskStatus, TaskPriority } from '../../types';

export function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<any>(null);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Comments
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Add Dependency Modal
  const [isDepModalOpen, setIsDepModalOpen] = useState(false);
  const [selectedDepTaskId, setSelectedDepTaskId] = useState('');
  const [depError, setDepError] = useState<string | null>(null);

  const loadTask = async () => {
    try {
      setIsLoading(true);
      const [data, tasksList] = await Promise.all([
        apiClient(`/tasks/${taskId}`),
        apiClient('/tasks'),
      ]);
      setTask(data);
      setAllTasks(tasksList.filter((t: any) => t.id !== taskId));
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) loadTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await apiClient(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTask((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    try {
      await apiClient(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ priority: newPriority }),
      });
      setTask((prev: any) => ({ ...prev, priority: newPriority }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCriteria = async (idx: number) => {
    const updatedCriteria = [...task.acceptance_criteria];
    updatedCriteria[idx].completed = !updatedCriteria[idx].completed;
    try {
      await apiClient(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ acceptance_criteria: updatedCriteria }),
      });
      setTask((prev: any) => ({ ...prev, acceptance_criteria: updatedCriteria }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const created = await apiClient(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment }),
      });
      setTask((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), created],
      }));
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedDepTaskId) return;
    setDepError(null);
    try {
      await apiClient(`/tasks/${taskId}/dependencies`, {
        method: 'POST',
        body: JSON.stringify({ depends_on_task_id: selectedDepTaskId }),
      });
      setIsDepModalOpen(false);
      setSelectedDepTaskId('');
      loadTask();
    } catch (err: any) {
      setDepError(err.message || 'Could not add dependency.');
    }
  };

  const handleDeleteDependency = async (depId: string) => {
    try {
      await apiClient(`/tasks/${taskId}/dependencies/${depId}`, { method: 'DELETE' });
      loadTask();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient(`/tasks/${taskId}`, { method: 'DELETE' });
      navigate('/app/tasks');
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !task) {
    return <div className="py-20 text-center text-slate-500">Loading task record...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/app/tasks" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Task Directory
        </Link>
        <button
          onClick={handleDeleteTask}
          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 p-1.5 hover:bg-rose-500/10 rounded-lg"
        >
          <Trash2 className="w-4 h-4" /> Delete Task
        </button>
      </div>

      {/* Task Header Card */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.department && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {task.department.name}
                </span>
              )}
              {task.source_document_id && (
                <Link
                  to={`/app/documents/${task.source_document_id}`}
                  className="text-xs px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> Extracted from Document
                </Link>
              )}
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{task.title}</h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-line">{task.description}</p>
          </div>

          {/* Quick status & priority editor */}
          <div className="flex flex-row md:flex-col gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 flex-shrink-0">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Status</label>
              <select
                value={task.status}
                onChange={e => handleStatusChange(e.target.value as TaskStatus)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Priority</label>
              <select
                value={task.priority}
                onChange={e => handlePriorityChange(e.target.value as TaskPriority)}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Meta Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Assignee</span>
            <span className="text-slate-200 font-medium mt-0.5 block">
              {task.assignee?.full_name || 'Unassigned'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Due Date</span>
            <span className="text-slate-200 font-medium mt-0.5 block">
              {task.due_at ? new Date(task.due_at).toLocaleDateString() : 'No Deadline'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Created By</span>
            <span className="text-slate-200 font-medium mt-0.5 block">
              {task.creator?.full_name || 'Author'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Created At</span>
            <span className="text-slate-200 font-medium mt-0.5 block">
              {new Date(task.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>

      {/* Acceptance Criteria & Dependencies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acceptance Criteria */}
        <Card>
          <CardHeader
            title="Acceptance Criteria"
            description="Operational checklist required for deliverable signoff"
          />
          <div className="space-y-2 mt-3">
            {task.acceptance_criteria?.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No explicit acceptance criteria specified.</p>
            ) : (
              task.acceptance_criteria.map((crit: any, idx: number) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={crit.completed}
                    onChange={() => handleToggleCriteria(idx)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span className={`text-xs ${crit.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {crit.title}
                  </span>
                </label>
              ))
            )}
          </div>
        </Card>

        {/* Task Dependencies & Blockers */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" /> Dependencies & Blockers
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Tasks required before or blocked by this task</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setIsDepModalOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Blocker
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Depends on ({task.dependencies?.length || 0}):
              </p>
              {task.dependencies?.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No preceding dependencies.</p>
              ) : (
                task.dependencies.map((dep: any) => (
                  <div
                    key={dep.dependency_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs my-1"
                  >
                    <Link to={`/app/tasks/${dep.task?.id}`} className="text-blue-400 hover:text-blue-300 font-medium">
                      {dep.task?.title || 'Preceding Task'}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={dep.task?.status || 'todo'} />
                      <button
                        onClick={() => handleDeleteDependency(dep.dependency_id)}
                        className="text-slate-500 hover:text-rose-400"
                        title="Remove dependency"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Tasks blocked by this ({task.blocked_by_this?.length || 0}):
              </p>
              {task.blocked_by_this?.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">No tasks are currently waiting on this deliverable.</p>
              ) : (
                task.blocked_by_this.map((dep: any) => (
                  <div
                    key={dep.dependency_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs my-1"
                  >
                    <Link to={`/app/tasks/${dep.task?.id}`} className="text-slate-300 hover:text-white">
                      {dep.task?.title || 'Dependent Task'}
                    </Link>
                    <StatusBadge status={dep.task?.status || 'todo'} />
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Discussion & Collaboration Thread */}
      <Card>
        <CardHeader
          title="Team Collaboration & Discussion"
          description="Immutable comment thread associated with this deliverable"
        />

        <div className="space-y-4 my-4 divide-y divide-slate-800/60">
          {task.comments?.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No discussion entries yet. Start the conversation below.</p>
          ) : (
            task.comments.map((comment: any) => (
              <div key={comment.id} className="pt-3 first:pt-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{comment.author?.full_name}</span>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Comment Composer */}
        <form onSubmit={handleAddComment} className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
          <Input
            placeholder="Write a comment or status update..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm" isLoading={isSubmittingComment} rightIcon={<Send className="w-3.5 h-3.5" />}>
            Post
          </Button>
        </form>
      </Card>

      {/* Add Dependency Modal */}
      <Modal
        isOpen={isDepModalOpen}
        onClose={() => setIsDepModalOpen(false)}
        title="Add Task Dependency"
        description="Select a deliverable that must be completed before this task can begin"
      >
        <div className="space-y-4">
          {depError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{depError}</span>
            </div>
          )}

          <Select
            label="Preceding Task (Blocker)"
            value={selectedDepTaskId}
            onChange={e => setSelectedDepTaskId(e.target.value)}
          >
            <option value="">-- Choose a task --</option>
            {allTasks.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.priority}, {t.status})
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsDepModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleAddDependency} disabled={!selectedDepTaskId}>
              Add Dependency
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
