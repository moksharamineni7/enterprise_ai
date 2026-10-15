import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  Inbox,
  GitBranch,
  FileText,
  Sparkles,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { apiClient } from '../../lib/api-client';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PriorityBadge } from '../../components/ui/Badge';
import { useAuth } from '../../lib/auth-context';

export function DashboardPage() {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        const [summary, trends, activity] = await Promise.all([
          apiClient('/dashboard/summary'),
          apiClient('/dashboard/trends'),
          apiClient('/dashboard/activity'),
        ]);
        setSummaryData(summary);
        setTrendsData(trends);
        setActivityData(activity);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (isLoading || !summaryData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 glass-card rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 glass-card rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 glass-card rounded-2xl" />
          <div className="h-80 glass-card rounded-2xl" />
        </div>
      </div>
    );
  }

  const { metrics, department_workload, high_priority_risks, ai_summary } = summaryData;

  // Format workload chart data
  const workloadChartData = Object.entries(department_workload || {}).map(([dept, val]: [string, any]) => ({
    department: dept.split('&')[0].trim(),
    total: val.total,
    in_progress: val.in_progress,
    completed: val.completed,
  }));

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Operational Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of tasks, documents, workflows, and risk intelligence for your enterprise.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/app/documents/upload">
            <Button variant="secondary" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
              Upload Document
            </Button>
          </Link>
          <Link to="/app/tasks/new">
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Task
            </Button>
          </Link>
        </div>
      </div>

      {/* AI Operational Executive Summary Banner */}
      {ai_summary && (
        <div className="rounded-2xl glass-panel border border-blue-500/30 p-5 bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-slate-900 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Nexus AI Executive Briefing
                </span>
                <span className="text-[11px] text-slate-400">Live Synthesis</span>
              </div>
              <h2 className="text-base font-semibold text-white mt-1.5">{ai_summary.headline}</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{ai_summary.summary}</p>

              {ai_summary.recommended_next_steps?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-400">Recommended Interventions:</span>
                  {ai_summary.recommended_next_steps.slice(0, 2).map((step: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-[11px]"
                    >
                      • {step}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Tasks"
          value={metrics.total_tasks}
          subtitle={`${metrics.completed_tasks} completed (${Math.round((metrics.completed_tasks / (metrics.total_tasks || 1)) * 100)}%)`}
          icon={<CheckSquare className="w-5 h-5 text-blue-400" />}
          trend={{ value: '+4 new', isPositive: true }}
        />
        <StatCard
          title="Overdue Tasks"
          value={metrics.overdue_tasks}
          subtitle={`${metrics.tasks_due_soon} due in next 72 hours`}
          icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
          trend={{ value: `${metrics.overdue_tasks} attention req`, isPositive: false }}
        />
        <StatCard
          title="Pending Approvals"
          value={metrics.pending_approvals}
          subtitle="Awaiting decision"
          icon={<Inbox className="w-5 h-5 text-amber-400" />}
          trend={{ value: 'Active queue', isNeutral: true }}
        />
        <StatCard
          title="Active Workflows"
          value={metrics.active_workflows}
          subtitle={`${metrics.total_documents} documents processed`}
          icon={<GitBranch className="w-5 h-5 text-indigo-400" />}
          trend={{ value: 'Deterministic SLA', isPositive: true }}
        />
      </div>

      {/* Visual Charts: Department Workload & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Workload Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Department Workload & Completion"
            description="Active vs Completed deliverables distributed across departments"
          />
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="department" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="in_progress" name="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Task Activity Trends */}
        <Card>
          <CardHeader
            title="Weekly Velocity Trends"
            description="Creation and completion rate"
          />
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData?.trends || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="created" name="Tasks Created" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCreated)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Operational Risks & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority Operational Risks */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Operational Bottlenecks & Risks
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Identified from active dependencies & deadlines</p>
            </div>
            <Link to="/app/insights" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              View All Insights →
            </Link>
          </div>

          <div className="space-y-3">
            {high_priority_risks.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No active operational risks detected.</p>
            ) : (
              high_priority_risks.map((risk: any) => (
                <div key={risk.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-white">{risk.title}</p>
                    <PriorityBadge priority={risk.severity} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{risk.summary}</p>
                  <p className="text-[11px] text-blue-300/90 mt-2 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                    <strong>Action:</strong> {risk.recommendation}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activity Log */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Recent Organizational Activity</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live audit events across tasks & documents</p>
            </div>
            <Link to="/app/audit-log" className="text-xs text-blue-400 hover:text-blue-300 font-medium">
              Full Audit Log →
            </Link>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
            {activityData.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent activity recorded.</p>
            ) : (
              activityData.slice(0, 6).map((item: any) => (
                <div key={item.id} className="py-2.5 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{item.actor?.full_name || 'System'}</span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {item.action.replace(/_/g, ' ')}: {item.details?.title || item.details?.name || item.resource_type}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
