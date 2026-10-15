import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';

export function requireOrgMember(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || !req.user.organization_id) {
    res.status(403).json({
      success: false,
      error: {
        code: 'NO_ORGANIZATION_ACCESS',
        message: 'You must belong to an active organization to perform this action.',
      },
    });
    return;
  }

  // Cross-organization validation
  const paramOrgId = req.params.organizationId || req.query.organization_id;
  if (paramOrgId && paramOrgId !== req.user.organization_id) {
    res.status(403).json({
      success: false,
      error: {
        code: 'CROSS_ORGANIZATION_FORBIDDEN',
        message: 'Access to resources outside your active organization is prohibited.',
      },
    });
    return;
  }

  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. This operation requires one of the following roles: ${allowedRoles.join(', ')}.`,
        },
      });
      return;
    }

    next();
  };
}
