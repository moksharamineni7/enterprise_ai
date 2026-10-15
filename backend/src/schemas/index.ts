import { z } from 'zod';

// ==========================================
// 1. Task Schemas
// ==========================================
export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const TaskStatusEnum = z.enum(['todo', 'in_progress', 'blocked', 'completed']);

export const createTaskSchema = z.object({
  title: z.string().min(3).max(160).trim(),
  description: z.string().max(10000).default(''),
  department_id: z.string().uuid().optional().nullable(),
  priority: TaskPriorityEnum.default('medium'),
  status: TaskStatusEnum.default('todo'),
  assignee_id: z.string().uuid().optional().nullable(),
  due_at: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional().nullable(),
  acceptance_criteria: z.array(z.object({
    title: z.string().min(1).max(250),
    completed: z.boolean().default(false),
  })).default([]),
  tags: z.array(z.string().min(1).max(50)).default([]),
  source_document_id: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completed_at: z.string().datetime().optional().nullable(),
});

export const taskFilterSchema = z.object({
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  department_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const createTaskCommentSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

export const createTaskDependencySchema = z.object({
  depends_on_task_id: z.string().uuid(),
});

// ==========================================
// 2. Document Schemas
// ==========================================
export const uploadDocumentSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  category: z.string().min(2).max(50).default('general'),
  department_id: z.string().uuid().optional().nullable(),
  description: z.string().max(2000).optional(),
  related_task_id: z.string().uuid().optional().nullable(),
});

export const acceptActionItemsSchema = z.object({
  action_items: z.array(z.object({
    title: z.string().min(3).max(160),
    description: z.string().max(5000).default(''),
    priority: TaskPriorityEnum.default('medium'),
    due_at: z.string().optional().nullable(),
    assignee_id: z.string().uuid().optional().nullable(),
    department_id: z.string().uuid().optional().nullable(),
  })).min(1),
});

// ==========================================
// 3. Workflow Schemas
// ==========================================
export const WorkflowTriggerTypeEnum = z.enum([
  'manual',
  'task_status_changed',
  'document_analysis_completed',
  'task_created',
  'approval_submitted',
]);

export const WorkflowActionTypeEnum = z.enum([
  'create_task',
  'assign_task',
  'request_approval',
  'update_task_status',
  'add_activity',
  'generate_summary',
]);

export const workflowStepSchema = z.object({
  step_id: z.string().min(1),
  name: z.string().min(1).max(100),
  action_type: WorkflowActionTypeEnum,
  assigned_role: z.enum(['admin', 'manager', 'employee', 'executive']).optional(),
  assigned_user_id: z.string().uuid().optional().nullable(),
  config: z.record(z.any()).default({}),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(3).max(120).trim(),
  description: z.string().max(1000).default(''),
  category: z.string().min(2).max(50).default('general'),
  trigger_type: WorkflowTriggerTypeEnum,
  trigger_config: z.record(z.any()).default({}),
  definition: z.object({
    steps: z.array(workflowStepSchema).min(1).max(20),
  }),
});

export const executeWorkflowSchema = z.object({
  input: z.record(z.any()).default({}),
  idempotency_key: z.string().min(1).max(120).optional(),
});

// ==========================================
// 4. Approval Schemas
// ==========================================
export const createApprovalSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().max(5000).default(''),
  approver_id: z.string().uuid(),
  related_task_id: z.string().uuid().optional().nullable(),
  related_document_id: z.string().uuid().optional().nullable(),
  related_workflow_execution_id: z.string().uuid().optional().nullable(),
  due_at: z.string().optional().nullable(),
});

export const decideApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
  comment: z.string().max(2000).optional(),
});

// ==========================================
// 5. Organization & Member Schemas
// ==========================================
export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  industry: z.string().max(100).optional(),
});

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'employee', 'executive']).default('employee'),
  department_id: z.string().uuid().optional().nullable(),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(10),
});

export const updateMemberSchema = z.object({
  role: z.enum(['admin', 'manager', 'employee', 'executive']).optional(),
  department_id: z.string().uuid().optional().nullable(),
  membership_status: z.enum(['active', 'suspended']).optional(),
});

// ==========================================
// 6. AI Schemas (Section 15 of Prompt)
// ==========================================

// 15.1 Enterprise Document Analysis
export const DocumentAnalysisResultSchema = z.object({
  document_type: z.string().default('general_report'),
  summary: z.string(),
  key_points: z.array(z.object({
    point: z.string(),
    evidence_excerpt: z.string().nullable().optional(),
  })).default([]),
  decisions: z.array(z.object({
    decision: z.string(),
    owner: z.string().nullable().optional(),
    evidence_excerpt: z.string().nullable().optional(),
  })).default([]),
  action_items: z.array(z.object({
    title: z.string(),
    description: z.string().default(''),
    suggested_priority: TaskPriorityEnum.default('medium'),
    suggested_due_date: z.string().nullable().optional(),
    suggested_owner: z.string().nullable().optional(),
    evidence_excerpt: z.string().nullable().optional(),
  })).default([]),
  risks: z.array(z.object({
    description: z.string(),
    severity: TaskPriorityEnum.default('medium'),
    evidence_excerpt: z.string().nullable().optional(),
  })).default([]),
  open_questions: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
});

// 15.2 AI Task Prioritization
export const TaskPrioritizationResultSchema = z.object({
  ranked_tasks: z.array(z.object({
    task_id: z.string().uuid(),
    recommended_rank: z.number().int().positive(),
    recommended_priority: TaskPriorityEnum,
    reason: z.string(),
    risk_if_delayed: z.string(),
    supporting_task_ids: z.array(z.string().uuid()).default([]),
    confidence: z.enum(['low', 'medium', 'high']),
  })),
  overall_summary: z.string(),
  limitations: z.array(z.string()).default([]),
});

// 15.3 Enterprise Question Answering
export const EnterpriseQuestionResultSchema = z.object({
  answer: z.string(),
  key_findings: z.array(z.object({
    finding: z.string(),
    type: z.enum(['verified_fact', 'inference', 'recommendation']),
    supporting_record_ids: z.array(z.string()).default([]),
  })).default([]),
  citations: z.array(z.object({
    record_id: z.string(),
    record_type: z.enum(['task', 'document', 'workflow', 'approval', 'insight']),
    reason: z.string(),
  })).default([]),
  limitations: z.array(z.string()).default([]),
  suggested_next_actions: z.array(z.object({
    action: z.string(),
    requires_confirmation: z.boolean().default(true),
  })).default([]),
});

// 15.4 Operational Insights
export const OperationalInsightsResultSchema = z.object({
  insights: z.array(z.object({
    title: z.string(),
    category: z.enum(['workload', 'deadline', 'approval', 'dependency', 'automation', 'collaboration']),
    severity: TaskPriorityEnum,
    summary: z.string(),
    recommendation: z.string(),
    evidence_record_ids: z.array(z.string()).default([]),
    confidence: z.enum(['low', 'medium', 'high']),
    human_review_required: z.boolean().default(true),
  })),
  overall_summary: z.string(),
  data_limitations: z.array(z.string()).default([]),
});

// 15.5 Workflow Recommendations
export const WorkflowRecommendationsResultSchema = z.object({
  workflow_summary: z.string(),
  bottlenecks: z.array(z.object({
    description: z.string(),
    evidence: z.string(),
    severity: TaskPriorityEnum,
  })).default([]),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    suggested_trigger: WorkflowTriggerTypeEnum,
    suggested_actions: z.array(z.object({
      type: WorkflowActionTypeEnum,
      configuration: z.record(z.any()).default({}),
    })),
    expected_benefit: z.string(),
    requires_human_approval: z.boolean().default(true),
  })),
  limitations: z.array(z.string()).default([]),
});

// 15.6 Operational Summary
export const OperationalSummaryResultSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  highlights: z.array(z.object({
    title: z.string(),
    description: z.string(),
    severity: TaskPriorityEnum,
    supporting_record_ids: z.array(z.string()).default([]),
  })).default([]),
  recommended_next_steps: z.array(z.string()).default([]),
  limitations: z.array(z.string()).default([]),
});
