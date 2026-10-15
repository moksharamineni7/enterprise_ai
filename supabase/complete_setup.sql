-- ==============================================================================
-- NEXUSFLOW AI: COMPLETE SUPABASE PRODUCTION DATABASE SETUP
-- Description: Consolidated, idempotent migration & seed script
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. CORE TABLES
-- ==============================================================================

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    industry TEXT,
    created_by UUID,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    job_title TEXT,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dept_org_name UNIQUE (organization_id, name)
);

-- Organization Members
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'executive')),
    membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'invited', 'suspended')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_member UNIQUE (organization_id, user_id)
);

-- Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee', 'executive')),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    token_hash TEXT NOT NULL UNIQUE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 160),
    description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 10000),
    acceptance_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    due_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    source_document_id UUID,
    tags TEXT[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task Dependencies
CREATE TABLE IF NOT EXISTS public.task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_task_dependency UNIQUE (task_id, depends_on_task_id),
    CONSTRAINT chk_no_self_dependency CHECK (task_id <> depends_on_task_id)
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL CHECK (char_length(title) >= 1 AND char_length(title) <= 255),
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
    processing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    extracted_text TEXT,
    analysis JSONB,
    related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task Comments
CREATE TABLE IF NOT EXISTS public.task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflows
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 120),
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    trigger_type TEXT NOT NULL,
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    definition JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Workflow Executions
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE RESTRICT,
    workflow_version INTEGER NOT NULL,
    trigger_event_id TEXT,
    idempotency_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    input JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_workflow_execution_idempotency UNIQUE (organization_id, workflow_id, idempotency_key)
);

-- Approvals
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
    description TEXT,
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    approver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    related_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    related_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    related_workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    due_at TIMESTAMPTZ,
    decision_comment TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Approval History (Append-only audit)
CREATE TABLE IF NOT EXISTS public.approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    approval_id UUID NOT NULL REFERENCES public.approvals(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation Messages
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insights
CREATE TABLE IF NOT EXISTS public.insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_label TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'dismissed', 'resolved')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    idempotency_key TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_user_idempotency ON public.notifications (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    outcome TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. FUNCTIONS & TRIGGERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_departments_updated_at ON public.departments;
CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_workflows_updated_at ON public.workflows;
CREATE TRIGGER trg_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_approvals_updated_at ON public.approvals;
CREATE TRIGGER trg_approvals_updated_at BEFORE UPDATE ON public.approvals FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Helper Security Definer Functions
CREATE OR REPLACE FUNCTION public.check_is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = p_org_id 
          AND user_id = auth.uid()
          AND membership_status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_role(p_org_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
    SELECT role 
    FROM public.organization_members 
    WHERE organization_id = p_org_id 
      AND user_id = auth.uid()
      AND membership_status = 'active'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.check_is_org_admin(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members 
        WHERE organization_id = p_org_id 
          AND user_id = auth.uid()
          AND role = 'admin'
          AND membership_status = 'active'
    );
$$;

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
DROP POLICY IF EXISTS "Organizations: Read by active members" ON public.organizations;
CREATE POLICY "Organizations: Read by active members" ON public.organizations FOR SELECT USING (public.check_is_org_member(id));

-- Tasks policies
DROP POLICY IF EXISTS "Tasks: Read by org members" ON public.tasks;
CREATE POLICY "Tasks: Read by org members" ON public.tasks FOR SELECT USING (public.check_is_org_member(organization_id));

DROP POLICY IF EXISTS "Tasks: Insert by org members" ON public.tasks;
CREATE POLICY "Tasks: Insert by org members" ON public.tasks FOR INSERT WITH CHECK (public.check_is_org_member(organization_id));

DROP POLICY IF EXISTS "Tasks: Update by org members" ON public.tasks;
CREATE POLICY "Tasks: Update by org members" ON public.tasks FOR UPDATE USING (public.check_is_org_member(organization_id));

-- Documents policies
DROP POLICY IF EXISTS "Documents: Read by org members" ON public.documents;
CREATE POLICY "Documents: Read by org members" ON public.documents FOR SELECT USING (public.check_is_org_member(organization_id));

DROP POLICY IF EXISTS "Documents: Insert by org members" ON public.documents;
CREATE POLICY "Documents: Insert by org members" ON public.documents FOR INSERT WITH CHECK (public.check_is_org_member(organization_id));

-- Profiles policies
DROP POLICY IF EXISTS "Profiles: Viewable by anyone authenticated" ON public.profiles;
CREATE POLICY "Profiles: Viewable by anyone authenticated" ON public.profiles FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Profiles: Update own profile" ON public.profiles;
CREATE POLICY "Profiles: Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==============================================================================
-- 5. STORAGE BUCKET
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'enterprise-documents', 
    'enterprise-documents', 
    false, 
    10485760, 
    ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 10485760;

-- ==============================================================================
-- 6. SEED USERS & DEMO DATA
-- ==============================================================================

DO $$
DECLARE
    v_admin_id UUID := '11111111-1111-4111-a111-111111111111';
    v_manager_id UUID := '22222222-2222-4222-a222-222222222222';
    v_employee_id UUID := '33333333-3333-4333-a333-333333333333';
    v_exec_id UUID := '44444444-4444-4444-a444-444444444444';
    v_org_id UUID := '99999999-9999-4999-a999-999999999999';
    v_dept_eng UUID := 'a1111111-1111-4111-8111-111111111111';
    v_dept_ops UUID := 'a2222222-2222-4222-8222-222222222222';
    v_dept_fin UUID := 'a3333333-3333-4333-8333-333333333333';
BEGIN
    -- 6.1 Create Auth Users
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES 
        (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@nexusflow.ai', crypt('EnterprisePass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Elena Vance"}', now(), now()),
        (v_manager_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manager@nexusflow.ai', crypt('EnterprisePass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marcus Brody"}', now(), now()),
        (v_employee_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'employee@nexusflow.ai', crypt('EnterprisePass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sarah Lin"}', now(), now()),
        (v_exec_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'executive@nexusflow.ai', crypt('EnterprisePass123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Sterling"}', now(), now())
    ON CONFLICT (id) DO NOTHING;

    -- 6.2 Create Profiles
    INSERT INTO public.profiles (id, full_name, job_title, timezone)
    VALUES 
        (v_admin_id, 'Elena Vance', 'Chief Information Officer', 'America/New_York'),
        (v_manager_id, 'Marcus Brody', 'Director of Engineering Operations', 'America/Chicago'),
        (v_employee_id, 'Sarah Lin', 'Senior Cloud Infrastructure Architect', 'America/Los_Angeles'),
        (v_exec_id, 'David Sterling', 'VP of Global Operations', 'Europe/London')
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- 6.3 Create Organization
    INSERT INTO public.organizations (id, name, slug, industry, created_by, settings)
    VALUES (
        v_org_id,
        'Apex Global Technologies',
        'apex-global',
        'Enterprise Cloud & Financial Infrastructure',
        v_admin_id,
        '{"security":{"allow_self_approval":false,"mfa_enforced":false},"theme":"navy_corporate"}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING;

    -- 6.4 Create Departments
    INSERT INTO public.departments (id, organization_id, name, description, manager_id)
    VALUES 
        (v_dept_eng, v_org_id, 'Engineering & IT', 'Core infrastructure and security', v_manager_id),
        (v_dept_ops, v_org_id, 'Operations & Logistics', 'Enterprise resource management', v_exec_id),
        (v_dept_fin, v_org_id, 'Finance & Procurement', 'Corporate accounting and procurement', v_admin_id)
    ON CONFLICT (id) DO NOTHING;

    -- 6.5 Organization Members
    INSERT INTO public.organization_members (organization_id, user_id, department_id, role, membership_status)
    VALUES 
        (v_org_id, v_admin_id, v_dept_eng, 'admin', 'active'),
        (v_org_id, v_manager_id, v_dept_eng, 'manager', 'active'),
        (v_org_id, v_employee_id, v_dept_eng, 'employee', 'active'),
        (v_org_id, v_exec_id, v_dept_ops, 'executive', 'active')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 6.6 Sample Tasks
    INSERT INTO public.tasks (id, organization_id, department_id, title, description, status, priority, assignee_id, created_by, due_at)
    VALUES 
        ('b1111111-1111-4111-8111-111111111111', v_org_id, v_dept_eng, 'Production Kubernetes Cluster Security Hardening', 'Audit RBAC permissions, enable network policies, and rotate cluster TLS certificates.', 'in_progress', 'critical', v_employee_id, v_manager_id, now() + interval '2 days'),
        ('b2222222-2222-4222-8222-222222222222', v_org_id, v_dept_eng, 'PostgreSQL Database Connection Pooling Tuning', 'Optimize Supabase PgBouncer pool sizing for peak operational workloads.', 'todo', 'high', v_employee_id, v_manager_id, now() + interval '5 days'),
        ('b3333333-3333-4333-8333-333333333333', v_org_id, v_dept_ops, 'Q4 Enterprise Operational Vendor Compliance Audit', 'Review SOC2 and ISO27001 certifications across all critical cloud vendors.', 'todo', 'medium', v_exec_id, v_admin_id, now() + interval '10 days')
    ON CONFLICT (id) DO NOTHING;

END $$;
