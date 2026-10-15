import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  FileText,
  CheckSquare,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  Calendar,
  Layers,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusBadge, PriorityBadge } from '../../components/ui/Badge';

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Selected Action Items for 1-click task conversion
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<string | null>(null);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient(`/documents/${documentId}`);
      setDocument(data);
      // Select all action items by default
      if (data?.analysis?.action_items) {
        setSelectedItems(data.analysis.action_items.map((_: any, idx: number) => idx));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) loadDocument();
  }, [documentId]);

  const handleRetryAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      await apiClient(`/documents/${documentId}/analyze`, { method: 'POST' });
      await loadDocument();
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleSelectItem = (idx: number) => {
    setSelectedItems(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleCreateTasksFromActionItems = async () => {
    if (!document?.analysis?.action_items || selectedItems.length === 0) return;

    try {
      setIsCreatingTasks(true);
      setTaskSuccessMsg(null);

      const itemsToCreate = selectedItems.map(idx => {
        const item = document.analysis.action_items[idx];
        return {
          title: item.title,
          description: `${item.description}\n\nEvidence Excerpt: "${item.evidence_excerpt || ''}"`,
          priority: item.suggested_priority || 'medium',
          due_at: item.suggested_due_date || null,
        };
      });

      const res = await apiClient(`/documents/${documentId}/action-items`, {
        method: 'POST',
        body: JSON.stringify({ action_items: itemsToCreate }),
      });

      setTaskSuccessMsg(`Successfully created ${itemsToCreate.length} enterprise task(s) from document action items.`);
    } catch (err: any) {
      alert(`Could not create tasks: ${err.message}`);
    } finally {
      setIsCreatingTasks(false);
    }
  };

  if (isLoading || !document) {
    return <div className="py-20 text-center text-slate-500">Loading document intelligence report...</div>;
  }

  const analysis = document.analysis;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link to="/app/documents" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to Documents
        </Link>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRetryAnalysis}
          isLoading={isAnalyzing}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Re-Analyze with Gemini
        </Button>
      </div>

      {/* Document Header Card */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={document.processing_status} />
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono uppercase">
                {document.category}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {(document.file_size / 1024).toFixed(1)} KB
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              {document.title}
            </h1>
            {document.description && (
              <p className="text-xs text-slate-400 mt-1">{document.description}</p>
            )}
          </div>

          <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 p-3 rounded-xl flex-shrink-0">
            <p><strong className="text-slate-300">Uploaded by:</strong> {document.uploader?.full_name || 'System'}</p>
            <p className="mt-1"><strong className="text-slate-300">Date:</strong> {new Date(document.created_at).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Success banner if tasks created */}
      {taskSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{taskSuccessMsg}</span>
          </div>
          <Link to="/app/tasks">
            <Button size="sm" variant="secondary">View Tasks →</Button>
          </Link>
        </div>
      )}

      {/* AI Extraction Analysis Section */}
      {analysis ? (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="rounded-2xl glass-panel border border-blue-500/30 p-6 bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Nexus AI Intelligence Summary
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                {analysis.document_type}
              </span>
            </div>
            <p className="text-sm text-slate-200 mt-2 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Action Items with 1-Click Task Creator */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-400" /> Extracted Action Items ({analysis.action_items?.length || 0})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review and accept suggested action items to convert them directly into persistent tasks.
                </p>
              </div>

              {analysis.action_items?.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleCreateTasksFromActionItems}
                  isLoading={isCreatingTasks}
                  disabled={selectedItems.length === 0}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create {selectedItems.length} Selected Task(s)
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {analysis.action_items?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedItems.includes(idx)
                      ? 'bg-blue-950/20 border-blue-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                  onClick={() => handleToggleSelectItem(idx)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(idx)}
                        onChange={() => {}}
                        className="mt-1 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                      />
                      <div>
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs text-slate-300 mt-1">{item.description}</p>
                        {item.evidence_excerpt && (
                          <p className="text-[11px] text-slate-400 italic mt-1.5 border-l-2 border-slate-700 pl-2">
                            "{item.evidence_excerpt}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <PriorityBadge priority={item.suggested_priority} />
                      {item.suggested_owner && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Owner: {item.suggested_owner}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Key Findings & Decisions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Findings */}
            <Card>
              <CardHeader
                title="Key Insights & Findings"
                description="Synthesized facts and metrics extracted from text"
              />
              <div className="space-y-2.5">
                {analysis.key_points?.map((kp: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <p className="font-medium text-slate-100">• {kp.point}</p>
                    {kp.evidence_excerpt && (
                      <p className="text-[11px] text-slate-400 italic mt-1 border-l-2 border-blue-500/40 pl-2">
                        "{kp.evidence_excerpt}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Decisions */}
            <Card>
              <CardHeader
                title="Stated Decisions & Ownership"
                description="Agreed conclusions identified in the source content"
              />
              <div className="space-y-2.5">
                {analysis.decisions?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No explicit decisions recorded.</p>
                ) : (
                  analysis.decisions.map((dec: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                      <p className="font-medium text-white">{dec.decision}</p>
                      {dec.owner && (
                        <p className="text-[11px] text-blue-400 mt-1">Stated Owner: {dec.owner}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Operational Risks */}
          {analysis.risks?.length > 0 && (
            <Card>
              <CardHeader
                title="Operational Risks Identified"
                description="Potential vulnerabilities and blockers mentioned in source"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.risks.map((risk: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-white">{risk.description}</p>
                      <PriorityBadge priority={risk.severity} />
                    </div>
                    {risk.evidence_excerpt && (
                      <p className="text-[11px] text-slate-400 italic mt-2 border-l-2 border-rose-500/40 pl-2">
                        "{risk.evidence_excerpt}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Extracted Raw Content Preview Accordion */}
          <Card>
            <CardHeader
              title="Verified Server-Side Extracted Text"
              description="Untrusted source content passed to Gemini pipeline"
            />
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {document.extracted_text || 'No text content available.'}
            </pre>
          </Card>
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-sm text-slate-400">Analysis is still in progress or not yet generated.</p>
          <Button size="sm" className="mt-4" onClick={handleRetryAnalysis} isLoading={isAnalyzing}>
            Trigger Analysis Now
          </Button>
        </Card>
      )}
    </div>
  );
}
