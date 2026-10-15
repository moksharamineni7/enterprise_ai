import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth-context';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm">Restoring enterprise session...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl max-w-lg mx-auto mt-20">
        <h2 className="text-lg font-bold text-rose-400">Restricted Enterprise Access</h2>
        <p className="text-sm text-slate-400 mt-2">
          Your current role (<span className="uppercase font-mono text-white">{user.role}</span>) does not have authorization to view this resource.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
