import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';

import { getAdminClient } from '../lib/supabase';
import { env } from '../config/env';

export async function getHealth(req: AuthenticatedRequest, res: Response) {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'NexusFlow AI Enterprise Backend',
      supabase_configured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
    },
  });
}

export async function getSupabaseStatus(req: AuthenticatedRequest, res: Response) {
  const configured = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  const supabase = getAdminClient();

  if (!configured || !supabase) {
    res.json({
      success: true,
      data: {
        configured: false,
        supabaseUrl: null,
        databaseConnected: false,
        storageConnected: false,
        message: 'Supabase credentials are not configured in environment variables.',
      },
    });
    return;
  }

  let databaseConnected = false;
  let storageConnected = false;
  let schemaReady = false;

  try {
    const { error } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (!error) {
      databaseConnected = true;
      schemaReady = true;
    }
  } catch (err) {
    // table query error
  }

  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (buckets) {
      storageConnected = true;
    }
  } catch (err) {
    // storage query error
  }

  res.json({
    success: true,
    data: {
      configured: true,
      supabaseUrl: env.SUPABASE_URL,
      databaseConnected,
      storageConnected,
      schemaReady,
      message: databaseConnected
        ? 'Connected to Supabase PostgreSQL and Storage.'
        : 'Supabase credentials configured, but database tables could not be queried. Verify schema migrations.',
    },
  });
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  const org = EnterpriseDataStore.organizations.find(o => o.id === req.user!.organization_id);
  const dept = EnterpriseDataStore.departments.find(d => d.id === req.user!.department_id);

  res.json({
    success: true,
    data: {
      user: req.user,
      organization: org || null,
      department: dept || null,
    },
  });
}

export async function createOrganization(req: AuthenticatedRequest, res: Response) {
  const { name, slug, industry } = req.body;
  const userId = req.user?.id || uuidv4();

  const existing = EnterpriseDataStore.organizations.find(o => o.slug === slug);
  if (existing) {
    res.status(409).json({
      success: false,
      error: { code: 'ORGANIZATION_SLUG_EXISTS', message: 'An organization with this slug already exists.' },
    });
    return;
  }

  const newOrg = {
    id: uuidv4(),
    name,
    slug,
    industry: industry || 'Technology & Operations',
    created_by: userId,
    settings: {
      security: { allow_self_approval: false, mfa_enforced: false },
      theme: 'navy_corporate',
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  EnterpriseDataStore.organizations.push(newOrg);

  // Add default department
  const defaultDept = {
    id: uuidv4(),
    organization_id: newOrg.id,
    name: 'General Operations',
    description: 'Default department',
    manager_id: userId,
    created_at: new Date().toISOString(),
  };
  EnterpriseDataStore.departments.push(defaultDept);

  // Add user as admin member
  EnterpriseDataStore.members.push({
    id: uuidv4(),
    organization_id: newOrg.id,
    user_id: userId,
    department_id: defaultDept.id,
    role: 'admin',
    membership_status: 'active',
    joined_at: new Date().toISOString(),
  });

  // Audit log
  EnterpriseDataStore.auditLogs.unshift({
    id: uuidv4(),
    organization_id: newOrg.id,
    actor_id: userId,
    action: 'CREATE_ORGANIZATION',
    resource_type: 'organization',
    resource_id: newOrg.id,
    outcome: 'SUCCESS',
    metadata: { name, slug },
    created_at: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: newOrg,
  });
}

export async function listMembers(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const members = EnterpriseDataStore.members
    .filter(m => m.organization_id === orgId)
    .map(m => {
      const profile = EnterpriseDataStore.profiles.find(p => p.id === m.user_id);
      const dept = EnterpriseDataStore.departments.find(d => d.id === m.department_id);
      return {
        ...m,
        profile: profile || { full_name: 'Team Member', job_title: 'Operations' },
        department: dept || null,
      };
    });

  res.json({
    success: true,
    data: members,
  });
}

export async function createInvitation(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const { email, role, department_id } = req.body;

  const token = 'inv_' + uuidv4().replace(/-/g, '');
  const invitation = {
    id: uuidv4(),
    organization_id: orgId,
    email,
    role: role || 'employee',
    department_id: department_id || null,
    token_hash: token,
    invited_by: req.user!.id,
    expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
    accepted_at: null,
    created_at: new Date().toISOString(),
  };

  EnterpriseDataStore.invitations.push(invitation);

  res.status(201).json({
    success: true,
    data: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      token: token,
      invite_url: `${req.headers.origin || 'http://localhost:5173'}/onboarding?token=${token}`,
      expires_at: invitation.expires_at,
    },
  });
}

export async function acceptInvitation(req: AuthenticatedRequest, res: Response) {
  const { token } = req.body;
  const invitation = EnterpriseDataStore.invitations.find(
    i => i.token_hash === token && !i.accepted_at && new Date(i.expires_at) > new Date()
  );

  if (!invitation) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_INVITATION', message: 'Invitation token is invalid or expired.' },
    });
    return;
  }

  invitation.accepted_at = new Date().toISOString();

  // Create member record for user
  const userId = req.user?.id || uuidv4();
  EnterpriseDataStore.members.push({
    id: uuidv4(),
    organization_id: invitation.organization_id,
    user_id: userId,
    department_id: invitation.department_id,
    role: invitation.role,
    membership_status: 'active',
    joined_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    data: {
      message: 'Invitation accepted successfully.',
      organization_id: invitation.organization_id,
      role: invitation.role,
    },
  });
}

export async function updateMember(req: AuthenticatedRequest, res: Response) {
  const { memberId } = req.params;
  const { role, department_id, membership_status } = req.body;

  const member = EnterpriseDataStore.members.find(
    m => m.id === memberId && m.organization_id === req.user!.organization_id
  );

  if (!member) {
    res.status(404).json({
      success: false,
      error: { code: 'MEMBER_NOT_FOUND', message: 'Organization member not found.' },
    });
    return;
  }

  if (role) member.role = role;
  if (department_id !== undefined) member.department_id = department_id;
  if (membership_status) member.membership_status = membership_status;

  res.json({
    success: true,
    data: member,
  });
}

export async function deleteMember(req: AuthenticatedRequest, res: Response) {
  const { memberId } = req.params;
  const idx = EnterpriseDataStore.members.findIndex(
    m => m.id === memberId && m.organization_id === req.user!.organization_id
  );

  if (idx === -1) {
    res.status(404).json({
      success: false,
      error: { code: 'MEMBER_NOT_FOUND', message: 'Organization member not found.' },
    });
    return;
  }

  EnterpriseDataStore.members.splice(idx, 1);
  res.json({
    success: true,
    data: { message: 'Member removed from organization.' },
  });
}

export async function listDepartments(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const depts = EnterpriseDataStore.departments.filter(d => d.organization_id === orgId);
  res.json({
    success: true,
    data: depts,
  });
}
