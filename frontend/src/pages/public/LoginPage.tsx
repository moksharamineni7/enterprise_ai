import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Database, Info } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';

export function LoginPage() {
  const { signInWithEmail, switchDemoRole, isSupabaseActive } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signInWithEmail(email, password);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (role: UserRole) => {
    setIsLoading(true);
    try {
      await switchDemoRole(role);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize demonstration session.');
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
        <h2 className="text-2xl font-bold text-white tracking-tight">Enterprise Sign In</h2>
        <p className="mt-1 text-xs text-slate-400">
          Access your organization's operational intelligence workspace
        </p>

        {/* Supabase Status Pill */}
        <div className="mt-3 flex justify-center">
          {isSupabaseActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Supabase Connected
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Corporate Email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. admin@nexusflow.ai"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded bg-slate-800 border-slate-700 text-blue-600" />
                <span>Keep session active</span>
              </label>
              <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Organization
            </Button>
          </form>

          {/* Quick Demo Persona Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              Fast Demonstration Evaluator Personas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoSignIn('admin')}
                className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-blue-600/10 hover:border-blue-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Elena Vance</span>
                  <span className="text-[10px] text-blue-400 font-mono">ADMIN</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">CIO / Full System Access</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('manager')}
                className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-indigo-600/10 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Marcus Brody</span>
                  <span className="text-[10px] text-indigo-400 font-mono">MGR</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Engineering Ops Manager</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('employee')}
                className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-cyan-600/10 hover:border-cyan-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>Sarah Lin</span>
                  <span className="text-[10px] text-cyan-400 font-mono">STAFF</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">Senior Cloud Architect</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSignIn('executive')}
                className="p-2.5 rounded-xl border border-slate-700/80 bg-slate-900/60 hover:bg-emerald-600/10 hover:border-emerald-500/40 text-left transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span>David Sterling</span>
                  <span className="text-[10px] text-emerald-400 font-mono">EXEC</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">VP Global Operations</p>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need an enterprise account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Create an organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
