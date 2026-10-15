import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';
import { prioritizeEnterpriseTasks } from '../services/gemini.service';

// Cycle check helper
function hasCycle(taskId: string, targetId: string, visited = new Set<string>()): boolean {
  if (taskId === targetId) return true;
  if (visited.has(taskId)) return false;
  visited.add(taskId);

  const deps = EnterpriseDataStore.taskDependencies.filter(td => td.task_id === taskId);
  for (const dep of deps) {
    if (hasCycle(dep.depends_on_task_id, targetId, visited)) {
      return true;
    }
  }
  return false;
}

export async function listTasks(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  let tasks = EnterpriseDataStore.tasks.filter(t => t.organization_id === orgId);

  const { status, priority, department_id, assignee_id, search } = req.query as any;

  if (status) tasks = tasks.filter(t => t.status === status);
  if (priority) tasks = tasks.filter(t => t.priority === priority);
  if (department_id) tasks = tasks.filter(t => t.department_id === department_id);
  if (assignee_id) tasks = tasks.filter(t => t.assignee_id === assignee_id);
  if (search) {
    const s = search.toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s));
  }

  // Hydrate with assignee and department
  const hydrated = tasks.map(t => {
    const assignee = EnterpriseDataStore.profiles.find(p => p.id === t.assignee_id);
    const department = EnterpriseDataStore.departments.find(d => d.id === t.department_id);
    const deps = EnterpriseDataStore.taskDependencies.filter(td => td.task_id === t.id);
    return {
      ...t,
      assignee: assignee ? { id: assignee.id, full_name: assignee.full_name, job_title: assignee.job_title } : null,
      department: department ? { id: department.id, name: department.name } : null,
      dependencies_count: deps.length,
    };
  });

  res.json({
    success: true,
    data: hydrated,
    meta: {
      total: hydrated.length,
    },
  });
}

export async function getTaskById(req: AuthenticatedRequest, res: Response) {
  const { taskId } = req.params;
  const orgId = req.user!.organization_id;

  const task = EnterpriseDataStore.tasks.find(t => t.id === taskId && t.organization_id === orgId);
  if (!task) {
    res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found in your organization.' },
    });
    return;
  }

  const assignee = EnterpriseDataStore.profiles.find(p => p.id === task.assignee_id);
  const creator = EnterpriseDataStore.profiles.find(p => p.id === task.created_by);
  const department = EnterpriseDataStore.departments.find(d => d.id === task.department_id);
  const comments = EnterpriseDataStore.taskComments
    .filter(c => c.task_id === task.id)
    .map(c => {
      const author = EnterpriseDataStore.profiles.find(p => p.id === c.author_id);
      return {
        ...c,
        author: author ? { full_name: author.full_name, job_title: author.job_title } : { full_name: 'Author' },
      };
    });

  const dependencies = EnterpriseDataStore.taskDependencies
    .filter(td => td.task_id === task.id)
    .map(td => {
      const target = EnterpriseDataStore.tasks.find(t => t.id === td.depends_on_task_id);
      return {
        dependency_id: td.id,
        task: target ? { id: target.id, title: target.title, status: target.status, priority: target.priority } : null,
      };
    });

  const dependentOnThis = EnterpriseDataStore.taskDependencies
    .filter(td => td.depends_on_task_id === task.id)
    .map(td => {
      const parent = EnterpriseDataStore.tasks.find(t => t.id === td.task_id);
      return {
        dependency_id: td.id,
        task: parent ? { id: parent.id, title: parent.title, status: parent.status, priority: parent.priority } : null,
      };
    });

  res.json({
    success: true,
    data: {
      ...task,
      assignee: assignee || null,
      creator: creator || null,
      department: department || null,
      comments,
      dependencies,
      blocked_by_this: dependentOnThis,
    },
  });
}

export async function createTask(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const body = req.body;

  const newTask = {
    id: uuidv4(),
    organization_id: orgId,
    department_id: body.department_id || req.user!.department_id || null,
    title: body.title,
    description: body.description || '',
    acceptance_criteria: body.acceptance_criteria || [],
    status: body.status || 'todo',
    priority: body.priority || 'medium',
    assignee_id: body.assignee_id || null,
    created_by: userId,
    due_at: body.due_at || null,
    completed_at: body.status === 'completed' ? new Date().toISOString() : null,
    source_document_id: body.source_document_id || null,
    tags: body.tags || [],
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  EnterpriseDataStore.tasks.unshift(newTask);

  // Activity log
  EnterpriseDataStore.activityLogs.unshift({
    id: uuidv4(),
    organization_id: orgId,
    actor_id: userId,
    action: 'TASK_CREATED',
    resource_type: 'task',
    resource_id: newTask.id,
    details: { title: newTask.title, priority: newTask.priority },
    created_at: new Date().toISOString(),
  });

  // Notify assignee if not creator
  if (newTask.assignee_id && newTask.assignee_id !== userId) {
    EnterpriseDataStore.notifications.unshift({
      id: uuidv4(),
      organization_id: orgId,
      user_id: newTask.assignee_id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `${req.user!.full_name} assigned you to "${newTask.title}".`,
      resource_type: 'task',
      resource_id: newTask.id,
      idempotency_key: `notif-task-assigned-${newTask.id}-${newTask.assignee_id}`,
      read_at: null,
      created_at: new Date().toISOString(),
    });
  }

  res.status(201).json({
    success: true,
    data: newTask,
  });
}

export async function updateTask(req: AuthenticatedRequest, res: Response) {
  const { taskId } = req.params;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;

  const task = EnterpriseDataStore.tasks.find(t => t.id === taskId && t.organization_id === orgId);
  if (!task) {
    res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found in your organization.' },
    });
    return;
  }

  const prevStatus = task.status;
  const prevAssignee = task.assignee_id;

  Object.assign(task, req.body, {
    updated_at: new Date().toISOString(),
  });

  if (req.body.status === 'completed' && prevStatus !== 'completed') {
    task.completed_at = new Date().toISOString();
  } else if (req.body.status && req.body.status !== 'completed') {
    task.completed_at = null;
  }

  // Activity log
  EnterpriseDataStore.activityLogs.unshift({
    id: uuidv4(),
    organization_id: orgId,
    actor_id: userId,
    action: 'TASK_UPDATED',
    resource_type: 'task',
    resource_id: task.id,
    details: { changes: Object.keys(req.body) },
    created_at: new Date().toISOString(),
  });

  // Notify new assignee if changed
  if (task.assignee_id && task.assignee_id !== prevAssignee && task.assignee_id !== userId) {
    EnterpriseDataStore.notifications.unshift({
      id: uuidv4(),
      organization_id: orgId,
      user_id: task.assignee_id,
      type: 'TASK_ASSIGNED',
      title: 'Task Reassigned',
      message: `You were assigned to "${task.title}".`,
      resource_type: 'task',
      resource_id: task.id,
      idempotency_key: `notif-reassign-${task.id}-${Date.now()}`,
      read_at: null,
      created_at: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: task,
  });
}

export async function deleteTask(req: AuthenticatedRequest, res: Response) {
  const { taskId } = req.params;
  const orgId = req.user!.organization_id;

  const idx = EnterpriseDataStore.tasks.findIndex(t => t.id === taskId && t.organization_id === orgId);
  if (idx === -1) {
    res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found.' },
    });
    return;
  }

  EnterpriseDataStore.tasks.splice(idx, 1);
  // Clean dependencies
  EnterpriseDataStore.taskDependencies = EnterpriseDataStore.taskDependencies.filter(
    td => td.task_id !== taskId && td.depends_on_task_id !== taskId
  );

  res.json({
    success: true,
    data: { message: 'Task deleted successfully.' },
  });
}

export async function addComment(req: AuthenticatedRequest, res: Response) {
  const { taskId } = req.params;
  const orgId = req.user!.organization_id;
  const { content } = req.body;

  const task = EnterpriseDataStore.tasks.find(t => t.id === taskId && t.organization_id === orgId);
  if (!task) {
    res.status(404).json({
      success: false,
      error: { code: 'TASK_NOT_FOUND', message: 'Task not found.' },
    });
    return;
  }

  const comment = {
    id: uuidv4(),
    organization_id: orgId,
    task_id: taskId,
    author_id: req.user!.id,
    content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  EnterpriseDataStore.taskComments.push(comment);

  const author = EnterpriseDataStore.profiles.find(p => p.id === req.user!.id);
  res.status(201).json({
    success: true,
    data: {
      ...comment,
      author: author ? { full_name: author.full_name, job_title: author.job_title } : { full_name: 'Author' },
    },
  });
}

export async function addDependency(req: AuthenticatedRequest, res: Response) {
  const { taskId } = req.params;
  const { depends_on_task_id } = req.body;
  const orgId = req.user!.organization_id;

  if (taskId === depends_on_task_id) {
    res.status(400).json({
      success: false,
      error: { code: 'SELF_DEPENDENCY_FORBIDDEN', message: 'A task cannot depend on itself.' },
    });
    return;
  }

  // Verify target task in same org
  const target = EnterpriseDataStore.tasks.find(t => t.id === depends_on_task_id && t.organization_id === orgId);
  if (!target) {
    res.status(404).json({
      success: false,
      error: { code: 'TARGET_TASK_NOT_FOUND', message: 'Dependent target task not found in your organization.' },
    });
    return;
  }

  // Check cycles
  if (hasCycle(depends_on_task_id, taskId)) {
    res.status(400).json({
      success: false,
      error: { code: 'DEPENDENCY_CYCLE_DETECTED', message: 'This dependency would create a circular loop.' },
    });
    return;
  }

  const dep = {
    id: uuidv4(),
    organization_id: orgId,
    task_id: taskId,
    depends_on_task_id,
    created_by: req.user!.id,
    created_at: new Date().toISOString(),
  };

  EnterpriseDataStore.taskDependencies.push(dep);

  res.status(201).json({
    success: true,
    data: dep,
  });
}

export async function deleteDependency(req: AuthenticatedRequest, res: Response) {
  const { dependencyId } = req.params;
  const idx = EnterpriseDataStore.taskDependencies.findIndex(td => td.id === dependencyId);
  if (idx === -1) {
    res.status(404).json({
      success: false,
      error: { code: 'DEPENDENCY_NOT_FOUND', message: 'Task dependency not found.' },
    });
    return;
  }

  EnterpriseDataStore.taskDependencies.splice(idx, 1);
  res.json({
    success: true,
    data: { message: 'Dependency removed successfully.' },
  });
}

export async function aiPrioritizeAll(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const tasks = EnterpriseDataStore.tasks.filter(t => t.organization_id === orgId && t.status !== 'completed');

  if (tasks.length === 0) {
    res.json({
      success: true,
      data: {
        ranked_tasks: [],
        overall_summary: 'No active tasks to prioritize.',
        limitations: [],
      },
    });
    return;
  }

  const result = await prioritizeEnterpriseTasks(tasks);
  res.json({
    success: true,
    data: result,
  });
}
