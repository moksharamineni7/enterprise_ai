import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Building2, Shield, Mail, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth-context';

export function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteResult, setInviteResult] = useState<any>(null);
  const [isInviting, setIsInviting] = useState(false);

  const loadTeam = async () => {
    try {
      setIsLoading(true);
      const [memData, deptData] = await Promise.all([
        apiClient('/organizations/99999999-9999-4999-a999-999999999999/members'),
        apiClient('/organizations/99999999-9999-4999-a999-999999999999/departments'),
      ]);
      setMembers(memData || []);
      setDepartments(deptData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteResult(null);

    try {
      const res = await apiClient('/organizations/99999999-9999-4999-a999-999999999999/invitations', {
        method: 'POST',
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          department_id: inviteDept || null,
        }),
      });
      setInviteResult(res);
      setInviteEmail('');
    } catch (err: any) {
      alert(`Invite error: ${err.message}`);
    } finally {
      setIsInviting(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Team Members & Departments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage organization members, functional departments, and role-based access policies.
          </p>
        </div>

        {isAdmin && (
          <Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
            Invite Member
          </Button>
        )}
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {departments.map(dept => {
          const count = members.filter(m => m.department_id === dept.id).length;
          return (
            <Card key={dept.id} className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>{dept.name}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{dept.description}</p>
              <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Staff:</span>
                <span className="font-semibold text-slate-200">{count} member(s)</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Members Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">Active Members ({members.length})</h2>
          <p className="text-xs text-slate-400 mt-0.5">Authorized users in this enterprise workspace</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Loading team directory...</td>
                </tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-xs">
                        {member.profile?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span>{member.profile?.full_name}</span>
                        <p className="text-[10px] text-slate-400 font-normal">{member.profile?.job_title}</p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono uppercase text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {member.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {member.department?.name || 'General Operations'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(member.joined_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] uppercase font-medium">
                        {member.membership_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => {
          setIsInviteOpen(false);
          setInviteResult(null);
        }}
        title="Invite New Enterprise Member"
        description="Generate a secure invitation token with predefined organization role"
      >
        {inviteResult ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Invitation Generated</p>
                <p className="mt-1">Send this secure onboarding link to {inviteResult.email}:</p>
                <input
                  type="text"
                  readOnly
                  value={inviteResult.invite_url}
                  className="w-full mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setIsInviteOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <Input
              label="Corporate Email *"
              type="email"
              required
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="e.g. colleague@nexusflow.ai"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Role Permission"
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="executive">Executive</option>
                <option value="admin">Administrator</option>
              </Select>

              <Select
                label="Department"
                value={inviteDept}
                onChange={e => setInviteDept(e.target.value)}
              >
                <option value="">-- Choose department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isInviting}>
                Generate Invitation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
