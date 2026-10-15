import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';
import { generateOperationalInsights } from '../services/gemini.service';

export async function listInsights(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const insights = EnterpriseDataStore.insights
    .filter(i => i.organization_id === orgId && i.status === 'active')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    data: insights,
  });
}

export async function generateInsights(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;

  const tasks = EnterpriseDataStore.tasks.filter(t => t.organization_id === orgId);
  const approvals = EnterpriseDataStore.approvals.filter(a => a.organization_id === orgId);
  const workflows = EnterpriseDataStore.workflows.filter(w => w.organization_id === orgId);
  const now = new Date();

  const overdue = tasks.filter(t => t.status !== 'completed' && t.due_at && new Date(t.due_at) < now);
  const blocked = tasks.filter(t => t.status === 'blocked');
  const pendingApprovals = approvals.filter(a => a.status === 'pending');

  const deptCounts: Record<string, number> = {};
  tasks.forEach(t => {
    const deptId = t.department_id || 'unassigned';
    deptCounts[deptId] = (deptCounts[deptId] || 0) + 1;
  });

  const metrics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    overdueTasks: overdue.length,
    pendingApprovals: pendingApprovals.length,
    activeWorkflows: workflows.filter(w => w.status === 'published').length,
    departmentBreakdown: deptCounts,
  };

  const sampleRecords = {
    overdueTasksList: overdue.slice(0, 5),
    pendingApprovalsList: pendingApprovals.slice(0, 5),
    blockedTasksList: blocked.slice(0, 5),
  };

  const aiResult = await generateOperationalInsights(metrics, sampleRecords);

  // Persist newly generated insights
  const newInsights: any[] = [];
  aiResult.insights.forEach(item => {
    const insight = {
      id: uuidv4(),
      organization_id: orgId,
      department_id: null,
      title: item.title,
      category: item.category,
      severity: item.severity,
      summary: item.summary,
      recommendation: item.recommendation,
      evidence: item.evidence_record_ids,
      confidence_label: item.confidence,
      status: 'active',
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    EnterpriseDataStore.insights.unshift(insight);
    newInsights.push(insight);
  });

  res.json({
    success: true,
    data: {
      generated_count: newInsights.length,
      insights: newInsights,
      overall_summary: aiResult.overall_summary,
      limitations: aiResult.data_limitations,
    },
  });
}

export async function updateInsightStatus(req: AuthenticatedRequest, res: Response) {
  const { insightId } = req.params;
  const { status } = req.body;
  const orgId = req.user!.organization_id;

  const insight = EnterpriseDataStore.insights.find(i => i.id === insightId && i.organization_id === orgId);
  if (!insight) {
    res.status(404).json({
      success: false,
      error: { code: 'INSIGHT_NOT_FOUND', message: 'Insight not found.' },
    });
    return;
  }

  insight.status = status || 'dismissed';
  res.json({
    success: true,
    data: insight,
  });
}
