import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api-client';
import { Button } from '../../components/ui/Button';
import { ConversationItem, ConversationMessageItem } from '../../types';

const SUGGESTED_QUESTIONS = [
  'What are my most urgent tasks today?',
  'Which workflows or requests are waiting for approval?',
  'Summarize the major operational risks this week.',
  'What action items were extracted from the latest architecture document?',
  'Which departments have overdue deliverables?',
];

export function AssistantPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessageItem[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [taskCreatedMessage, setTaskCreatedMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient<ConversationItem[]>('/conversations');
      setConversations(data || []);
      if (data && data.length > 0 && !activeConvId) {
        setActiveConvId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await apiClient<ConversationMessageItem[]>(`/conversations/${convId}/messages`);
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  const handleCreateNewConversation = async () => {
    try {
      const conv = await apiClient<ConversationItem>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New inquiry' }),
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputContent;
    if (!text.trim() || isSending) return;

    let targetConvId = activeConvId;
    if (!targetConvId) {
      const newConv = await apiClient<ConversationItem>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: text.slice(0, 35) + '...' }),
      });
      setConversations(prev => [newConv, ...prev]);
      targetConvId = newConv.id;
      setActiveConvId(newConv.id);
    }

    const tempUserMsg: ConversationMessageItem = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputContent('');
    setIsSending(true);
    setTimeout(scrollToBottom, 50);

    try {
      const res = await apiClient<{
        user_message: ConversationMessageItem;
        assistant_message: ConversationMessageItem;
      }>(`/conversations/${targetConvId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      });

      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        res.user_message,
        res.assistant_message,
      ]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      alert(`Nexus AI error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient(`/conversations/${convId}`, { method: 'DELETE' });
      const remaining = conversations.filter(c => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        setActiveConvId(remaining[0]?.id || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTaskFromAction = async (actionText: string) => {
    try {
      setTaskCreatedMessage(null);
      await apiClient('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: actionText,
          description: `Created directly from Nexus AI conversational recommendation.`,
          priority: 'medium',
          status: 'todo',
        }),
      });
      setTaskCreatedMessage(`Task "${actionText}" successfully scheduled.`);
      setTimeout(() => setTaskCreatedMessage(null), 5000);
    } catch (err: any) {
      alert(`Could not create task: ${err.message}`);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-2xl glass-panel border border-slate-800 overflow-hidden shadow-2xl">
      {/* Conversations Sidebar */}
      <div className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col hidden sm:flex">
        <div className="p-3.5 border-b border-slate-800">
          <Button
            size="sm"
            className="w-full justify-center"
            onClick={handleCreateNewConversation}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Inquiry
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No conversation sessions yet.</p>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors cursor-pointer group ${
                  activeConvId === conv.id
                    ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={e => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-opacity"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-slate-950/40">
        {/* Chat Header */}
        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                Nexus AI Assistant <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">Grounded RAG</span>
              </span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {taskCreatedMessage && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{taskCreatedMessage}</span>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.length === 0 ? (
            <div className="max-w-lg mx-auto py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Ask Nexus AI About Your Enterprise</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                I can review your authorized tasks, synthesize documents, flag approval bottlenecks, and check deadlines.
              </p>

              <div className="mt-6 flex flex-col gap-2 text-left">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/40 text-xs text-slate-300 hover:text-white transition-colors flex items-center justify-between text-left"
                  >
                    <span>{q}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={msg.id || i}
                  className={`flex gap-3 max-w-3xl ${isAssistant ? '' : 'ml-auto justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`rounded-2xl p-4 text-xs leading-relaxed ${
                      isAssistant
                        ? 'glass-card border border-slate-800 text-slate-200'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>

                    {/* Citations block */}
                    {isAssistant && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                          Verified Citations:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, cIdx) => (
                            <Link
                              key={cIdx}
                              to={`/app/${cite.record_type}s/${cite.record_id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-850 border border-slate-700 text-[11px] text-blue-400 hover:text-blue-300 font-mono transition-colors"
                            >
                              <span>{cite.record_type}:{cite.record_id.slice(0, 8)}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">
                      U
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex items-center gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="rounded-2xl glass-card border border-slate-800 p-3 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Grounding enterprise context and querying Gemini...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputContent}
              onChange={e => setInputContent(e.target.value)}
              placeholder="Ask about deliverables, approvals, documents, or operational risks..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isSending}
            />
            <Button type="submit" size="sm" isLoading={isSending} rightIcon={<Send className="w-3.5 h-3.5" />}>
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
