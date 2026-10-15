import React, { useState, useEffect } from 'react';
import { Settings, Shield, Building2, CheckCircle2, Lock, Database, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth-context';

interface SupabaseStatus {
  configured: boolean;
  supabaseUrl: string | null;
  databaseConnected: boolean;
  storageConnected: boolean;
  schemaReady: boolean;
  message: string;
}

export function SettingsPage() {
  const { user, organization, refreshContext, isSupabaseActive } = useAuth();

  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState('');
  const [allowSelfApproval, setAllowSelfApproval] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Supabase Status State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus | null>(null);
  const [isCheckingSupabase, setIsCheckingSupabase] = useState(false);

  const fetchSupabaseStatus = async () => {
    setIsCheckingSupabase(true);
    try {
      const data = await apiClient<SupabaseStatus>('/supabase/status');
      setSupabaseStatus(data);
    } catch (err) {
      console.error('Failed to fetch Supabase status:', err);
    } finally {
      setIsCheckingSupabase(false);
    }
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const orgId = organization?.id || '99999999-9999-4999-a999-999999999999';
        const data = await apiClient(`/organizations/${orgId}/settings`);
        setOrgName(data.name || '');
        setIndustry(data.industry || '');
        setAllowSelfApproval(data.settings?.security?.allow_self_approval || false);
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
    fetchSupabaseStatus();
  }, [organization?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      const orgId = organization?.id || '99999999-9999-4999-a999-999999999999';
      await apiClient(`/organizations/${orgId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: orgName,
          industry,
          settings: {
            security: { allow_self_approval: allowSelfApproval },
          },
        }),
      });
      setSuccessMsg('Organization configuration updated successfully.');
      await refreshContext();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-slate-400" /> Organization Settings & Security Policies
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure enterprise identity, self-approval governance rules, and Supabase database infrastructure.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Supabase Connection Status Card */}
      <Card>
        <div className="flex items-center justify-between">
          <CardHeader
            title="Supabase PostgreSQL & Object Storage"
            description="Status of your connected Supabase project, Row Level Security, and private storage bucket"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchSupabaseStatus}
            isLoading={isCheckingSupabase}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isCheckingSupabase ? 'animate-spin' : ''}`} />}
          >
            Verify Connection
          </Button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              Connection State:
            </span>
            {supabaseStatus?.configured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3 text-amber-400" /> Not Configured (Demo Mode)
              </span>
            )}
          </div>

          {supabaseStatus?.supabaseUrl && (
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
              <span className="text-slate-400">Project Endpoint:</span>
              <span className="font-mono text-slate-200">{supabaseStatus.supabaseUrl}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">Database Schema:</span>
            <span className={supabaseStatus?.databaseConnected ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
              {supabaseStatus?.databaseConnected ? 'Verified Active (RLS Enabled)' : 'Pending Migration Run'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
            <span className="text-slate-400">Document Storage Bucket:</span>
            <span className={supabaseStatus?.storageConnected ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
              {supabaseStatus?.storageConnected ? 'enterprise-documents (Private)' : 'Not Connected'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            {supabaseStatus?.message}
          </div>

          {!supabaseStatus?.configured && (
            <div className="mt-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
              <p className="font-semibold mb-1">To connect your live Supabase project:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300">
                <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">supabase.com</a></li>
                <li>Add your credentials to <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">.env</code> (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)</li>
                <li>Execute migrations from <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">supabase/migrations/</code> in the Supabase SQL editor</li>
                <li>Click <strong>Verify Connection</strong> above or run <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded">npm run db:check</code></li>
              </ol>
            </div>
          )}
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Info */}
        <Card>
          <CardHeader
            title="Enterprise Identity"
            description="Organization details displayed in invitations and reports"
          />
          <div className="space-y-4 mt-4">
            <Input
              label="Organization Name"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              placeholder="e.g. Apex Global Technologies"
            />
            <Input
              label="Primary Industry"
              value={industry}
              onChange={e => setIndustry(e.target.value)}
              placeholder="e.g. Enterprise Cloud & Financial Infrastructure"
            />
          </div>
        </Card>

        {/* Security & Governance */}
        <Card>
          <CardHeader
            title="Governance & Authorization Rules"
            description="Enforce strict separation of duties and dual-control approvals"
          />
          <div className="space-y-4 mt-4">
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:bg-slate-850 transition-colors">
              <input
                type="checkbox"
                checked={allowSelfApproval}
                onChange={e => setAllowSelfApproval(e.target.checked)}
                className="mt-0.5 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
              />
              <div>
                <span className="text-xs font-semibold text-white block">
                  Permit Self-Approval of Requests
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  When disabled (recommended), employees cannot approve requests they authored, enforcing separation of duties.
                </span>
              </div>
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSaving}>
            Save Enterprise Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
