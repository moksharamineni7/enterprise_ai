import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckSquare, GitBranch, Users, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { Card } from '../../components/ui/Card';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any>({ tasks: [], documents: [], workflows: [], members: [] });
  const [isLoading, setIsLoading] = useState(false);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults({ tasks: [], documents: [], workflows: [], members: [] });
      return;
    }
    try {
      setIsLoading(true);
      const data = await apiClient(`/search?q=${encodeURIComponent(searchTerm)}`);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
    executeSearch(query);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          Enterprise Global Search
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Search across authorized tasks, analyzed documents, workflows, and team members.
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by keywords, tags, or names..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            Search
          </button>
        </form>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">Searching enterprise data...</div>
      ) : (
        <div className="space-y-6">
          {/* Tasks */}
          {results.tasks?.length > 0 && (
            <Card className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <CheckSquare className="w-4 h-4 text-blue-400" /> Tasks ({results.tasks.length})
              </h3>
              <div className="divide-y divide-slate-800">
                {results.tasks.map((task: any) => (
                  <div key={task.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link to={`/app/tasks/${task.id}`} className="text-xs font-semibold text-white hover:text-blue-400">
                        {task.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.description}</p>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Documents */}
          {results.documents?.length > 0 && (
            <Card className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-cyan-400" /> Documents ({results.documents.length})
              </h3>
              <div className="divide-y divide-slate-800">
                {results.documents.map((doc: any) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link to={`/app/documents/${doc.id}`} className="text-xs font-semibold text-white hover:text-cyan-400">
                        {doc.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{doc.category}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Workflows */}
          {results.workflows?.length > 0 && (
            <Card className="space-y-2">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                <GitBranch className="w-4 h-4 text-indigo-400" /> Workflows ({results.workflows.length})
              </h3>
              <div className="divide-y divide-slate-800">
                {results.workflows.map((wf: any) => (
                  <div key={wf.id} className="py-3 flex items-center justify-between">
                    <div>
                      <Link to={`/app/workflows/${wf.id}`} className="text-xs font-semibold text-white hover:text-indigo-400">
                        {wf.name}
                      </Link>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{wf.description}</p>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {wf.trigger_type}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
