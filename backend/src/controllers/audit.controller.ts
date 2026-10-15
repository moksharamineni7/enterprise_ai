import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';

export async function listAuditLogs(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const logs = EnterpriseDataStore.auditLogs
    .filter(a => a.organization_id === orgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(log => {
      const actor = EnterpriseDataStore.profiles.find(p => p.id === log.actor_id);
      return {
        ...log,
        actor: actor ? { full_name: actor.full_name, job_title: actor.job_title } : { full_name: 'System Actor' },
      };
    });

  res.json({
    success: true,
    data: logs,
  });
}

export async function getOrganizationSettings(req: AuthenticatedRequest, res: Response) {
  const { organizationId } = req.params;
  const org = EnterpriseDataStore.organizations.find(o => o.id === organizationId);
  if (!org) {
    res.status(404).json({
      success: false,
      error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found.' },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      industry: org.industry,
      settings: org.settings,
    },
  });
}

export async function updateOrganizationSettings(req: AuthenticatedRequest, res: Response) {
  const { organizationId } = req.params;
  const org = EnterpriseDataStore.organizations.find(o => o.id === organizationId);
  if (!org) {
    res.status(404).json({
      success: false,
      error: { code: 'ORGANIZATION_NOT_FOUND', message: 'Organization not found.' },
    });
    return;
  }

  const { name, industry, settings } = req.body;
  if (name) org.name = name;
  if (industry) org.industry = industry;
  if (settings) org.settings = { ...org.settings, ...settings };
  org.updated_at = new Date().toISOString();

  res.json({
    success: true,
    data: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      industry: org.industry,
      settings: org.settings,
    },
  });
}
