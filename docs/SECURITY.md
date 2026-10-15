# NexusFlow AI — Security & Compliance Architecture

## 1. Zero Client Secrets Principle
- **Google Gemini API Key (`GEMINI_API_KEY`)**: Configured and accessed exclusively on the Node.js backend. Never exposed to browser bundles, Vite environment variables, or client responses.
- **Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)**: Stored strictly in the server environment for privileged administrative operations. Frontend code only consumes public anonymous keys with Row Level Security enforced.

---

## 2. Threat Modeling & Defenses

| Threat Category | Potential Attack Vector | NexusFlow AI Mitigation |
| :--- | :--- | :--- |
| **Cross-Tenant Data Leakage** | Modifying `organization_id` in requests or guessing record UUIDs | 1. Database RLS enabled on all 19 tables.<br>2. Middleware `requireOrgMember` verifies user membership.<br>3. Cross-org parameter checks block ID substitution. |
| **Privilege Escalation** | Self-assigning `admin` role during registration or profile update | 1. Public registration defaults strictly to `employee`.<br>2. Only verified org admins can modify roles.<br>3. `Profiles` table updates cannot alter privileges. |
| **Prompt Injection** | Embedding malicious jailbreak instructions inside uploaded PDFs or comments | 1. Untrusted content is treated as inert data, bounded in length.<br>2. Strict JSON response schema modes enforced via Zod.<br>3. Gemini cannot execute arbitrary SQL or shell commands. |
| **Approval Fraud** | Requester approving their own procurement or budget request | Dual-control self-approval prohibition enforced in both the database function `decide_approval` and backend controller. |
| **Workflow Replay & Loops** | Replaying webhook triggers to create duplicate tasks or looping executions | 1. Idempotency keys checked against unique database index.<br>2. Maximum step limit (20) and depth limit (5) enforced. |
| **Denial of Service (DoS)** | Bombarding expensive Gemini endpoints or uploading huge files | 1. Global rate limiter (300 req / 15 min).<br>2. Dedicated AI rate limiter (10 req / min).<br>3. File upload cap (10MB) and memory limits. |

---

## 3. Database Security & RLS
- Every organization table has `ROW LEVEL SECURITY` enabled.
- Helper functions (`check_is_org_member`, `check_is_org_admin`) are marked `SECURITY DEFINER` with fixed `search_path = public, pg_temp` to eliminate privilege escalation via search_path hijacking.
- Mutually recursive RLS policies are prevented by relying on stable lookup functions.

---

## 4. File Upload & Storage Security
- Uploaded business documents are validated using both declared MIME type and file extension (`.pdf`, `.txt`, `.md`, `.docx`). Executable formats (`.exe`, `.sh`, `.bat`, `.js`) are rejected.
- Files reside in a private Supabase Storage bucket (`enterprise-documents`).
- Download access requires active organization membership verified via storage RLS policies.

---

## 5. Audit Logging & Compliance
- System actions (organization creation, workflow triggers, document indexing, approval resolutions) are written to an append-only `audit_logs` table.
- Passwords, tokens, and raw API keys are explicitly redacted before log ingestion.
