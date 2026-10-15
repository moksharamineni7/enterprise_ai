import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Database, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth-context';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, isSupabaseActive } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrgNameChange = (val: string) => {
    setOrgName(val);
    setOrgSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signUpWithEmail(email, password, fullName, orgName, orgSlug);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create enterprise workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">NexusFlow AI</span>
        </Link>
        <h2 className="text-2xl font-bold text-white tracking-tight">Register Enterprise Organization</h2>
        <p className="mt-1 text-xs text-slate-400">
          Deploy an intelligent operations workspace for your teams
        </p>

        {/* Supabase Status Pill */}
        <div className="mt-3 flex justify-center">
          {isSupabaseActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Supabase Auth Enabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              Demo Mode Active (Supabase Not Connected)
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel border border-slate-800 p-8 rounded-2xl shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Elena Vance"
            />
            <Input
              label="Corporate Email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
            <Input
              label="Organization Name"
              required
              value={orgName}
              onChange={e => handleOrgNameChange(e.target.value)}
              placeholder="e.g. Apex Global Technologies"
            />
            <Input
              label="Organization URL Identifier (Slug)"
              required
              value={orgSlug}
              onChange={e => setOrgSlug(e.target.value)}
              helperText={`app.nexusflow.ai/${orgSlug || 'your-slug'}`}
            />
            <Input
              label="Admin Password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Complete Onboarding & Launch
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an enterprise account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
