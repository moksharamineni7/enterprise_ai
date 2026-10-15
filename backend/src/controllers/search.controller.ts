import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';

export async function searchEnterprise(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const q = ((req.query.q as string) || '').toLowerCase().trim();

  if (!q) {
    res.json({
      success: true,
      data: { tasks: [], documents: [], workflows: [], members: [] },
    });
    return;
  }

  // 1. Tasks
  const tasks = EnterpriseDataStore.tasks
    .filter(t => t.organization_id === orgId && (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.tags || []).some((tag: string) => tag.toLowerCase().includes(q))
    ))
    .slice(0, 10);

  // 2. Documents
  const documents = EnterpriseDataStore.documents
    .filter(d => d.organization_id === orgId && (
      d.title.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q)) ||
      (d.extracted_text && d.extracted_text.toLowerCase().includes(q))
    ))
    .slice(0, 10);

  // 3. Workflows
  const workflows = EnterpriseDataStore.workflows
    .filter(w => w.organization_id === orgId && (
      w.name.toLowerCase().includes(q) ||
      (w.description && w.description.toLowerCase().includes(q))
    ))
    .slice(0, 10);

  // 4. Members
  const members = EnterpriseDataStore.members
    .filter(m => m.organization_id === orgId)
    .map(m => {
      const p = EnterpriseDataStore.profiles.find(prof => prof.id === m.user_id);
      return { ...m, full_name: p?.full_name || '', job_title: p?.job_title || '' };
    })
    .filter(m => m.full_name.toLowerCase().includes(q) || m.job_title.toLowerCase().includes(q))
    .slice(0, 10);

  res.json({
    success: true,
    data: {
      tasks,
      documents,
      workflows,
      members,
      total_matches: tasks.length + documents.length + workflows.length + members.length,
    },
  });
}
