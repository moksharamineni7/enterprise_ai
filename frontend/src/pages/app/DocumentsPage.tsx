import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Search,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { DocumentItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/Badge';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient('/documents');
      setDocuments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents.filter(d => {
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Enterprise Document Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Securely upload architecture audits, meeting notes, policies, and contracts for automated Gemini extraction.
          </p>
        </div>

        <Link to="/app/documents/upload">
          <Button size="sm" leftIcon={<Upload className="w-4 h-4" />}>
            Upload New Document
          </Button>
        </Link>
      </div>

      {/* Search & Quick Filter */}
      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents by title or category..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </Card>

      {/* Document Grid / Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">AI Analysis Status</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4">Upload Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading enterprise documents...
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/app/documents/${doc.id}`}
                        className="font-semibold text-white hover:text-blue-400 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span className="truncate max-w-xs">{doc.title}</span>
                      </Link>
                      {doc.analysis?.summary && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-sm">
                          {doc.analysis.summary}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] uppercase">
                        {doc.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={doc.processing_status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      {(doc.file_size / 1024).toFixed(1)} KB
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      {doc.uploader?.full_name || 'System User'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(doc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/app/documents/${doc.id}`}>
                        <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          View Analysis
                        </Button>
                      </Link>
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
