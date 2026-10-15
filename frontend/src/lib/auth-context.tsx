import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Organization, Department, UserRole } from '../types';
import { apiClient } from './api-client';
import { supabase, isSupabaseConfigured } from './supabase';

interface AuthContextType {
  user: UserProfile | null;
  organization: Organization | null;
  department: Department | null;
  token: string | null;
  isLoading: boolean;
  isSupabaseActive: boolean;
  login: (token: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string,
    orgName: string,
    orgSlug: string
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('nexusflow_token') || 'demo-admin-token';
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async (currentToken: string) => {
    try {
      setIsLoading(true);
      const res = await apiClient<{
        user: UserProfile;
        organization: Organization | null;
        department: Department | null;
      }>('/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setUser(res.user);
      setOrganization(res.organization);
      setDepartment(res.department);
    } catch (err) {
      console.error('Failed to load user session:', err);
      // Fallback demo admin profile
      setUser({
        id: '11111111-1111-4111-a111-111111111111',
        email: 'admin@nexusflow.ai',
        full_name: 'Elena Vance',
        role: 'admin',
        organization_id: '99999999-9999-4999-a999-999999999999',
        department_id: 'a1111111-1111-4111-8111-111111111111',
      });
      setOrganization({
        id: '99999999-9999-4999-a999-999999999999',
        name: 'Apex Global Technologies',
        slug: 'apex-global',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to Supabase Auth State Changes if configured
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      if (token) {
        fetchCurrentUser(token);
      } else {
        setIsLoading(false);
      }
      return;
    }

    // Check initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        localStorage.setItem('nexusflow_token', session.access_token);
        setToken(session.access_token);
        fetchCurrentUser(session.access_token);
      } else {
        const storedToken = localStorage.getItem('nexusflow_token');
        if (storedToken) {
          fetchCurrentUser(storedToken);
        } else {
          setIsLoading(false);
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.access_token) {
            localStorage.setItem('nexusflow_token', session.access_token);
            setToken(session.access_token);
            await fetchCurrentUser(session.access_token);
          }
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('nexusflow_token');
          setToken(null);
          setUser(null);
          setOrganization(null);
          setDepartment(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (newToken: string) => {
    localStorage.setItem('nexusflow_token', newToken);
    setToken(newToken);
    await fetchCurrentUser(newToken);
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw new Error(error.message);
      }
      if (data.session?.access_token) {
        await login(data.session.access_token);
      }
    } else {
      // Demo authentication mapping
      if (email.includes('admin')) {
        await switchDemoRole('admin');
      } else if (email.includes('manager')) {
        await switchDemoRole('manager');
      } else if (email.includes('employee')) {
        await switchDemoRole('employee');
      } else if (email.includes('exec')) {
        await switchDemoRole('executive');
      } else {
        await login('demo-admin-token');
      }
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    orgName: string,
    orgSlug: string
  ) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) {
        throw new Error(error.message);
      }

      const sessionToken = data.session?.access_token;
      if (sessionToken) {
        await login(sessionToken);

        // Register organization in backend
        await apiClient('/organizations', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionToken}` },
          body: JSON.stringify({
            name: orgName,
            slug: orgSlug,
            industry: 'Enterprise Software & Cloud',
          }),
        });

        await fetchCurrentUser(sessionToken);
      }
    } else {
      // Demo organization creation
      await apiClient('/organizations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || 'demo-admin-token'}` },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
          industry: 'Enterprise Software & Cloud',
        }),
      });
      await switchDemoRole('admin');
    }
  };

  const resetPassword = async (email: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        throw new Error(error.message);
      }
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase signOut error:', err);
      }
    }
    localStorage.removeItem('nexusflow_token');
    setToken(null);
    setUser(null);
    setOrganization(null);
    setDepartment(null);
  };

  const switchDemoRole = async (role: UserRole) => {
    const demoToken = `demo-${role}-token`;
    await login(demoToken);
  };

  const refreshContext = async () => {
    if (token) {
      await fetchCurrentUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        department,
        token,
        isLoading,
        isSupabaseActive: isSupabaseConfigured,
        login,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
        switchDemoRole,
        refreshContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
