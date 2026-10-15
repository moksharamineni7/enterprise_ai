import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input, Textarea, Select } from '../../components/ui/Input';

export function DocumentUploadPage() {
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('architecture');
  const [departmentId, setDepartmentId] = useState('');
  const [description, setDescription] = useState('');

  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDepts() {
      try {
        const depts = await apiClient('/organizations/99999999-9999-4999-a999-999999999999/departments');
        setDepartments(depts || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadDepts();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a business document to upload.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('category', category);
      if (departmentId) formData.append('department_id', departmentId);
      if (description) formData.append('description', description);

      const res = await apiClient('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      navigate(`/app/documents/${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Upload failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/app/documents" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
        <ArrowLeft className="w-4 h-4" /> Return to Document Library
      </Link>

      <Card>
        <div className="border-b border-slate-800 pb-4 mb-6">
          <h1 className="text-xl font-bold text-white tracking-tight">Upload Enterprise Document</h1>
          <p className="text-xs text-slate-400 mt-1">
            Files are stored securely and parsed server-side for Gemini analysis.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Dropzone */}
          <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 text-center bg-slate-900/50 transition-colors">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                {file ? file.name : 'Click to select or drag and drop document'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supported: PDF, Markdown, Plain Text, DOCX (Max 10MB)
              </p>
              {file && (
                <span className="mt-3 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                  {(file.size / 1024).toFixed(1)} KB selected
                </span>
              )}
            </label>
          </div>

          <Input
            label="Document Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Q3 Architecture & Resiliency Audit Report"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Document Category"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="architecture">Architecture & Infrastructure</option>
              <option value="operations">Operations & SLA</option>
              <option value="finance">Finance & Procurement</option>
              <option value="compliance">Legal, Policy & Compliance</option>
              <option value="meeting_notes">Meeting Notes & Briefing</option>
            </Select>

            <Select
              label="Department Association"
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
            >
              <option value="">-- General / All Departments --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Optional Description or Context"
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief notes explaining the source or intended review scope..."
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
            <Link to="/app/documents">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" isLoading={isLoading} leftIcon={<Upload className="w-4 h-4" />}>
              Upload & Start Gemini Analysis
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
