-- 0002_rls_policies.sql
-- Row Level Security (RLS) for NexusFlow AI

-- Enable RLS on all tables
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

-- Helper security definer functions to prevent infinite recursion in RLS
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

CREATE OR REPLACE FUNCTION public.check_is_org_admin_or_manager(p_org_id UUID)
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
          AND role IN ('admin', 'manager')
          AND membership_status = 'active'
    );
$$;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile or fellow org members profiles"
    ON public.profiles FOR SELECT
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organization_members om1
            JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid() 
              AND om2.user_id = profiles.id
              AND om1.membership_status = 'active'
              AND om2.membership_status = 'active'
        )
    );

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- 2. Organizations Policies
CREATE POLICY "Members can view their organizations"
    ON public.organizations FOR SELECT
    USING (public.check_is_org_member(id) OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Admins can update organization"
    ON public.organizations FOR UPDATE
    USING (public.check_is_org_admin(id));

-- 3. Departments Policies
CREATE POLICY "Members can view departments"
    ON public.departments FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Admins or managers can manage departments"
    ON public.departments FOR ALL
    USING (public.check_is_org_admin_or_manager(organization_id))
    WITH CHECK (public.check_is_org_admin_or_manager(organization_id));

-- 4. Organization Members Policies
CREATE POLICY "Members can view other members in same organization"
    ON public.organization_members FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Admins can insert or modify organization members"
    ON public.organization_members FOR ALL
    USING (public.check_is_org_admin(organization_id))
    WITH CHECK (public.check_is_org_admin(organization_id));

-- 5. Invitations Policies
CREATE POLICY "Admins can view and manage invitations"
    ON public.invitations FOR ALL
    USING (public.check_is_org_admin(organization_id))
    WITH CHECK (public.check_is_org_admin(organization_id));

CREATE POLICY "Invited users can read invitation by valid token hash"
    ON public.invitations FOR SELECT
    USING (expires_at > now() AND accepted_at IS NULL);

-- 6. Tasks Policies
CREATE POLICY "Members can view organization tasks"
    ON public.tasks FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Members can create tasks in their organization"
    ON public.tasks FOR INSERT
    WITH CHECK (
        public.check_is_org_member(organization_id) AND 
        created_by = auth.uid()
    );

CREATE POLICY "Members can update authorized tasks"
    ON public.tasks FOR UPDATE
    USING (
        public.check_is_org_member(organization_id) AND (
            created_by = auth.uid() OR
            assignee_id = auth.uid() OR
            public.check_is_org_admin_or_manager(organization_id)
        )
    );

CREATE POLICY "Admins or task creators can delete tasks"
    ON public.tasks FOR DELETE
    USING (
        public.check_is_org_member(organization_id) AND (
            created_by = auth.uid() OR
            public.check_is_org_admin(organization_id)
        )
    );

-- 7. Task Dependencies Policies
CREATE POLICY "Members can view task dependencies"
    ON public.task_dependencies FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Members can manage task dependencies"
    ON public.task_dependencies FOR ALL
    USING (public.check_is_org_member(organization_id))
    WITH CHECK (public.check_is_org_member(organization_id));

-- 8. Documents Policies
CREATE POLICY "Members can view organization documents"
    ON public.documents FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Members can upload documents"
    ON public.documents FOR INSERT
    WITH CHECK (
        public.check_is_org_member(organization_id) AND 
        uploaded_by = auth.uid()
    );

CREATE POLICY "Uploaders or admins can update documents"
    ON public.documents FOR UPDATE
    USING (
        public.check_is_org_member(organization_id) AND (
            uploaded_by = auth.uid() OR 
            public.check_is_org_admin(organization_id)
        )
    );

CREATE POLICY "Uploaders or admins can delete documents"
    ON public.documents FOR DELETE
    USING (
        public.check_is_org_member(organization_id) AND (
            uploaded_by = auth.uid() OR 
            public.check_is_org_admin(organization_id)
        )
    );

-- 9. Task Comments Policies
CREATE POLICY "Members can view comments"
    ON public.task_comments FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Members can post comments"
    ON public.task_comments FOR INSERT
    WITH CHECK (
        public.check_is_org_member(organization_id) AND 
        author_id = auth.uid()
    );

CREATE POLICY "Authors can update own comments"
    ON public.task_comments FOR UPDATE
    USING (author_id = auth.uid());

CREATE POLICY "Authors or admins can delete comments"
    ON public.task_comments FOR DELETE
    USING (author_id = auth.uid() OR public.check_is_org_admin(organization_id));

-- 10. Workflows Policies
CREATE POLICY "Members can view workflows"
    ON public.workflows FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Managers and Admins can manage workflows"
    ON public.workflows FOR ALL
    USING (public.check_is_org_admin_or_manager(organization_id))
    WITH CHECK (public.check_is_org_admin_or_manager(organization_id));

-- 11. Workflow Executions Policies
CREATE POLICY "Members can view workflow executions"
    ON public.workflow_executions FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Members can trigger workflow executions"
    ON public.workflow_executions FOR INSERT
    WITH CHECK (public.check_is_org_member(organization_id));

CREATE POLICY "System/Authorized users can update executions"
    ON public.workflow_executions FOR UPDATE
    USING (public.check_is_org_member(organization_id));

-- 12. Approvals Policies
CREATE POLICY "Relevant members can view approvals"
    ON public.approvals FOR SELECT
    USING (
        public.check_is_org_member(organization_id) AND (
            requester_id = auth.uid() OR
            approver_id = auth.uid() OR
            public.check_is_org_admin_or_manager(organization_id)
        )
    );

CREATE POLICY "Members can create approval requests"
    ON public.approvals FOR INSERT
    WITH CHECK (
        public.check_is_org_member(organization_id) AND 
        requester_id = auth.uid()
    );

CREATE POLICY "Approver or Admin can decide approvals"
    ON public.approvals FOR UPDATE
    USING (
        public.check_is_org_member(organization_id) AND (
            approver_id = auth.uid() OR 
            public.check_is_org_admin(organization_id)
        )
    );

-- 13. Approval History Policies
CREATE POLICY "Members can view approval history"
    ON public.approval_history FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Append-only approval history"
    ON public.approval_history FOR INSERT
    WITH CHECK (
        public.check_is_org_member(organization_id) AND 
        actor_id = auth.uid()
    );

-- 14. Conversations Policies
CREATE POLICY "Users can only view their own conversations"
    ON public.conversations FOR SELECT
    USING (
        public.check_is_org_member(organization_id) AND 
        user_id = auth.uid()
    );

CREATE POLICY "Users can create conversations in their org"
    ON public.conversations FOR INSERT
    WITH CHECK (
        public.check_is_org_member(organization_id) AND 
        user_id = auth.uid()
    );

CREATE POLICY "Users can update or delete own conversations"
    ON public.conversations FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 15. Conversation Messages Policies
CREATE POLICY "Users can view messages from their conversations"
    ON public.conversation_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_messages.conversation_id 
              AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to their conversations"
    ON public.conversation_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c 
            WHERE c.id = conversation_messages.conversation_id 
              AND c.user_id = auth.uid()
        )
    );

-- 16. Insights Policies
CREATE POLICY "Members can view insights"
    ON public.insights FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Admins or Managers can manage insights"
    ON public.insights FOR ALL
    USING (public.check_is_org_admin_or_manager(organization_id))
    WITH CHECK (public.check_is_org_admin_or_manager(organization_id));

-- 17. Notifications Policies
CREATE POLICY "Users can only view their own notifications"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Members or system can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (public.check_is_org_member(organization_id));

-- 18. Activity Logs Policies
CREATE POLICY "Members can view activity logs"
    ON public.activity_logs FOR SELECT
    USING (public.check_is_org_member(organization_id));

CREATE POLICY "Members can append activity logs"
    ON public.activity_logs FOR INSERT
    WITH CHECK (public.check_is_org_member(organization_id));

-- 19. Audit Logs Policies
CREATE POLICY "Admins and Managers can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.check_is_org_admin_or_manager(organization_id));

CREATE POLICY "System/Members can append audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.check_is_org_member(organization_id));
