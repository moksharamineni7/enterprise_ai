import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  User,
  History,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { ApprovalItem, ApprovalStatus } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { useAuth } from '../../lib/auth-context';

export function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [isLoading, setIsLoading] = useState(true);

  // Decision Modal
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject'>('approve');
  const [decisionComment, setDecisionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History Detail Modal
  const [historyModalApproval, setHistoryModalApproval] = useState<ApprovalItem | null>(null);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      const url = statusFilter ? `/approvals?status=${statusFilter}` : '/approvals';
      const data = await apiClient<ApprovalItem[]>(url);
      setApprovals(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const openDecisionModal = (approval: ApprovalItem, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setDecisionAction(action);
    setDecisionComment('');
    setErrorMsg(null);
  };

  const handleConfirmDecision = async () => {
    if (!selectedApproval) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await apiClient(`/approvals/${selectedApproval.id}/${decisionAction}`, {
        method: 'POST',
        body: JSON.stringify({ comment: decisionComment }),
      });
      setSelectedApproval(null);
      await fetchApprovals();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to ${decisionAction} request.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHistoryModal = async (approval: ApprovalItem) => {
    try {
      const detailed = await apiClient<ApprovalItem>(`/approvals/${approval.id}`);
      setHistoryModalApproval(detailed);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Enterprise Approval Inbox
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorize critical budget extensions, architectural modifications, and release gates.
          </p>
        </div>

        {/* Status Tab Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          {['pending', 'approved', 'rejected', ''].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">Loading approval queue...</div>
        ) : approvals.length === 0 ? (
          <Card className="text-center py-16 text-slate-500">
            No approval requests found matching the active status filter.
          </Card>
        ) : (
          approvals.map(approval => {
            const isPending = approval.status === 'pending';
            const isSelfRequester = approval.requester_id === user?.id;
            return (
              <Card key={approval.id} className="p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={approval.status} />
                      {approval.related_task && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          Task: {approval.related_task.title}
                        </span>
                      )}
                      {approval.due_at && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Due: {new Date(approval.due_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight">{approval.title}</h3>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{approval.description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span><strong className="text-slate-300">Requester:</strong> {approval.requester?.full_name || 'Staff Member'}</span>
                      <span><strong className="text-slate-300">Assigned Approver:</strong> {approval.approver?.full_name || 'Executive'}</span>
                      <span><strong className="text-slate-300">Submitted:</strong> {new Date(approval.created_at).toLocaleDateString()}</span>
                    </div>

                    {approval.decision_comment && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <strong className="text-slate-200">Reviewer Decision Note:</strong>{' '}
                        <span className="text-slate-400">{approval.decision_comment}</span>
                        {approval.decided_at && (
                          <span className="text-[10px] text-slate-500 block mt-1">
                            Decided {new Date(approval.decided_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col items-end gap-2 flex-shrink-0">
                    {isPending && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => openDecisionModal(approval, 'reject')}
                          leftIcon={<X className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openDecisionModal(approval, 'approve')}
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openHistoryModal(approval)}
                      leftIcon={<History className="w-3.5 h-3.5" />}
                    >
                      Audit Trail
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Decision Dialog Modal */}
      <Modal
        isOpen={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        title={`${decisionAction === 'approve' ? 'Approve' : 'Reject'} Request`}
        description={selectedApproval?.title}
      >
        <div className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <Textarea
            label="Decision Justification or Feedback"
            placeholder={
              decisionAction === 'approve'
                ? 'Optional notes regarding authorization parameters...'
                : 'Provide required rationale for rejecting this request...'
            }
            rows={3}
            value={decisionComment}
            onChange={e => setDecisionComment(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedApproval(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={decisionAction === 'approve' ? 'primary' : 'danger'}
              onClick={handleConfirmDecision}
              isLoading={isSubmitting}
            >
              Confirm {decisionAction === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* History Audit Modal */}
      <Modal
        isOpen={!!historyModalApproval}
        onClose={() => setHistoryModalApproval(null)}
        title="Immutable Approval Audit Trail"
        description={historyModalApproval?.title}
      >
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {historyModalApproval?.history?.map((h: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white uppercase text-[11px] tracking-wide">
                  Action: {h.action}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(h.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-slate-400 mt-1">Actor: {h.actor?.full_name || 'System'}</p>
              {h.comment && <p className="text-slate-300 mt-1 italic">"{h.comment}"</p>}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
