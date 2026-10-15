-- 0003_database_functions.sql
-- Database functions and triggers for NexusFlow AI

-- 1. Updated At Trigger Function
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

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS trg_organizations_updated_at ON public.organizations;
CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_departments_updated_at ON public.departments;
CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON public.departments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER trg_task_comments_updated_at
    BEFORE UPDATE ON public.task_comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_workflows_updated_at ON public.workflows;
CREATE TRIGGER trg_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_approvals_updated_at ON public.approvals;
CREATE TRIGGER trg_approvals_updated_at
    BEFORE UPDATE ON public.approvals
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Organization Creation Helper Function (Transaction-safe)
CREATE OR REPLACE FUNCTION public.create_organization_with_admin(
    p_name TEXT,
    p_slug TEXT,
    p_industry TEXT DEFAULT NULL,
    p_settings JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_org_id UUID;
    v_result JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to create an organization';
    END IF;

    -- Ensure profile exists
    INSERT INTO public.profiles (id, full_name)
    VALUES (v_user_id, 'User')
    ON CONFLICT (id) DO NOTHING;

    -- Insert organization
    INSERT INTO public.organizations (name, slug, industry, created_by, settings)
    VALUES (p_name, p_slug, p_industry, v_user_id, p_settings)
    RETURNING id INTO v_org_id;

    -- Create default department
    INSERT INTO public.departments (organization_id, name, description)
    VALUES (v_org_id, 'General Operations', 'Default operations department');

    -- Insert creator as admin in organization_members
    INSERT INTO public.organization_members (organization_id, user_id, role, membership_status)
    VALUES (v_org_id, v_user_id, 'admin', 'active');

    -- Record audit log
    INSERT INTO public.audit_logs (organization_id, actor_id, action, resource_type, resource_id, outcome, metadata)
    VALUES (v_org_id, v_user_id, 'CREATE_ORGANIZATION', 'organization', v_org_id, 'SUCCESS', jsonb_build_object('name', p_name, 'slug', p_slug));

    SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'industry', o.industry,
        'created_at', o.created_at
    ) INTO v_result
    FROM public.organizations o
    WHERE o.id = v_org_id;

    RETURN v_result;
END;
$$;

-- 3. Cycle Detection Function for Task Dependencies
CREATE OR REPLACE FUNCTION public.check_task_dependency_cycle(
    p_task_id UUID,
    p_depends_on_task_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
DECLARE
    v_has_cycle BOOLEAN := false;
BEGIN
    -- Direct self dependency check
    IF p_task_id = p_depends_on_task_id THEN
        RETURN true;
    END IF;

    -- Recursive CTE to detect path from p_depends_on_task_id to p_task_id
    WITH RECURSIVE dep_path AS (
        SELECT depends_on_task_id AS current_task
        FROM public.task_dependencies
        WHERE task_id = p_depends_on_task_id
        
        UNION ALL
        
        SELECT td.depends_on_task_id
        FROM public.task_dependencies td
        JOIN dep_path dp ON td.task_id = dp.current_task
    )
    SELECT EXISTS (
        SELECT 1 FROM dep_path WHERE current_task = p_task_id
    ) INTO v_has_cycle;

    RETURN v_has_cycle;
END;
$$;

-- 4. Atomic Approval Decision Function
CREATE OR REPLACE FUNCTION public.decide_approval(
    p_approval_id UUID,
    p_status TEXT,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_approval RECORD;
    v_is_admin BOOLEAN := false;
    v_allow_self_approval BOOLEAN := false;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF p_status NOT IN ('approved', 'rejected', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status for approval decision';
    END IF;

    -- Lock the row for update
    SELECT * INTO v_approval
    FROM public.approvals
    WHERE id = p_approval_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Approval request not found';
    END IF;

    IF v_approval.status <> 'pending' THEN
        RAISE EXCEPTION 'Approval has already been resolved with status %', v_approval.status;
    END IF;

    -- Check if user is org admin
    v_is_admin := public.check_is_org_admin(v_approval.organization_id);

    -- Check if approver matches or user is admin
    IF v_approval.approver_id <> v_user_id AND NOT v_is_admin THEN
        RAISE EXCEPTION 'You are not authorized to decide this approval';
    END IF;

    -- Self-approval check: if requester is also approver
    SELECT COALESCE((settings->'security'->>'allow_self_approval')::boolean, false)
    INTO v_allow_self_approval
    FROM public.organizations
    WHERE id = v_approval.organization_id;

    IF v_approval.requester_id = v_user_id AND NOT v_allow_self_approval AND p_status = 'approved' THEN
        RAISE EXCEPTION 'Self-approval is prohibited by organization policy';
    END IF;

    -- Update approval
    UPDATE public.approvals
    SET status = p_status,
        decision_comment = p_comment,
        decided_at = now(),
        updated_at = now()
    WHERE id = p_approval_id;

    -- Append to immutable approval history
    INSERT INTO public.approval_history (organization_id, approval_id, actor_id, action, comment)
    VALUES (v_approval.organization_id, p_approval_id, v_user_id, p_status, p_comment);

    -- Notify requester
    INSERT INTO public.notifications (
        organization_id,
        user_id,
        type,
        title,
        message,
        resource_type,
        resource_id
    )
    VALUES (
        v_approval.organization_id,
        v_approval.requester_id,
        'APPROVAL_' || upper(p_status),
        'Approval ' || initcap(p_status),
        'Your request "' || v_approval.title || '" was ' || p_status || '.',
        'approval',
        p_approval_id
    );

    RETURN jsonb_build_object(
        'id', p_approval_id,
        'status', p_status,
        'decided_at', now()
    );
END;
$$;
