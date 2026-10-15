# NexusFlow AI — PostgreSQL Database & Migrations Reference

## 1. Schema Overview
NexusFlow AI uses a fully normalized, relational schema in PostgreSQL 15, managed through version-controlled Supabase migrations.

### Table Inventory (19 Tables)

| Table | Primary Key | Description | RLS Policy |
| :--- | :--- | :--- | :--- |
| `organizations` | `id UUID` | Enterprise workspace identity and security settings | Org members / Creator |
| `profiles` | `id UUID` | User profiles extending `auth.users` | Self / Org Co-members |
| `departments` | `id UUID` | Departmental divisions (Engineering, Ops, Finance, Legal) | Org members |
| `organization_members`| `id UUID` | User membership, roles (`admin`, `manager`, `employee`, `executive`) | Org members (Edit by Admin) |
| `invitations` | `id UUID` | Cryptographically hashed invitation tokens with TTL | Admin / Token Holder |
| `tasks` | `id UUID` | Enterprise deliverables with priorities and criteria | Org members / Assignees |
| `task_dependencies` | `id UUID` | Preceding / blocking dependencies between tasks | Org members |
| `documents` | `id UUID` | Uploaded enterprise files, extracted text, and Gemini analysis | Org members |
| `task_comments` | `id UUID` | Collaboration comment threads on tasks | Org members |
| `workflows` | `id UUID` | Configurable deterministic automation definitions | Org members (Edit by Mgr/Admin)|
| `workflow_executions`| `id UUID` | Execution traces and step outcomes | Org members |
| `approvals` | `id UUID` | Multi-tier authorization requests | Requester / Approver / Admin |
| `approval_history` | `id UUID` | Append-only audit trail of approval actions | Org members |
| `conversations` | `id UUID` | Nexus AI conversational chat sessions | Session Owner |
| `conversation_messages`| `id UUID` | User and assistant chat messages with citations | Session Owner |
| `insights` | `id UUID` | Synthesized operational bottlenecks and risks | Org members |
| `notifications` | `id UUID` | In-app alerts with idempotency keys | Recipient User |
| `activity_logs` | `id UUID` | High-level organizational event stream | Org members |
| `audit_logs` | `id UUID` | Compliance and security log entries | Mgr / Admin / Executive |

---

## 2. Migration Execution Order

Migrations must be executed in numeric sequence:

1. `supabase/migrations/0001_initial_schema.sql`:
   - Installs `uuid-ossp` and `pgcrypto`.
   - Creates all 19 tables with UUID defaults, foreign keys, and check constraints.
2. `supabase/migrations/0002_rls_policies.sql`:
   - Enables `ROW LEVEL SECURITY` on all 19 tables.
   - Defines security definer helper functions (`check_is_org_member`, `check_is_org_admin`, etc.).
   - Attaches granular SELECT, INSERT, UPDATE, and DELETE policies.
3. `supabase/migrations/0003_database_functions.sql`:
   - `handle_updated_at()` trigger function and triggers for tables.
   - `create_organization_with_admin()` transaction function.
   - `check_task_dependency_cycle()` recursive CTE cycle check.
   - `decide_approval()` atomic approval transaction with self-approval policy validation.
4. `supabase/migrations/0004_indexes_and_constraints.sql`:
   - Compound indexes for dashboard queries and task filtering.
   - Unique idempotency constraint on `workflow_executions (organization_id, idempotency_key)`.
   - Partial unique index on `notifications (user_id, idempotency_key)`.
5. `supabase/migrations/0005_storage_policies.sql`:
   - Configures the private `enterprise-documents` storage bucket (10MB limit).
   - Establishes storage RLS policies restricting file read/write to verified organization members.
6. `supabase/seed.sql`:
   - Populates realistic demonstration organization: **Apex Global Technologies** (`apex-global`).
   - Seeds 4 user personas (`admin`, `manager`, `employee`, `executive`), 4 departments, 4 tasks with dependencies, a technical architecture document with complete analysis, an automated workflow, an active approval request, and operational insights.
