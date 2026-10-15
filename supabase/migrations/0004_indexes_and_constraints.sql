-- 0004_indexes_and_constraints.sql
-- Indexes and performance optimization for NexusFlow AI

-- 1. Tasks Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_org_status ON public.tasks (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_org_priority ON public.tasks (organization_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_org_assignee ON public.tasks (organization_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org_dept ON public.tasks (organization_id, department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org_due ON public.tasks (organization_id, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (organization_id, created_at DESC);

-- 2. Task Dependencies Indexes
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON public.task_dependencies (task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON public.task_dependencies (depends_on_task_id);

-- 3. Documents Indexes
CREATE INDEX IF NOT EXISTS idx_documents_org_status ON public.documents (organization_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_documents_org_cat ON public.documents (organization_id, category);
CREATE INDEX IF NOT EXISTS idx_documents_org_uploaded ON public.documents (organization_id, uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents (organization_id, created_at DESC);

-- 4. Workflows & Executions Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_org_status ON public.workflows (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_workflows_org_trigger ON public.workflows (organization_id, trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_org_workflow ON public.workflow_executions (organization_id, workflow_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_exec_idempotency ON public.workflow_executions (organization_id, idempotency_key);

-- 5. Approvals Indexes
CREATE INDEX IF NOT EXISTS idx_approvals_org_status ON public.approvals (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_org_approver ON public.approvals (organization_id, approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_org_requester ON public.approvals (organization_id, requester_id);

-- 6. Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_idempotency ON public.notifications (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 7. Activity & Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON public.activity_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON public.activity_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs (organization_id, created_at DESC);

-- 8. Insights Indexes
CREATE INDEX IF NOT EXISTS idx_insights_org_status ON public.insights (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_insights_org_severity ON public.insights (organization_id, severity);

-- 9. Conversations Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_org_user ON public.conversations (organization_id, user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_messages_conv_created ON public.conversation_messages (conversation_id, created_at ASC);
