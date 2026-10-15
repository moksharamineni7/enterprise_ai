import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuthUser } from '../types';
import { getAdminClient } from '../lib/supabase';

// Seed demo users matching supabase/seed.sql
export const DEMO_USERS: Record<string, AuthUser> = {
  'demo-admin-token': {
    id: '11111111-1111-4111-a111-111111111111',
    email: 'admin@nexusflow.ai',
    full_name: 'Elena Vance',
    role: 'admin',
    organization_id: '99999999-9999-4999-a999-999999999999',
    department_id: 'a1111111-1111-4111-8111-111111111111',
  },
  'demo-manager-token': {
    id: '22222222-2222-4222-a222-222222222222',
    email: 'manager@nexusflow.ai',
    full_name: 'Marcus Brody',
    role: 'manager',
    organization_id: '99999999-9999-4999-a999-999999999999',
    department_id: 'a1111111-1111-4111-8111-111111111111',
  },
  'demo-employee-token': {
    id: '33333333-3333-4333-a333-333333333333',
    email: 'employee@nexusflow.ai',
    full_name: 'Sarah Lin',
    role: 'employee',
    organization_id: '99999999-9999-4999-a999-999999999999',
    department_id: 'a1111111-1111-4111-8111-111111111111',
  },
  'demo-executive-token': {
    id: '44444444-4444-4444-a444-444444444444',
    email: 'executive@nexusflow.ai',
    full_name: 'David Sterling',
    role: 'executive',
    organization_id: '99999999-9999-4999-a999-999999999999',
    department_id: 'a2222222-2222-4222-8222-222222222222',
  },
};

export async function authenticateMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization token is missing or malformed',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  req.token = token;

  // Check demo/development tokens first
  if (DEMO_USERS[token]) {
    req.user = DEMO_USERS[token];
    return next();
  }

  const supabase = getAdminClient();
  if (!supabase) {
    // If Supabase not configured and not a demo token
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_SERVICE_UNAVAILABLE',
        message: 'Authentication service is not configured. For demonstration testing, use one of the configured demo tokens or set SUPABASE credentials.',
      },
    });
    return;
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session is invalid or expired. Please sign in again.',
        },
      });
      return;
    }

    // Look up profile and active organization membership
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role, department_id, membership_status')
      .eq('user_id', user.id)
      .eq('membership_status', 'active')
      .limit(1)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    req.user = {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: profile?.avatar_url,
      role: (member?.role as any) || 'employee',
      organization_id: member?.organization_id || '',
      department_id: member?.department_id,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_VERIFICATION_FAILED',
        message: 'Could not verify authentication token',
      },
    });
  }
}
