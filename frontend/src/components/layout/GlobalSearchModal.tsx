import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckSquare, GitBranch, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';

export function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ tasks: [], documents: [], workflows: [], members: [] });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], documents: [], workflows: [], members: [] });
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const data = await apiClient(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const hasResults =
    results.tasks?.length > 0 ||
    results.documents?.length > 0 ||
    results.workflows?.length > 0 ||
    results.members?.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl glass-panel border border-slate-700 p-4 shadow-2xl z-10">
        <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, documents, workflows, members... (Esc to close)"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-4 my-2">
          {isLoading && (
            <p className="text-xs text-slate-500 py-6 text-center">Searching enterprise records...</p>
          )}

          {!isLoading && query && !hasResults && (
            <p className="text-xs text-slate-500 py-6 text-center">No authorized records matched "{query}".</p>
          )}

          {results.tasks?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" /> Tasks
              </p>
              {results.tasks.map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => handleSelect(`/app/tasks/${task.id}`)}
                  className="px-3 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span className="text-sm text-white truncate">{task.title}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {results.documents?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" /> Documents
              </p>
              {results.documents.map((doc: any) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelect(`/app/documents/${doc.id}`)}
                  className="px-3 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span className="text-sm text-white truncate">{doc.title}</span>
                  <span className="text-xs text-slate-400">{doc.category}</span>
                </div>
              ))}
            </div>
          )}

          {results.workflows?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> Workflows
              </p>
              {results.workflows.map((wf: any) => (
                <div
                  key={wf.id}
                  onClick={() => handleSelect(`/app/workflows/${wf.id}`)}
                  className="px-3 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span className="text-sm text-white truncate">{wf.name}</span>
                  <span className="text-xs text-slate-400">{wf.trigger_type}</span>
                </div>
              ))}
            </div>
          )}

          {results.members?.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Team Members
              </p>
              {results.members.map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => handleSelect(`/app/team`)}
                  className="px-3 py-2 rounded-lg hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <span className="text-sm text-white truncate">{m.full_name}</span>
                  <span className="text-xs text-slate-400">{m.job_title} ({m.role})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
