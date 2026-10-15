import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Sparkles, Building2, UserCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth-context';

export function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { switchDemoRole } = useAuth();

  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (token) {
        // Accept invitation
        await apiClient('/invitations/accept', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        await switchDemoRole('employee');
      } else {
        // Create org
        const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await apiClient('/organizations', {
          method: 'POST',
          body: JSON.stringify({ name: orgName, slug }),
        });
        await switchDemoRole('admin');
      }
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Onboarding step failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mx-auto mb-4">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {token ? 'Accept Enterprise Invitation' : 'Welcome to NexusFlow AI'}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Complete your profile and join your corporate workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleComplete} className="space-y-4">
            <Input
              label="Your Full Name *"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Elena Vance"
            />

            <Input
              label="Corporate Job Title *"
              required
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Lead Systems Architect"
            />

            {!token && (
              <Input
                label="Organization Name *"
                required
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. Apex Global Technologies"
              />
            )}

            <Button type="submit" className="w-full mt-2" isLoading={isLoading} rightIcon={<ArrowRight className="w-4 h-4" />}>
              {token ? 'Join Workspace' : 'Launch Workspace'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
