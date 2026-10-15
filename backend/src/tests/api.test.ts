import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../app';

const DEMO_ADMIN_TOKEN = 'Bearer demo-admin-token';
const DEMO_EMPLOYEE_TOKEN = 'Bearer demo-employee-token';

describe('NexusFlow AI API Tests', () => {
  // 1. Health Endpoint
  it('GET /api/v1/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  // 2. Authentication Enforcement
  it('GET /api/v1/me should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/me should return authenticated user context with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/me')
      .set('Authorization', DEMO_ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@nexusflow.ai');
    expect(res.body.data.user.role).toBe('admin');
  });

  // 3. Task Management & Isolation
  it('GET /api/v1/tasks should list tasks in user organization', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', DEMO_ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/tasks should create a task with validation', async () => {
    const newTask = {
      title: 'Verify Quantum Encryption Key Rotation',
      description: 'Audit automated HSM rotation logs across AWS KMS.',
      priority: 'high',
      status: 'todo',
    };

    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', DEMO_ADMIN_TOKEN)
      .send(newTask);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(newTask.title);
    expect(res.body.data.priority).toBe('high');
  });

  // 4. Task Dependency Cycle Prevention
  it('POST /api/v1/tasks/:id/dependencies should reject circular dependency', async () => {
    const res = await request(app)
      .post('/api/v1/tasks/b1111111-1111-4111-8111-111111111111/dependencies')
      .set('Authorization', DEMO_ADMIN_TOKEN)
      .send({ depends_on_task_id: 'b1111111-1111-4111-8111-111111111111' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('SELF_DEPENDENCY_FORBIDDEN');
  });

  // 5. Dashboard Metrics & AI Summary
  it('GET /api/v1/dashboard/summary should return live database metrics', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/summary')
      .set('Authorization', DEMO_ADMIN_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.total_tasks).toBeGreaterThan(0);
    expect(res.body.data.ai_summary).toBeDefined();
  });

  // 6. Workflow Automation & Idempotency
  it('POST /api/v1/workflows/:id/execute should execute workflow and support idempotency', async () => {
    const execPayload = {
      input: { sample: 'test' },
      idempotency_key: 'test-idemp-key-unique-1',
    };

    const res1 = await request(app)
      .post('/api/v1/workflows/d1111111-1111-4111-8111-111111111111/execute')
      .set('Authorization', DEMO_ADMIN_TOKEN)
      .send(execPayload);

    expect(res1.status).toBe(200);
    expect(res1.body.success).toBe(true);

    // Second execution with same idempotency key must not duplicate
    const res2 = await request(app)
      .post('/api/v1/workflows/d1111111-1111-4111-8111-111111111111/execute')
      .set('Authorization', DEMO_ADMIN_TOKEN)
      .send(execPayload);

    expect(res2.status).toBe(200);
    expect(res2.body.meta?.idempotent_replay).toBe(true);
  });

  // 7. Approvals & Self-Approval Prevention
  it('POST /api/v1/approvals/:id/approve should enforce self-approval restriction policy', async () => {
    // Marcus Brody (manager) is requester for approval e1111111-1111-4111-8111-111111111111
    const res = await request(app)
      .post('/api/v1/approvals/e1111111-1111-4111-8111-111111111111/approve')
      .set('Authorization', 'Bearer demo-manager-token')
      .send({ comment: 'Self approving' });

    expect(res.status).toBe(403);
  });

  // 8. Cross-Organization Protection
  it('Should reject cross-organization access by request parameter', async () => {
    const res = await request(app)
      .get('/api/v1/organizations/00000000-0000-0000-0000-000000000000/members')
      .set('Authorization', DEMO_ADMIN_TOKEN);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CROSS_ORGANIZATION_FORBIDDEN');
  });
});
