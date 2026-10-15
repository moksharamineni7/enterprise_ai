import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';

export async function listApprovals(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const role = req.user!.role;

  const { status } = req.query as any;

  let approvals = EnterpriseDataStore.approvals.filter(a => a.organization_id === orgId);

  // If not admin/executive, only view requests where user is requester or assigned approver
  if (role !== 'admin' && role !== 'executive') {
    approvals = approvals.filter(a => a.requester_id === userId || a.approver_id === userId);
  }

  if (status) {
    approvals = approvals.filter(a => a.status === status);
  }

  const hydrated = approvals.map(a => {
    const requester = EnterpriseDataStore.profiles.find(p => p.id === a.requester_id);
    const approver = EnterpriseDataStore.profiles.find(p => p.id === a.approver_id);
    const task = EnterpriseDataStore.tasks.find(t => t.id === a.related_task_id);
    return {
      ...a,
      requester: requester ? { full_name: requester.full_name, job_title: requester.job_title } : null,
      approver: approver ? { full_name: approver.full_name, job_title: approver.job_title } : null,
      related_task: task ? { title: task.title, priority: task.priority } : null,
    };
  });

  res.json({
    success: true,
    data: hydrated,
  });
}

export async function getApprovalById(req: AuthenticatedRequest, res: Response) {
  const { approvalId } = req.params;
  const orgId = req.user!.organization_id;

  const approval = EnterpriseDataStore.approvals.find(a => a.id === approvalId && a.organization_id === orgId);
  if (!approval) {
    res.status(404).json({
      success: false,
      error: { code: 'APPROVAL_NOT_FOUND', message: 'Approval request not found.' },
    });
    return;
  }

  const requester = EnterpriseDataStore.profiles.find(p => p.id === approval.requester_id);
  const approver = EnterpriseDataStore.profiles.find(p => p.id === approval.approver_id);
  const task = EnterpriseDataStore.tasks.find(t => t.id === approval.related_task_id);
  const doc = EnterpriseDataStore.documents.find(d => d.id === approval.related_document_id);
  const history = EnterpriseDataStore.approvalHistory
    .filter(h => h.approval_id === approval.id)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map(h => {
      const actor = EnterpriseDataStore.profiles.find(p => p.id === h.actor_id);
      return {
        ...h,
        actor: actor ? { full_name: actor.full_name, job_title: actor.job_title } : { full_name: 'Actor' },
      };
    });

  res.json({
    success: true,
    data: {
      ...approval,
      requester: requester || null,
      approver: approver || null,
      related_task: task || null,
      related_document: doc || null,
      history,
    },
  });
}

export async function createApproval(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const { title, description, approver_id, related_task_id, related_document_id, due_at } = req.body;

  const newApproval = {
    id: uuidv4(),
    organization_id: orgId,
    title,
    description: description || '',
    requester_id: userId,
    approver_id,
    related_task_id: related_task_id || null,
    related_document_id: related_document_id || null,
    related_workflow_execution_id: null,
    status: 'pending',
    due_at: due_at || null,
    decision_comment: null,
    decided_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  EnterpriseDataStore.approvals.unshift(newApproval);

  // Initial history record
  EnterpriseDataStore.approvalHistory.push({
    id: uuidv4(),
    organization_id: orgId,
    approval_id: newApproval.id,
    actor_id: userId,
    action: 'submitted',
    comment: 'Approval request submitted.',
    created_at: new Date().toISOString(),
  });

  // Notify approver
  EnterpriseDataStore.notifications.unshift({
    id: uuidv4(),
    organization_id: orgId,
    user_id: approver_id,
    type: 'APPROVAL_PENDING',
    title: 'Approval Request Pending',
    message: `${req.user!.full_name} submitted "${newApproval.title}" for your approval.`,
    resource_type: 'approval',
    resource_id: newApproval.id,
    idempotency_key: `approval-req-${newApproval.id}`,
    read_at: null,
    created_at: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: newApproval,
  });
}

export async function approveApproval(req: AuthenticatedRequest, res: Response) {
  const { approvalId } = req.params;
  const { comment } = req.body;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;

  const approval = EnterpriseDataStore.approvals.find(a => a.id === approvalId && a.organization_id === orgId);
  if (!approval) {
    res.status(404).json({
      success: false,
      error: { code: 'APPROVAL_NOT_FOUND', message: 'Approval request not found.' },
    });
    return;
  }

  if (approval.status !== 'pending') {
    res.status(400).json({
      success: false,
      error: { code: 'ALREADY_DECIDED', message: `Approval has already been ${approval.status}.` },
    });
    return;
  }

  // Authorization check: must be designated approver or admin
  const isAdmin = req.user!.role === 'admin';
  if (approval.approver_id !== userId && !isAdmin) {
    res.status(403).json({
      success: false,
      error: { code: 'UNAUTHORIZED_APPROVER', message: 'You are not the designated approver for this request.' },
    });
    return;
  }

  // Self-approval policy check
  const org = EnterpriseDataStore.organizations.find(o => o.id === orgId);
  const allowSelfApproval = org?.settings?.security?.allow_self_approval === true;
  if (approval.requester_id === userId && !allowSelfApproval) {
    res.status(403).json({
      success: false,
      error: { code: 'SELF_APPROVAL_PROHIBITED', message: 'Organization policy prohibits approving your own requests.' },
    });
    return;
  }

  approval.status = 'approved';
  approval.decision_comment = comment || 'Approved';
  approval.decided_at = new Date().toISOString();
  approval.updated_at = new Date().toISOString();

  // Append to immutable history
  EnterpriseDataStore.approvalHistory.push({
    id: uuidv4(),
    organization_id: orgId,
    approval_id: approval.id,
    actor_id: userId,
    action: 'approved',
    comment: comment || null,
    created_at: new Date().toISOString(),
  });

  // Notify requester
  EnterpriseDataStore.notifications.unshift({
    id: uuidv4(),
    organization_id: orgId,
    user_id: approval.requester_id,
    type: 'APPROVAL_APPROVED',
    title: 'Approval Request Approved',
    message: `Your request "${approval.title}" was approved by ${req.user!.full_name}.`,
    resource_type: 'approval',
    resource_id: approval.id,
    idempotency_key: `approval-appr-${approval.id}`,
    read_at: null,
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    data: approval,
  });
}

export async function rejectApproval(req: AuthenticatedRequest, res: Response) {
  const { approvalId } = req.params;
  const { comment } = req.body;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;

  const approval = EnterpriseDataStore.approvals.find(a => a.id === approvalId && a.organization_id === orgId);
  if (!approval) {
    res.status(404).json({
      success: false,
      error: { code: 'APPROVAL_NOT_FOUND', message: 'Approval request not found.' },
    });
    return;
  }

  if (approval.status !== 'pending') {
    res.status(400).json({
      success: false,
      error: { code: 'ALREADY_DECIDED', message: `Approval has already been ${approval.status}.` },
    });
    return;
  }

  const isAdmin = req.user!.role === 'admin';
  if (approval.approver_id !== userId && !isAdmin) {
    res.status(403).json({
      success: false,
      error: { code: 'UNAUTHORIZED_APPROVER', message: 'You are not the designated approver for this request.' },
    });
    return;
  }

  approval.status = 'rejected';
  approval.decision_comment = comment || 'Rejected';
  approval.decided_at = new Date().toISOString();
  approval.updated_at = new Date().toISOString();

  // Append to immutable history
  EnterpriseDataStore.approvalHistory.push({
    id: uuidv4(),
    organization_id: orgId,
    approval_id: approval.id,
    actor_id: userId,
    action: 'rejected',
    comment: comment || null,
    created_at: new Date().toISOString(),
  });

  // Notify requester
  EnterpriseDataStore.notifications.unshift({
    id: uuidv4(),
    organization_id: orgId,
    user_id: approval.requester_id,
    type: 'APPROVAL_REJECTED',
    title: 'Approval Request Rejected',
    message: `Your request "${approval.title}" was rejected.`,
    resource_type: 'approval',
    resource_id: approval.id,
    idempotency_key: `approval-rej-${approval.id}`,
    read_at: null,
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    data: approval,
  });
}
