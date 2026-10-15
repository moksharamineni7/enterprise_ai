# NexusFlow AI — Intelligent Enterprise Operations Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Gemini SDK](https://img.shields.io/badge/@google/genai-0.2.0-orange.svg)](https://www.npmjs.com/package/@google/genai)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ecf8e.svg)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passed-brightgreen.svg)]()

> A centralized operational intelligence layer for modern organizations connecting employees, departments, tasks, documents, workflows, and evidence-based AI insights.

---

## 1. What Questions Does NexusFlow AI Answer?

1. **What work needs attention right now?**
   - Live operational dashboard with overdue flags, due-soon tracking, and algorithmic/LLM task prioritization.
2. **Which tasks, approvals, or workflows are delayed?**
   - Multi-tier approval queue with reviewer feedback, self-approval prevention policies, and bottleneck analysis.
3. **What information can be extracted from enterprise documents?**
   - Automated server-side text parsing (PDF, TXT, MD, DOCX) and Gemini structured extraction of decisions, deadlines, operational risks, and 1-click task creation.
4. **Which actions can be automated or delegated?**
   - Deterministic server-side workflow engine supporting manual, status-change, or document-driven triggers with idempotency protection.
5. **What decisions should managers prioritize based on available evidence?**
   - Evidence-grounded operational insights linking verified PostgreSQL record IDs to quantifiable bottlenecks and confidence scores.

---

## 2. Technology Architecture

### Frontend
- **Framework**: React 18 with TypeScript strict mode
- **Bundler & Tooling**: Vite 6
- **Routing**: React Router DOM v7
- **Styling & Design System**: Tailwind CSS v3 with corporate navy (`#0b132b`, `#1c2541`), slate, and dark glassmorphism
- **State Management**: TanStack Query v5 + Context API
- **Visualizations**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js 20+ LTS with Express.js & TypeScript
- **AI Integration**: Official `@google/genai` SDK
- **Validation**: Strict Zod schemas across all HTTP parameters and Gemini outputs
- **Security**: Helmet headers, restrictive CORS, rate-limiting, request-id tracing, centralized error handling
- **File Processing**: Multer + `pdf-parse`

### Database & Security
- **Engine**: Supabase PostgreSQL 15
- **Data Isolation**: Row Level Security (RLS) on all 19 organization tables
- **Storage**: Private Supabase Storage bucket (`enterprise-documents`)
- **Functions**: Atomic approval transactions (`decide_approval`), recursive dependency cycle detection (`check_task_dependency_cycle`), and organization initialization.

---

## 3. Fast Demonstration & Evaluator Personas

The application includes pre-configured enterprise demonstration accounts for immediate evaluation:

| Persona | Name | Role | Access Scope |
| :--- | :--- | :--- | :--- |
| **Executive Admin** | Elena Vance | `admin` | Organization settings, member permissions, security audit logs |
| **Operations Manager** | Marcus Brody | `manager` | Workflow builder, task assignment, department oversight |
| **Senior Engineer** | Sarah Lin | `employee` | Deliverables, document analysis, task acceptance |
| **VP Operations** | David Sterling | `executive` | High-level KPI trends, multi-region budget approvals |

> **Evaluator Tip:** In the top navigation bar, use the **Persona Switcher** dropdown to toggle between roles without re-authenticating.

---

## 4. Quick Start Guide

### Prerequisites
- Node.js 20+ LTS
- npm 10+

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd "Enterprise -AI"

# Install all workspace dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key variables:
```env
PORT=3000
APP_BASE_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# Google Gemini (Required for live Gemini LLM calls)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Supabase (Optional for local testing; demo data operates out of the box)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Running Locally
```bash
# Terminal 1: Launch Backend API (Port 3000)
npm run dev:backend

# Terminal 2: Launch Frontend App (Port 5173)
npm run dev:frontend
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Automated Test Suite

Run the comprehensive unit, integration, and security test suites:

```bash
# Run all tests across backend and frontend
npm test

# Run backend tests individually
npm run test --workspace=backend

# Run frontend tests individually
npm run test --workspace=frontend
```

---

## 6. Project Structure

```text
Enterprise -AI/
├── package.json               # Monorepo workspaces
├── tsconfig.base.json         # Base TypeScript strict config
├── .env.example               # Environment variables specification
├── docker-compose.yml         # Container orchestration
├── backend/
│   ├── src/
│   │   ├── config/            # Zod validated env config
│   │   ├── controllers/       # Task, Document, Assistant, Workflow, Approval controllers
│   │   ├── middleware/        # Auth, RLS, Rate Limit, Error Handling
│   │   ├── repositories/      # Enterprise data store & DB abstraction
│   │   ├── routes/            # REST API endpoints under /api/v1
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── services/          # Gemini SDK service & workflow runner
│   │   ├── tests/             # Vitest API integration tests
│   │   └── server.ts          # Express server entrypoint
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # UI primitives & application shell (Sidebar, TopNav)
│   │   ├── pages/             # Dashboard, Tasks, Docs, Nexus AI, Workflows, Approvals
│   │   ├── lib/               # HTTP API client & Auth context
│   │   ├── types/             # Shared TypeScript interfaces
│   │   └── App.tsx            # Routes configuration
│   └── Dockerfile
├── supabase/
│   ├── migrations/            # 0001 (Schema) to 0005 (Storage policies)
│   └── seed.sql               # Enterprise seed dataset (Apex Global Technologies)
└── docs/
    ├── ARCHITECTURE.md        # System design & sequence flows
    ├── SECURITY.md            # OWASP mitigations & prompt injection defense
    ├── DATABASE.md            # Schema dictionary & migration guide
    ├── API.md                 # Complete REST API reference
    └── DEPLOYMENT.md          # Production Docker deployment guide
```

---

## 7. License
Proprietary Enterprise Software. Developed for NexusFlow AI.
