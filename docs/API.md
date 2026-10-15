# NexusFlow AI — REST API Reference (`/api/v1`)

All endpoints use JSON request and response payloads with standard response envelopes.
Authentication is delivered via `Authorization: Bearer <token>`.

### Standard Response Envelope

#### Success:
```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

#### Error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable safe explanation.",
    "details": []
  }
}
```

---

## 1. Authentication & Enterprise Identity

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Health check & service status | Public |
| `GET` | `/api/v1/me` | Authenticated user, active org, and department | Authenticated |
| `POST` | `/api/v1/organizations` | Create an organization and assign creator as admin | Authenticated |
| `GET` | `/api/v1/organizations/:id/members` | List members in organization | Member |
| `POST` | `/api/v1/organizations/:id/invitations` | Generate invitation token | Admin |
| `POST` | `/api/v1/invitations/accept` | Accept an invitation token | Authenticated |
| `PATCH` | `/api/v1/organizations/:id/members/:mId` | Update member role/dept | Admin |
| `DELETE` | `/api/v1/organizations/:id/members/:mId` | Remove member from org | Admin |
| `GET` | `/api/v1/organizations/:id/departments` | List organization departments | Member |

---

## 2. Dashboard Analytics

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/summary` | Real-time counts (total, overdue, due soon, approvals, workflows, AI summary) |
| `GET` | `/api/v1/dashboard/activity` | Recent audit and operational activity logs |
| `GET` | `/api/v1/dashboard/trends` | Weekly task velocity and status distribution |

---

## 3. Tasks & Dependencies

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/tasks` | List & filter tasks by `status`, `priority`, `department_id`, `search` |
| `POST` | `/api/v1/tasks` | Create deliverable task with criteria and due date |
| `GET` | `/api/v1/tasks/:id` | Retrieve task with assignee, dependencies, comments, and blockers |
| `PATCH` | `/api/v1/tasks/:id` | Update task fields (status, priority, criteria, etc.) |
| `DELETE` | `/api/v1/tasks/:id` | Delete task |
| `POST` | `/api/v1/tasks/:id/comments` | Post comment to task discussion thread |
| `POST` | `/api/v1/tasks/:id/dependencies` | Add preceding task dependency (enforces cycle detection) |
| `DELETE` | `/api/v1/tasks/:id/dependencies/:depId` | Remove dependency |
| `POST` | `/api/v1/tasks/ai-prioritize-all` | Trigger AI task prioritization with Gemini ranking |

---

## 4. Document Intelligence

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/documents` | List uploaded enterprise documents |
| `POST` | `/api/v1/documents/upload` | Multipart upload (PDF, TXT, MD, DOCX <= 10MB) & start analysis |
| `GET` | `/api/v1/documents/:id` | Retrieve document details and structured Gemini analysis |
| `POST` | `/api/v1/documents/:id/analyze` | Re-trigger or retry document analysis |
| `GET` | `/api/v1/documents/:id/status` | Check processing status (`uploaded`, `processing`, `completed`, `failed`) |
| `POST` | `/api/v1/documents/:id/action-items` | 1-click convert accepted action items into persistent tasks |
| `DELETE` | `/api/v1/documents/:id` | Delete document |

---

## 5. Nexus AI Conversational Assistant

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/conversations` | List user's conversations |
| `POST` | `/api/v1/conversations` | Create a new conversation session |
| `GET` | `/api/v1/conversations/:id/messages` | Retrieve message history |
| `POST` | `/api/v1/conversations/:id/messages` | Send user inquiry and receive grounded answer with verified citations |
| `PATCH` | `/api/v1/conversations/:id` | Rename conversation |
| `DELETE` | `/api/v1/conversations/:id` | Delete conversation |

---

## 6. Workflow Automation

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/workflows` | List workflows | Member |
| `POST` | `/api/v1/workflows` | Create workflow graph | Mgr / Admin |
| `GET` | `/api/v1/workflows/:id` | Workflow details & step graph | Member |
| `POST` | `/api/v1/workflows/:id/publish` | Validate & publish workflow | Mgr / Admin |
| `POST` | `/api/v1/workflows/:id/execute` | Deterministic execution with idempotency | Member |
| `GET` | `/api/v1/workflows/:id/executions` | Execution audit history | Member |
| `POST` | `/api/v1/workflows/:id/recommendations` | Gemini process audit recommendations | Member |

---

## 7. Approval Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/approvals` | List approvals (filterable by `status`) |
| `POST` | `/api/v1/approvals` | Submit approval request |
| `GET` | `/api/v1/approvals/:id` | Retrieve approval with audit history |
| `POST` | `/api/v1/approvals/:id/approve` | Authorize request (enforces self-approval policy) |
| `POST` | `/api/v1/approvals/:id/reject` | Reject request with reviewer justification note |

---

## 8. Operational Insights, Search & Notifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/insights` | List active operational bottlenecks & risks |
| `POST` | `/api/v1/insights/generate` | Synthesize new insights using Gemini on live DB metrics |
| `PATCH` | `/api/v1/insights/:id` | Dismiss or update insight status |
| `GET` | `/api/v1/search?q=` | Global multi-entity search (tasks, docs, workflows, members) |
| `GET` | `/api/v1/notifications` | User's in-app notification feed |
| `PATCH` | `/api/v1/notifications/:id/read`| Mark specific notification as read |
| `POST` | `/api/v1/notifications/read-all`| Mark all notifications as read |
| `GET` | `/api/v1/audit-logs` | Retrieve compliance and audit stream (Admin/Mgr/Exec only) |
| `GET` | `/api/v1/organizations/:id/settings` | Get organization security settings |
| `PATCH` | `/api/v1/organizations/:id/settings`| Update organization settings (e.g. `allow_self_approval`) |
