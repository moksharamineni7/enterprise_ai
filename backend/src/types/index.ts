import { Request } from 'express';

export type UserRole = 'admin' | 'manager' | 'employee' | 'executive';
export type MembershipStatus = 'active' | 'invited' | 'suspended';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DocumentProcessingStatus = 'uploaded' | 'processing' | 'completed' | 'failed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type InsightSeverity = 'low' | 'medium' | 'high' | 'critical';
export type WorkflowStatus = 'draft' | 'published' | 'archived';
export type WorkflowExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AuthUser {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  organization_id: string;
  department_id?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  token?: string;
  requestId?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
