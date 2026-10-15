import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';
import { recommendWorkflowImprovements } from '../services/gemini.service';

export async function listWorkflows(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const workflows = EnterpriseDataStore.workflows
    .filter(w => w.organization_id === orgId)
    .map(w => {
      const creator = EnterpriseDataStore.profiles.find(p => p.id === w.created_by);
      const executions = EnterpriseDataStore.workflowExecutions.filter(e => e.workflow_id === w.id);
      return {
        ...w,
        creator: creator ? { full_name: creator.full_name, job_title: creator.job_title } : null,
        executions_count: executions.length,
        last_executed_at: executions[0]?.started_at || null,
      };
    });

  res.json({
    success: true,
    data: workflows,
  });
}

export async function createWorkflow(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const { name, description, category, trigger_type, trigger_config, definition } = req.body;

  const newWorkflow = {
    id: uuidv4(),
    organization_id: orgId,
    name,
    description: description || '',
    category: category || 'general',
    trigger_type,
    trigger_config: trigger_config || {},
    definition,
    status: 'draft',
    version: 1,
    created_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  EnterpriseDataStore.workflows.unshift(newWorkflow);

  // Activity log
  EnterpriseDataStore.activityLogs.unshift({
    id: uuidv4(),
    organization_id: orgId,
    actor_id: userId,
    action: 'WORKFLOW_CREATED',
    resource_type: 'workflow',
    resource_id: newWorkflow.id,
    details: { name: newWorkflow.name, trigger_type: newWorkflow.trigger_type },
    created_at: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: newWorkflow,
  });
}

export async function getWorkflowById(req: AuthenticatedRequest, res: Response) {
  const { workflowId } = req.params;
  const orgId = req.user!.organization_id;

  const workflow = EnterpriseDataStore.workflows.find(w => w.id === workflowId && w.organization_id === orgId);
  if (!workflow) {
    res.status(404).json({
      success: false,
      error: { code: 'WORKFLOW_NOT_FOUND', message: 'Workflow not found.' },
    });
    return;
  }

  const creator = EnterpriseDataStore.profiles.find(p => p.id === workflow.created_by);
  const executions = EnterpriseDataStore.workflowExecutions
    .filter(e => e.workflow_id === workflow.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    data: {
      ...workflow,
      creator: creator || null,
      executions,
    },
  });
}

export async function publishWorkflow(req: AuthenticatedRequest, res: Response) {
  const { workflowId } = req.params;
  const orgId = req.user!.organization_id;

  const workflow = EnterpriseDataStore.workflows.find(w => w.id === workflowId && w.organization_id === orgId);
  if (!workflow) {
    res.status(404).json({
      success: false,
      error: { code: 'WORKFLOW_NOT_FOUND', message: 'Workflow not found.' },
    });
    return;
  }

  workflow.status = 'published';
  workflow.updated_at = new Date().toISOString();

  res.json({
    success: true,
    data: workflow,
  });
}

export async function executeWorkflow(req: AuthenticatedRequest, res: Response) {
  const { workflowId } = req.params;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const { input, idempotency_key } = req.body;

  const workflow = EnterpriseDataStore.workflows.find(w => w.id === workflowId && w.organization_id === orgId);
  if (!workflow) {
    res.status(404).json({
      success: false,
      error: { code: 'WORKFLOW_NOT_FOUND', message: 'Workflow not found.' },
    });
    return;
  }

  // Idempotency check
  const idempKey = idempotency_key || `exec_${workflow.id}_${Date.now()}`;
  const existingExec = EnterpriseDataStore.workflowExecutions.find(
    e => e.organization_id === orgId && e.idempotency_key === idempKey
  );
  if (existingExec) {
    res.json({
      success: true,
      data: existingExec,
      meta: { idempotent_replay: true },
    });
    return;
  }

  const execution = {
    id: uuidv4(),
    organization_id: orgId,
    workflow_id: workflow.id,
    workflow_version: workflow.version,
    trigger_event_id: `trigger_${Date.now()}`,
    idempotency_key: idempKey,
    status: 'running',
    input: input || {},
    result: null as any,
    error_message: null as string | null,
    started_at: new Date().toISOString(),
    completed_at: null as string | null,
    created_by: userId,
    created_at: new Date().toISOString(),
  };

  EnterpriseDataStore.workflowExecutions.unshift(execution);

  // Deterministic step execution
  const steps = workflow.definition?.steps || [];
  const stepResults: any[] = [];

  try {
    for (const step of steps) {
      if (step.action_type === 'create_task') {
        const task = {
          id: uuidv4(),
          organization_id: orgId,
          department_id: req.user!.department_id || null,
          title: step.config.title || `Workflow Task: ${step.name}`,
          description: step.config.description || `Generated by workflow ${workflow.name}`,
          acceptance_criteria: [],
          status: 'todo',
          priority: step.config.priority || 'medium',
          assignee_id: step.assigned_user_id || userId,
          created_by: userId,
          due_at: new Date(Date.now() + 5 * 86400000).toISOString(),
          completed_at: null,
          source_document_id: null,
          tags: ['automated-workflow'],
          metadata: { workflow_id: workflow.id },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        EnterpriseDataStore.tasks.unshift(task);
        stepResults.push({ step_id: step.step_id, action: 'create_task', result_id: task.id, status: 'success' });
      } else if (step.action_type === 'request_approval') {
        const approval = {
          id: uuidv4(),
          organization_id: orgId,
          title: step.config.title || `Approval required: ${step.name}`,
          description: step.config.description || `Triggered by workflow ${workflow.name}`,
          requester_id: userId,
          approver_id: step.assigned_user_id || '11111111-1111-4111-a111-111111111111', // fallback admin
          related_task_id: input?.task_id || null,
          related_document_id: null,
          related_workflow_execution_id: execution.id,
          status: 'pending',
          due_at: new Date(Date.now() + 2 * 86400000).toISOString(),
          decision_comment: null,
          decided_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        EnterpriseDataStore.approvals.unshift(approval);
        EnterpriseDataStore.approvalHistory.push({
          id: uuidv4(),
          organization_id: orgId,
          approval_id: approval.id,
          actor_id: userId,
          action: 'submitted',
          comment: `Initiated by automated workflow execution ${workflow.name}`,
          created_at: new Date().toISOString(),
        });
        stepResults.push({ step_id: step.step_id, action: 'request_approval', result_id: approval.id, status: 'success' });
      } else if (step.action_type === 'add_activity') {
        EnterpriseDataStore.activityLogs.unshift({
          id: uuidv4(),
          organization_id: orgId,
          actor_id: userId,
          action: 'WORKFLOW_STEP_COMPLETED',
          resource_type: 'workflow',
          resource_id: workflow.id,
          details: { step_name: step.name, message: step.config?.message || 'Automated action recorded' },
          created_at: new Date().toISOString(),
        });
        stepResults.push({ step_id: step.step_id, action: 'add_activity', status: 'success' });
      } else {
        stepResults.push({ step_id: step.step_id, action: step.action_type, status: 'executed' });
      }
    }

    execution.status = 'completed';
    execution.completed_at = new Date().toISOString();
    execution.result = { executed_steps: stepResults.length, details: stepResults };
  } catch (err: any) {
    execution.status = 'failed';
    execution.error_message = err.message || 'Execution error';
    execution.completed_at = new Date().toISOString();
  }

  res.json({
    success: execution.status === 'completed',
    data: execution,
  });
}

export async function getWorkflowRecommendations(req: AuthenticatedRequest, res: Response) {
  const { workflowId } = req.params;
  const orgId = req.user!.organization_id;

  const workflow = EnterpriseDataStore.workflows.find(w => w.id === workflowId && w.organization_id === orgId);
  if (!workflow) {
    res.status(404).json({
      success: false,
      error: { code: 'WORKFLOW_NOT_FOUND', message: 'Workflow not found.' },
    });
    return;
  }

  const executions = EnterpriseDataStore.workflowExecutions.filter(e => e.workflow_id === workflow.id);
  const recommendations = await recommendWorkflowImprovements(workflow, executions);

  res.json({
    success: true,
    data: recommendations,
  });
}

export async function getWorkflowExecutions(req: AuthenticatedRequest, res: Response) {
  const { workflowId } = req.params;
  const orgId = req.user!.organization_id;

  const executions = EnterpriseDataStore.workflowExecutions
    .filter(e => e.workflow_id === workflowId && e.organization_id === orgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    success: true,
    data: executions,
  });
}
