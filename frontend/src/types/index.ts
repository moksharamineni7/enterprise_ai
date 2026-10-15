export type UserRole = 'admin' | 'manager' | 'employee' | 'executive';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DocumentProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'failed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  organization_id: string;
  department_id?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  settings?: Record<string, any>;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
}

export interface Task {
  id: string;
  organization_id: string;
  department_id?: string | null;
  title: string;
  description: string;
  acceptance_criteria: Array<{ title: string; completed: boolean }>;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id?: string | null;
  created_by: string;
  due_at?: string | null;
  completed_at?: string | null;
  source_document_id?: string | null;
  tags: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  assignee?: { id: string; full_name: string; job_title: string } | null;
  department?: { id: string; name: string } | null;
  dependencies_count?: number;
}

export interface DocumentItem {
  id: string;
  organization_id: string;
  department_id?: string | null;
  uploaded_by: string;
  title: string;
  description?: string;
  category: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  processing_status: DocumentProcessingStatus;
  processing_error?: string | null;
  extracted_text?: string;
  analysis?: {
    document_type: string;
    summary: string;
    key_points: Array<{ point: string; evidence_excerpt?: string | null }>;
    decisions: Array<{ decision: string; owner?: string | null; evidence_excerpt?: string | null }>;
    action_items: Array<{
      title: string;
      description: string;
      suggested_priority: TaskPriority;
      suggested_due_date?: string | null;
      suggested_owner?: string | null;
      evidence_excerpt?: string | null;
    }>;
    risks: Array<{ description: string; severity: TaskPriority; evidence_excerpt?: string | null }>;
    open_questions: string[];
    limitations: string[];
  } | null;
  related_task_id?: string | null;
  created_at: string;
  uploader?: { full_name: string; job_title: string } | null;
  department?: { name: string } | null;
}

export interface WorkflowItem {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  category: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  definition: {
    steps: Array<{
      step_id: string;
      name: string;
      action_type: string;
      assigned_role?: string;
      assigned_user_id?: string;
      config: Record<string, any>;
    }>;
  };
  status: 'draft' | 'published' | 'archived';
  version: number;
  created_by: string;
  created_at: string;
  creator?: { full_name: string; job_title: string } | null;
  executions_count?: number;
  last_executed_at?: string | null;
}

export interface WorkflowExecutionItem {
  id: string;
  workflow_id: string;
  workflow_version: number;
  trigger_event_id: string;
  idempotency_key: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  result?: any;
  error_message?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface ApprovalItem {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  requester_id: string;
  approver_id: string;
  related_task_id?: string | null;
  related_document_id?: string | null;
  status: ApprovalStatus;
  due_at?: string | null;
  decision_comment?: string | null;
  decided_at?: string | null;
  created_at: string;
  requester?: { full_name: string; job_title: string } | null;
  approver?: { full_name: string; job_title: string } | null;
  related_task?: { title: string; priority: TaskPriority } | null;
  history?: Array<{
    id: string;
    action: string;
    comment?: string | null;
    created_at: string;
    actor?: { full_name: string; job_title: string } | null;
  }>;
}

export interface InsightItem {
  id: string;
  organization_id: string;
  department_id?: string | null;
  title: string;
  category: string;
  severity: InsightSeverity;
  summary: string;
  recommendation: string;
  evidence: string[];
  confidence_label?: string;
  status: 'active' | 'dismissed' | 'resolved';
  generated_at: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  resource_type?: string;
  resource_id?: string;
  read_at?: string | null;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Array<{
    record_id: string;
    record_type: 'task' | 'document' | 'workflow' | 'approval' | 'insight';
    reason: string;
  }>;
  created_at: string;
}
