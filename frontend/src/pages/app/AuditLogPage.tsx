import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, ShieldAlert } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Card } from '../../components/ui/Card';

export function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/audit-logs');
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = filterAction
    ? logs.filter(l => l.action.toLowerCase().includes(filterAction.toLowerCase()))
    : logs;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" /> Enterprise Compliance & Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable, append-only security and compliance trail of organizational operations.
          </p>
        </div>

        <input
          type="text"
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          placeholder="Filter by action type..."
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading compliance audit stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                    No audit records match the filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {log.action}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 font-sans">
                      {log.actor?.full_name || 'System Principal'}
                    </td>
                    <td className="py-3.5 px-4 text-blue-400 text-[11px]">
                      {log.resource_type}:{log.resource_id ? log.resource_id.slice(0, 8) : 'n/a'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {log.outcome}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[10px] truncate max-w-xs">
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
