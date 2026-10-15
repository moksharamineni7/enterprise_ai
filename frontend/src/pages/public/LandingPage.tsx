import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Brain,
  GitBranch,
  FileCheck2,
  CheckCircle2,
  Building2,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-800/80 px-6 sm:px-12 flex items-center justify-between glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              NexusFlow <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">AI</span>
            </span>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Enterprise Operations</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link to="/login">
            <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Launch Platform
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-24 sm:py-32 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Next-Gen Centralized Operational Intelligence
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Unify enterprise tasks, documents, and workflows with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
            grounded AI intelligence
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          NexusFlow AI answers what work needs attention, which approvals are delayed, what decisions reside in business documents, and which actions to automate—all with evidence-based database citations.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login">
            <Button size="lg" className="px-8 shadow-xl shadow-blue-600/20" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Enter Demo Environment
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Create Organization
            </Button>
          </Link>
        </div>

        {/* Highlight Stats Pill */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl glass-card rounded-2xl p-6 border border-slate-800">
          <div>
            <p className="text-2xl font-bold text-white">100%</p>
            <p className="text-xs text-slate-400 mt-1">Verified Citations</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">&lt;100ms</p>
            <p className="text-xs text-slate-400 mt-1">RLS Data Isolation</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-400">Deterministic</p>
            <p className="text-xs text-slate-400 mt-1">Workflow Engine</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">SOC2 Ready</p>
            <p className="text-xs text-slate-400 mt-1">Immutable Audit Trail</p>
          </div>
        </div>
      </section>

      {/* 5 Core Enterprise Pillars */}
      <section className="px-6 py-20 bg-slate-900/60 border-t border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">Answering the 5 Essential Enterprise Questions</h2>
            <p className="text-sm text-slate-400 mt-2">Grounded in actual PostgreSQL data with strict Row-Level Security</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/20">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">1. What work needs attention now?</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Algorithmic and LLM-powered task prioritization based on due dates, cross-task dependencies, and stated impact.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">2. What resides in your documents?</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Automatic text extraction and structured Gemini analysis extracting decisions, deadlines, risks, and 1-click reviewable action items.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
                  <GitBranch className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">3. Which actions can be automated?</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Deterministic server-side workflow engine supporting manual, status-change, or document-driven triggers with idempotency protection.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">4. Which approvals are delayed?</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Multi-tier approval inbox with self-approval policy checks, review comments, and tamper-evident audit history.
                </p>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between md:col-span-2">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">5. What decisions should managers prioritize?</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Evidence-based operational insights linking verified database records to quantitative bottlenecks, workload distribution, and confidence indicators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 px-6 py-8 text-center text-xs text-slate-500">
        <p>© 2026 NexusFlow AI — Intelligent Enterprise Operations Platform. Production-grade architecture.</p>
      </footer>
    </div>
  );
}
