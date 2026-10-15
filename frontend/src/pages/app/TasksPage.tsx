import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Sparkles,
  Calendar,
  User,
  ArrowUpDown,
  Tag,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Task, TaskPriority, TaskStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');

  // AI Prioritization Modal State
  const [isAiPrioritizing, setIsAiPrioritizing] = useState(false);
  const [aiRanking, setAiRanking] = useState<any>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (deptFilter) params.append('department_id', deptFilter);

      const [taskData, deptData] = await Promise.all([
        apiClient(`/tasks?${params.toString()}`),
        apiClient('/organizations/99999999-9999-4999-a999-999999999999/departments'),
      ]);
      setTasks(taskData || []);
      setDepartments(deptData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, statusFilter, priorityFilter, deptFilter]);

  const handleAiPrioritize = async () => {
    try {
      setIsAiPrioritizing(true);
      const res = await apiClient('/tasks/ai-prioritize-all', { method: 'POST' });
      setAiRanking(res);
      setIsAiModalOpen(true);
    } catch (err: any) {
      alert(`AI prioritization error: ${err.message}`);
    } finally {
      setIsAiPrioritizing(false);
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: TaskStatus, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiClient(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Enterprise Task Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize, track, and assign departmental responsibilities with live dependency checks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAiPrioritize}
            isLoading={isAiPrioritizing}
            leftIcon={<Sparkles className="w-4 h-4 text-cyan-400" />}
          >
            AI Prioritization
          </Button>
          <Link to="/app/tasks/new">
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter tasks by keyword..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Task List Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Task Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading enterprise tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No tasks match the active filters.
                  </td>
                </tr>
              ) : (
                tasks.map(task => {
                  const isOverdue = task.status !== 'completed' && task.due_at && new Date(task.due_at) < new Date();
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs">
                        <Link to={`/app/tasks/${task.id}`} className="hover:text-blue-400 block truncate font-semibold">
                          {task.title}
                        </Link>
                        {task.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.description}</p>
                        )}
                        {task.dependencies_count ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 mt-1">
                            <Layers className="w-3 h-3" /> {task.dependencies_count} dependency blocker(s)
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        {task.department?.name || 'General'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-blue-400">
                            {task.assignee?.full_name?.charAt(0) || '?'}
                          </div>
                          <span className="truncate max-w-[120px]">{task.assignee?.full_name || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {task.due_at ? (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isOverdue ? 'text-rose-400 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.due_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {task.status !== 'completed' ? (
                            <button
                              onClick={e => handleQuickStatusChange(task.id, 'completed', e)}
                              className="px-2 py-1 rounded text-[11px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                            >
                              Complete
                            </button>
                          ) : (
                            <button
                              onClick={e => handleQuickStatusChange(task.id, 'in_progress', e)}
                              className="px-2 py-1 rounded text-[11px] bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                              Reopen
                            </button>
                          )}
                          <Link to={`/app/tasks/${task.id}`}>
                            <Button variant="ghost" size="sm">
                              Details
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Prioritization Modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="Nexus AI Task Prioritization Ranking"
        description="Grounded recommendation based on deadline urgencies, business impact, and cross-task blockers"
        maxWidth="xl"
      >
        {aiRanking && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              <strong className="block text-white mb-1">Executive Summary:</strong>
              {aiRanking.overall_summary}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {aiRanking.ranked_tasks?.map((rt: any) => {
                const targetTask = tasks.find(t => t.id === rt.task_id);
                return (
                  <div
                    key={rt.task_id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                      #{rt.recommended_rank}
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-white truncate">{targetTask?.title || rt.task_id}</p>
                        <PriorityBadge priority={rt.recommended_priority} />
                      </div>
                      <p className="text-slate-400 mt-1">
                        <strong className="text-slate-300">Rationale:</strong> {rt.reason}
                      </p>
                      {rt.risk_if_delayed && (
                        <p className="text-rose-400/90 text-[11px] mt-1">
                          <strong>Delay Risk:</strong> {rt.risk_if_delayed}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button size="sm" onClick={() => setIsAiModalOpen(false)}>
                Acknowledge & Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
