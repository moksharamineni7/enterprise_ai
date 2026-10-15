import { v4 as uuidv4 } from 'uuid';
import { getAdminClient } from '../lib/supabase';

// In-Memory store initialized with realistic enterprise seed data matching seed.sql
export class EnterpriseDataStore {
  public static organizations: any[] = [
    {
      id: '99999999-9999-4999-a999-999999999999',
      name: 'Apex Global Technologies',
      slug: 'apex-global',
      industry: 'Enterprise Cloud & Financial Infrastructure',
      created_by: '11111111-1111-4111-a111-111111111111',
      settings: {
        security: { allow_self_approval: false, mfa_enforced: false },
        theme: 'navy_corporate',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public static profiles: any[] = [
    {
      id: '11111111-1111-4111-a111-111111111111',
      full_name: 'Elena Vance',
      job_title: 'Chief Information Officer',
      timezone: 'America/New_York',
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: '22222222-2222-4222-a222-222222222222',
      full_name: 'Marcus Brody',
      job_title: 'Director of Engineering Operations',
      timezone: 'America/Chicago',
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: '33333333-3333-4333-a333-333333333333',
      full_name: 'Sarah Lin',
      job_title: 'Senior Cloud Infrastructure Architect',
      timezone: 'America/Los_Angeles',
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
    {
      id: '44444444-4444-4444-a444-444444444444',
      full_name: 'David Sterling',
      job_title: 'VP of Global Operations',
      timezone: 'Europe/London',
      avatar_url: null,
      created_at: new Date().toISOString(),
    },
  ];

  public static departments: any[] = [
    {
      id: 'a1111111-1111-4111-8111-111111111111',
      organization_id: '99999999-9999-4999-a999-999999999999',
      name: 'Engineering & IT',
      description: 'Core infrastructure, platform engineering, and security',
      manager_id: '22222222-2222-4222-a222-222222222222',
      created_at: new Date().toISOString(),
    },
    {
      id: 'a2222222-2222-4222-8222-222222222222',
      organization_id: '99999999-9999-4999-a999-999999999999',
      name: 'Operations & Logistics',
      description: 'Enterprise resource management and operational workflows',
      manager_id: '44444444-4444-4444-a444-444444444444',
      created_at: new Date().toISOString(),
    },
    {
      id: 'a3333333-3333-4333-8333-333333333333',
      organization_id: '99999999-9999-4999-a999-999999999999',
      name: 'Finance & Procurement',
      description: 'Corporate accounting, procurement, and financial audits',
      manager_id: '11111111-1111-4111-a111-111111111111',
      created_at: new Date().toISOString(),
    },
    {
      id: 'a4444444-4444-4444-8444-444444444444',
      organization_id: '99999999-9999-4999-a999-999999999999',
      name: 'Legal & Compliance',
      description: 'Regulatory policies, risk assessment, and contract management',
      manager_id: '11111111-1111-4111-a111-111111111111',
      created_at: new Date().toISOString(),
    },
  ];

  public static members: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      user_id: '11111111-1111-4111-a111-111111111111',
      department_id: 'a1111111-1111-4111-8111-111111111111',
      role: 'admin',
      membership_status: 'active',
      joined_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      user_id: '22222222-2222-4222-a222-222222222222',
      department_id: 'a1111111-1111-4111-8111-111111111111',
      role: 'manager',
      membership_status: 'active',
      joined_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      user_id: '33333333-3333-4333-a333-333333333333',
      department_id: 'a1111111-1111-4111-8111-111111111111',
      role: 'employee',
      membership_status: 'active',
      joined_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      user_id: '44444444-4444-4444-a444-444444444444',
      department_id: 'a2222222-2222-4222-8222-222222222222',
      role: 'executive',
      membership_status: 'active',
      joined_at: new Date().toISOString(),
    },
  ];

  public static tasks: any[] = [
    {
      id: 'b1111111-1111-4111-8111-111111111111',
      organization_id: '99999999-9999-4999-a999-999999999999',
      department_id: 'a1111111-1111-4111-8111-111111111111',
      title: 'Complete Multi-Region Disaster Recovery Validation',
      description: 'Conduct automated failover simulations across US-East and EU-West availability zones to verify 99.99% uptime compliance.',
      acceptance_criteria: [
        { title: 'Failover simulation finishes under 120s', completed: true },
        { title: 'Zero data loss during replication handoff', completed: false },
      ],
      status: 'in_progress',
      priority: 'critical',
      assignee_id: '33333333-3333-4333-a333-333333333333',
      created_by: '22222222-2222-4222-a222-222222222222',
      due_at: new Date(Date.now() + 3 * 86400000).toISOString(),
      completed_at: null,
      source_document_id: 'c1111111-1111-4111-8111-111111111111',
      tags: ['infrastructure', 'compliance', 'aws'],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'b2222222-2222-4222-8222-222222222222',
      organization_id: '99999999-9999-4999-a999-999999999999',
      department_id: 'a1111111-1111-4111-8111-111111111111',
      title: 'Upgrade Database Provisioned IOPS to Tier 4',
      description: 'Execute live database parameter group migration to reduce replication lag below 80ms.',
      acceptance_criteria: [
        { title: 'Replication lag sustained below 100ms', completed: false },
      ],
      status: 'todo',
      priority: 'high',
      assignee_id: '33333333-3333-4333-a333-333333333333',
      created_by: '22222222-2222-4222-a222-222222222222',
      due_at: new Date(Date.now() + 5 * 86400000).toISOString(),
      completed_at: null,
      source_document_id: 'c1111111-1111-4111-8111-111111111111',
      tags: ['database', 'performance'],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'b3333333-3333-4333-8333-333333333333',
      organization_id: '99999999-9999-4999-a999-999999999999',
      department_id: 'a3333333-3333-4333-8333-333333333333',
      title: 'Finalize Enterprise Peering Vendor Invoices',
      description: 'Audit procurement statements for trans-Atlantic fiber transit and submit for controller approval.',
      acceptance_criteria: [],
      status: 'blocked',
      priority: 'medium',
      assignee_id: '22222222-2222-4222-a222-222222222222',
      created_by: '11111111-1111-4111-a111-111111111111',
      due_at: new Date(Date.now() - 2 * 86400000).toISOString(), // Overdue
      completed_at: null,
      source_document_id: null,
      tags: ['finance', 'procurement'],
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'b4444444-4444-4444-8444-444444444444',
      organization_id: '99999999-9999-4999-a999-999999999999',
      department_id: 'a2222222-2222-4222-8222-222222222222',
      title: 'Annual SOC2 Type II Evidence Aggregation',
      description: 'Collect access logs, policy signoffs, and change management tickets for external auditor review.',
      acceptance_criteria: [
        { title: 'Access review exported from Okta', completed: true },
        { title: 'PR signoffs compiled for release 2.4', completed: true },
      ],
      status: 'completed',
      priority: 'medium',
      assignee_id: '33333333-3333-4333-a333-333333333333',
      created_by: '44444444-4444-4444-a444-444444444444',
      due_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      completed_at: new Date(Date.now() - 9 * 86400000).toISOString(),
      source_document_id: null,
      tags: ['audit', 'security'],
      metadata: {},
      created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public static taskDependencies: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      task_id: 'b1111111-1111-4111-8111-111111111111',
      depends_on_task_id: 'b2222222-2222-4222-8222-222222222222',
      created_by: '22222222-2222-4222-a222-222222222222',
      created_at: new Date().toISOString(),
    },
  ];

  public static taskComments: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      task_id: 'b1111111-1111-4111-8111-111111111111',
      author_id: '22222222-2222-4222-a222-222222222222',
      content: 'Please ensure our secondary region failover test is coordinated with the European NOC.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];

  public static documents: any[] = [
    {
      id: 'c1111111-1111-4111-8111-111111111111',
      organization_id: '99999999-9999-4999-a999-999999999999',
      department_id: 'a1111111-1111-4111-8111-111111111111',
      uploaded_by: '22222222-2222-4222-a222-222222222222',
      title: 'Q3 Architecture & Resiliency Audit Report.pdf',
      description: 'Comprehensive multi-region disaster recovery audit and cloud migration roadmap',
      category: 'architecture',
      storage_path: '99999999-9999-4999-a999-999999999999/q3_architecture_audit.pdf',
      mime_type: 'application/pdf',
      file_size: 2048576,
      processing_status: 'completed',
      processing_error: null,
      extracted_text: 'Executive Summary: The Q3 Architecture Review evaluated multi-region failover across AWS us-east-1 and eu-west-1. Current database replication lag averages 420ms, which exceeds the target SLA of 100ms. Action required: Implement automated read-replica failover and upgrade provisioned IOPS by November 15. Key Risks: Delays in network peering renegotiation could stall European disaster recovery testing.',
      analysis: {
        document_type: 'technical_architecture_review',
        summary: 'Audit identifying replication lag exceeding SLA and recommending immediate provisioned IOPS upgrade and automated failover.',
        key_points: [
          { point: 'Database replication lag between primary and secondary regions is 420ms (Target: <100ms)', evidence_excerpt: 'Current database replication lag averages 420ms' },
          { point: 'Multi-region failover SLA compliance requires IOPS overhaul by mid-November', evidence_excerpt: 'upgrade provisioned IOPS by November 15' },
        ],
        decisions: [
          { decision: 'Upgrade database tier and configure automated read-replica failover', owner: 'Sarah Lin', evidence_excerpt: 'Implement automated read-replica failover' },
        ],
        action_items: [
          {
            title: 'Upgrade database provisioned IOPS to tier 4',
            description: 'Configure RDS provisioned IOPS to 12,000 to eliminate replication bottleneck',
            suggested_priority: 'critical',
            suggested_due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
            suggested_owner: 'Sarah Lin',
            evidence_excerpt: 'upgrade provisioned IOPS by November 15',
          },
        ],
        risks: [
          {
            description: 'European failover tests may stall without finalized carrier cross-connects',
            severity: 'high',
            evidence_excerpt: 'Delays in network peering renegotiation could stall European disaster recovery testing',
          },
        ],
        open_questions: ['Has procurement signed the cross-region network peering contract?'],
        limitations: ['Metrics reflect peak load tests during September 2026'],
      },
      related_task_id: 'b1111111-1111-4111-8111-111111111111',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public static workflows: any[] = [
    {
      id: 'd1111111-1111-4111-8111-111111111111',
      organization_id: '99999999-9999-4999-a999-999999999999',
      name: 'Critical Infrastructure Change Protocol',
      description: 'Standard operational procedure for high-risk cloud infrastructure updates requiring manager signoff.',
      category: 'engineering',
      trigger_type: 'task_created',
      trigger_config: { priority: 'critical' },
      definition: {
        steps: [
          {
            step_id: 'step-1',
            name: 'Request Engineering Sign-Off',
            action_type: 'request_approval',
            config: { title: 'Critical Infrastructure Change Verification', approver_role: 'manager' },
          },
          {
            step_id: 'step-2',
            name: 'Generate AI Risk Briefing',
            action_type: 'generate_summary',
            config: { scope: 'task_impact' },
          },
          {
            step_id: 'step-3',
            name: 'Log Audit Trail',
            action_type: 'add_activity',
            config: { message: 'Automated workflow initiated for critical infrastructure change.' },
          },
        ],
      },
      status: 'published',
      version: 1,
      created_by: '22222222-2222-4222-a222-222222222222',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public static workflowExecutions: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      workflow_id: 'd1111111-1111-4111-8111-111111111111',
      workflow_version: 1,
      trigger_event_id: 'init-seed-trigger',
      idempotency_key: 'seed-exec-1',
      status: 'completed',
      input: { task_id: 'b1111111-1111-4111-8111-111111111111' },
      result: { executed_steps: 3, output: 'Sign-off approval and audit logs generated.' },
      error_message: null,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      completed_at: new Date(Date.now() - 3590000).toISOString(),
      created_by: '22222222-2222-4222-a222-222222222222',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  public static approvals: any[] = [
    {
      id: 'e1111111-1111-4111-8111-111111111111',
      organization_id: '99999999-9999-4999-a999-999999999999',
      title: 'Q4 Multi-Region Infrastructure Budget Extension ($45,000)',
      description: 'Requesting expedited budget authorization to procure secondary region reserved instances and 12k provisioned IOPS.',
      requester_id: '22222222-2222-4222-a222-222222222222',
      approver_id: '44444444-4444-4444-a444-444444444444',
      related_task_id: 'b1111111-1111-4111-8111-111111111111',
      related_document_id: null,
      related_workflow_execution_id: null,
      status: 'pending',
      due_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      decision_comment: null,
      decided_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public static approvalHistory: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      approval_id: 'e1111111-1111-4111-8111-111111111111',
      actor_id: '22222222-2222-4222-a222-222222222222',
      action: 'submitted',
      comment: 'Budget expansion submitted for executive authorization.',
      created_at: new Date().toISOString(),
    },
  ];

  public static conversations: any[] = [
    {
      id: 'f1111111-1111-4111-8111-111111111111',
      organization_id: '99999999-9999-4999-a999-999999999999',
      user_id: '11111111-1111-4111-a111-111111111111',
      title: 'Infrastructure Risk Assessment',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  public static conversationMessages: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      conversation_id: 'f1111111-1111-4111-8111-111111111111',
      user_id: '11111111-1111-4111-a111-111111111111',
      role: 'user',
      content: 'What are our most critical delayed tasks and pending approvals?',
      citations: [],
      created_at: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      conversation_id: 'f1111111-1111-4111-8111-111111111111',
      user_id: null,
      role: 'assistant',
      content: 'Based on authorized database records, you have 1 critical blocked task: "Finalize Enterprise Peering Vendor Invoices" (overdue by 2 days) and 1 pending executive approval: "Q4 Multi-Region Infrastructure Budget Extension ($45,000)".',
      citations: [
        { record_id: 'b3333333-3333-4333-8333-333333333333', record_type: 'task', reason: 'Overdue blocked task' },
        { record_id: 'e1111111-1111-4111-8111-111111111111', record_type: 'approval', reason: 'Pending executive sign-off' },
      ],
      created_at: new Date(Date.now() - 590000).toISOString(),
    },
  ];

  public static insights: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      department_id: 'a1111111-1111-4111-8111-111111111111',
      title: 'Critical Dependency Risk in Multi-Region Failover Timeline',
      category: 'dependency',
      severity: 'critical',
      summary: 'Task "Complete Multi-Region Disaster Recovery Validation" is blocked waiting for Database IOPS tier upgrade, while vendor transit invoices are overdue.',
      recommendation: 'Prioritize IOPS upgrade execution today to prevent 7-day spillover into scheduled European disaster recovery testing.',
      evidence: ['b1111111-1111-4111-8111-111111111111', 'b2222222-2222-4222-8222-222222222222', 'b3333333-3333-4333-8333-333333333333'],
      confidence_label: 'high',
      status: 'active',
      generated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ];

  public static notifications: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      user_id: '33333333-3333-4333-a333-333333333333',
      type: 'TASK_ASSIGNED',
      title: 'New High-Priority Task Assigned',
      message: 'Marcus Brody assigned you to "Upgrade Database Provisioned IOPS to Tier 4".',
      resource_type: 'task',
      resource_id: 'b2222222-2222-4222-8222-222222222222',
      idempotency_key: 'seed-notif-1',
      read_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      user_id: '44444444-4444-4444-a444-444444444444',
      type: 'APPROVAL_PENDING',
      title: 'Budget Approval Pending',
      message: 'Marcus Brody requested approval for Q4 Multi-Region Infrastructure Budget Extension ($45,000).',
      resource_type: 'approval',
      resource_id: 'e1111111-1111-4111-8111-111111111111',
      idempotency_key: 'seed-notif-2',
      read_at: null,
      created_at: new Date().toISOString(),
    },
  ];

  public static activityLogs: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      actor_id: '22222222-2222-4222-a222-222222222222',
      action: 'DOCUMENT_UPLOADED',
      resource_type: 'document',
      resource_id: 'c1111111-1111-4111-8111-111111111111',
      details: { title: 'Q3 Architecture & Resiliency Audit Report.pdf' },
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      actor_id: '22222222-2222-4222-a222-222222222222',
      action: 'TASK_CREATED',
      resource_type: 'task',
      resource_id: 'b1111111-1111-4111-8111-111111111111',
      details: { title: 'Complete Multi-Region Disaster Recovery Validation', priority: 'critical' },
      created_at: new Date(Date.now() - 3500000).toISOString(),
    },
  ];

  public static auditLogs: any[] = [
    {
      id: uuidv4(),
      organization_id: '99999999-9999-4999-a999-999999999999',
      actor_id: '11111111-1111-4111-a111-111111111111',
      action: 'CREATE_ORGANIZATION',
      resource_type: 'organization',
      resource_id: '99999999-9999-4999-a999-999999999999',
      outcome: 'SUCCESS',
      metadata: { name: 'Apex Global Technologies', slug: 'apex-global' },
      created_at: new Date().toISOString(),
    },
  ];

  public static invitations: any[] = [];
}
