-- seed.sql
-- Demonstration enterprise data for NexusFlow AI
-- Realistic multi-department organizational dataset

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
    v_dept_leg UUID := 'a4444444-4444-4444-8444-444444444444';
    
    v_task1 UUID := 'b1111111-1111-4111-8111-111111111111';
    v_task2 UUID := 'b2222222-2222-4222-8222-222222222222';
    v_task3 UUID := 'b3333333-3333-4333-8333-333333333333';
    v_task4 UUID := 'b4444444-4444-4444-8444-444444444444';
    
    v_doc1 UUID := 'c1111111-1111-4111-8111-111111111111';
    v_workflow1 UUID := 'd1111111-1111-4111-8111-111111111111';
    v_approval1 UUID := 'e1111111-1111-4111-8111-111111111111';
BEGIN
    -- 1. Create Profiles (Corresponding to seed users)
    INSERT INTO public.profiles (id, full_name, job_title, timezone)
    VALUES 
        (v_admin_id, 'Elena Vance', 'Chief Information Officer', 'America/New_York'),
        (v_manager_id, 'Marcus Brody', 'Director of Engineering Operations', 'America/Chicago'),
        (v_employee_id, 'Sarah Lin', 'Senior Cloud Infrastructure Architect', 'America/Los_Angeles'),
        (v_exec_id, 'David Sterling', 'VP of Global Operations', 'Europe/London')
    ON CONFLICT (id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        job_title = EXCLUDED.job_title;

    -- 2. Create Organization
    INSERT INTO public.organizations (id, name, slug, industry, created_by, settings)
    VALUES (
        v_org_id,
        'Apex Global Technologies',
        'apex-global',
        'Enterprise Cloud & Financial Infrastructure',
        v_admin_id,
        jsonb_build_object(
            'security', jsonb_build_object('allow_self_approval', false, 'mfa_enforced', false),
            'theme', 'navy_corporate'
        )
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Create Departments
    INSERT INTO public.departments (id, organization_id, name, description, manager_id)
    VALUES 
        (v_dept_eng, v_org_id, 'Engineering & IT', 'Core infrastructure, platform engineering, and security', v_manager_id),
        (v_dept_ops, v_org_id, 'Operations & Logistics', 'Enterprise resource management and operational workflows', v_exec_id),
        (v_dept_fin, v_org_id, 'Finance & Procurement', 'Corporate accounting, procurement, and financial audits', v_admin_id),
        (v_dept_leg, v_org_id, 'Legal & Compliance', 'Regulatory policies, risk assessment, and contract management', v_admin_id)
    ON CONFLICT (id) DO NOTHING;

    -- 4. Organization Memberships
    INSERT INTO public.organization_members (organization_id, user_id, department_id, role, membership_status)
    VALUES 
        (v_org_id, v_admin_id, v_dept_eng, 'admin', 'active'),
        (v_org_id, v_manager_id, v_dept_eng, 'manager', 'active'),
        (v_org_id, v_employee_id, v_dept_eng, 'employee', 'active'),
        (v_org_id, v_exec_id, v_dept_ops, 'executive', 'active')
    ON CONFLICT (organization_id, user_id) DO UPDATE SET 
        role = EXCLUDED.role,
        department_id = EXCLUDED.department_id;

    -- 5. Seed Documents
    INSERT INTO public.documents (
        id, organization_id, department_id, uploaded_by, title, description, category,
        storage_path, mime_type, file_size, processing_status, extracted_text, analysis
    )
    VALUES (
        v_doc1,
        v_org_id,
        v_dept_eng,
        v_manager_id,
        'Q3 Architecture & Resiliency Audit Report.pdf',
        'Comprehensive multi-region disaster recovery audit and cloud migration roadmap',
        'architecture',
        v_org_id || '/q3_architecture_audit.pdf',
        'application/pdf',
        2048576,
        'completed',
        'Executive Summary: The Q3 Architecture Review evaluated multi-region failover across AWS us-east-1 and eu-west-1. Current database replication lag averages 420ms, which exceeds the target SLA of 100ms. Action required: Implement automated read-replica failover and upgrade provisioned IOPS by November 15. Key Risks: Delays in network peering renegotiation could stall European disaster recovery testing.',
        jsonb_build_object(
            'document_type', 'technical_architecture_review',
            'summary', 'Audit identifying replication lag exceeding SLA and recommending immediate provisioned IOPS upgrade and automated failover.',
            'key_points', jsonb_build_array(
                jsonb_build_object('point', 'Database replication lag between primary and secondary regions is 420ms (Target: <100ms)', 'evidence_excerpt', 'Current database replication lag averages 420ms'),
                jsonb_build_object('point', 'Multi-region failover SLA compliance requires IOPS overhaul by mid-November', 'evidence_excerpt', 'upgrade provisioned IOPS by November 15')
            ),
            'decisions', jsonb_build_array(
                jsonb_build_object('decision', 'Upgrade database tier and configure automated read-replica failover', 'owner', 'Sarah Lin', 'evidence_excerpt', 'Implement automated read-replica failover')
            ),
            'action_items', jsonb_build_array(
                jsonb_build_object(
                    'title', 'Upgrade database provisioned IOPS to tier 4',
                    'description', 'Configure RDS provisioned IOPS to 12,000 to eliminate replication bottleneck',
                    'suggested_priority', 'critical',
                    'suggested_due_date', (now() + interval '7 days')::text,
                    'suggested_owner', 'Sarah Lin',
                    'evidence_excerpt', 'upgrade provisioned IOPS by November 15'
                )
            ),
            'risks', jsonb_build_array(
                jsonb_build_object(
                    'description', 'European failover tests may stall without finalized carrier cross-connects',
                    'severity', 'high',
                    'evidence_excerpt', 'Delays in network peering renegotiation could stall European disaster recovery testing'
                )
            ),
            'open_questions', jsonb_build_array('Has procurement signed the cross-region network peering contract?'),
            'limitations', jsonb_build_array('Metrics reflect peak load tests during September 2026')
        )
    )
    ON CONFLICT (id) DO NOTHING;

    -- 6. Seed Tasks
    INSERT INTO public.tasks (
        id, organization_id, department_id, title, description, acceptance_criteria,
        status, priority, assignee_id, created_by, due_at, source_document_id, tags
    )
    VALUES 
        (
            v_task1,
            v_org_id,
            v_dept_eng,
            'Complete Multi-Region Disaster Recovery Validation',
            'Conduct automated failover simulations across US-East and EU-West availability zones to verify 99.99% uptime compliance.',
            jsonb_build_array(
                jsonb_build_object('title', 'Failover simulation finishes under 120s', 'completed', true),
                jsonb_build_object('title', 'Zero data loss during replication handoff', 'completed', false)
            ),
            'in_progress',
            'critical',
            v_employee_id,
            v_manager_id,
            now() + interval '3 days',
            v_doc1,
            ARRAY['infrastructure', 'compliance', 'aws']
        ),
        (
            v_task2,
            v_org_id,
            v_dept_eng,
            'Upgrade Database Provisioned IOPS to Tier 4',
            'Execute live database parameter group migration to reduce replication lag below 80ms.',
            jsonb_build_array(
                jsonb_build_object('title', 'Replication lag sustained below 100ms', 'completed', false)
            ),
            'todo',
            'high',
            v_employee_id,
            v_manager_id,
            now() + interval '5 days',
            v_doc1,
            ARRAY['database', 'performance']
        ),
        (
            v_task3,
            v_org_id,
            v_dept_fin,
            'Finalize Enterprise Peering Vendor Invoices',
            'Audit procurement statements for trans-Atlantic fiber transit and submit for controller approval.',
            jsonb_build_array(),
            'blocked',
            'medium',
            v_manager_id,
            v_admin_id,
            now() - interval '2 days', -- Overdue
            NULL,
            ARRAY['finance', 'procurement']
        ),
        (
            v_task4,
            v_org_id,
            v_dept_ops,
            'Annual SOC2 Type II Evidence Aggregation',
            'Collect access logs, policy signoffs, and change management tickets for external auditor review.',
            jsonb_build_array(
                jsonb_build_object('title', 'Access review exported from Okta', 'completed', true),
                jsonb_build_object('title', 'PR signoffs compiled for release 2.4', 'completed', true)
            ),
            'completed',
            'medium',
            v_employee_id,
            v_exec_id,
            now() - interval '10 days',
            NULL,
            ARRAY['audit', 'security']
        )
    ON CONFLICT (id) DO NOTHING;

    -- 7. Task Dependency: Task 1 depends on Task 2
    INSERT INTO public.task_dependencies (organization_id, task_id, depends_on_task_id, created_by)
    VALUES (v_org_id, v_task1, v_task2, v_manager_id)
    ON CONFLICT (task_id, depends_on_task_id) DO NOTHING;

    -- 8. Seed Workflow
    INSERT INTO public.workflows (
        id, organization_id, name, description, category, trigger_type, trigger_config, definition, status, version, created_by
    )
    VALUES (
        v_workflow1,
        v_org_id,
        'Critical Infrastructure Change Protocol',
        'Standard operational procedure for high-risk cloud infrastructure updates requiring manager signoff.',
        'engineering',
        'task_created',
        jsonb_build_object('priority', 'critical'),
        jsonb_build_object(
            'steps', jsonb_build_array(
                jsonb_build_object(
                    'step_id', 'step-1',
                    'name', 'Request Engineering Sign-Off',
                    'action_type', 'request_approval',
                    'config', jsonb_build_object('title', 'Critical Infrastructure Change Verification', 'approver_role', 'manager')
                ),
                jsonb_build_object(
                    'step_id', 'step-2',
                    'name', 'Generate AI Risk Briefing',
                    'action_type', 'generate_summary',
                    'config', jsonb_build_object('scope', 'task_impact')
                ),
                jsonb_build_object(
                    'step_id', 'step-3',
                    'name', 'Log Audit Trail',
                    'action_type', 'add_activity',
                    'config', jsonb_build_object('message', 'Automated workflow initiated for critical infrastructure change.')
                )
            )
        ),
        'published',
        1,
        v_manager_id
    )
    ON CONFLICT (id) DO NOTHING;

    -- 9. Seed Approval Request
    INSERT INTO public.approvals (
        id, organization_id, title, description, requester_id, approver_id,
        related_task_id, status, due_at
    )
    VALUES (
        v_approval1,
        v_org_id,
        'Q4 Multi-Region Infrastructure Budget Extension ($45,000)',
        'Requesting expedited budget authorization to procure secondary region reserved instances and 12k provisioned IOPS.',
        v_manager_id,
        v_exec_id,
        v_task1,
        'pending',
        now() + interval '2 days'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Approval history initial submission
    INSERT INTO public.approval_history (organization_id, approval_id, actor_id, action, comment)
    VALUES (v_org_id, v_approval1, v_manager_id, 'submitted', 'Budget expansion submitted for executive authorization.')
    ON CONFLICT DO NOTHING;

    -- 10. Seed Operational Insight
    INSERT INTO public.insights (
        organization_id, department_id, title, category, severity, summary,
        recommendation, evidence, confidence_label, status
    )
    VALUES (
        v_org_id,
        v_dept_eng,
        'Critical Dependency Risk in Multi-Region Failover Timeline',
        'dependency',
        'critical',
        'Task "Complete Multi-Region Disaster Recovery Validation" is blocked waiting for Database IOPS tier upgrade, while vendor transit invoices are overdue.',
        'Prioritize IOPS upgrade execution today to prevent 7-day spillover into scheduled European disaster recovery testing.',
        jsonb_build_array(v_task1, v_task2, v_task3),
        'high',
        'active'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 11. Seed Notifications
    INSERT INTO public.notifications (
        organization_id, user_id, type, title, message, resource_type, resource_id
    )
    VALUES 
        (
            v_org_id,
            v_employee_id,
            'TASK_ASSIGNED',
            'New High-Priority Task Assigned',
            'Marcus Brody assigned you to "Upgrade Database Provisioned IOPS to Tier 4".',
            'task',
            v_task2
        ),
        (
            v_org_id,
            v_exec_id,
            'APPROVAL_PENDING',
            'Budget Approval Pending',
            'Marcus Brody requested approval for Q4 Multi-Region Infrastructure Budget Extension ($45,000).',
            'approval',
            v_approval1
        );

    -- 12. Seed Activity Logs
    INSERT INTO public.activity_logs (
        organization_id, actor_id, action, resource_type, resource_id, details
    )
    VALUES 
        (
            v_org_id,
            v_manager_id,
            'DOCUMENT_UPLOADED',
            'document',
            v_doc1,
            jsonb_build_object('title', 'Q3 Architecture & Resiliency Audit Report.pdf')
        ),
        (
            v_org_id,
            v_manager_id,
            'TASK_CREATED',
            'task',
            v_task1,
            jsonb_build_object('title', 'Complete Multi-Region Disaster Recovery Validation', 'priority', 'critical')
        );

END $$;
