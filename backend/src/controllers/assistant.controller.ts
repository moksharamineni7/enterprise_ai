import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';
import { answerEnterpriseQuestion } from '../services/gemini.service';

export async function listConversations(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;

  const convs = EnterpriseDataStore.conversations
    .filter(c => c.organization_id === orgId && c.user_id === userId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  res.json({
    success: true,
    data: convs,
  });
}

export async function createConversation(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const { title } = req.body;

  const conv = {
    id: uuidv4(),
    organization_id: orgId,
    user_id: userId,
    title: title || 'New inquiry',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  EnterpriseDataStore.conversations.unshift(conv);

  res.status(201).json({
    success: true,
    data: conv,
  });
}

export async function getConversationMessages(req: AuthenticatedRequest, res: Response) {
  const { conversationId } = req.params;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;

  const conv = EnterpriseDataStore.conversations.find(
    c => c.id === conversationId && c.organization_id === orgId && c.user_id === userId
  );

  if (!conv) {
    res.status(404).json({
      success: false,
      error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' },
    });
    return;
  }

  const messages = EnterpriseDataStore.conversationMessages
    .filter(m => m.conversation_id === conversationId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  res.json({
    success: true,
    data: messages,
  });
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  const { conversationId } = req.params;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    res.status(400).json({
      success: false,
      error: { code: 'EMPTY_MESSAGE', message: 'Message content cannot be empty.' },
    });
    return;
  }

  let conv = EnterpriseDataStore.conversations.find(
    c => c.id === conversationId && c.organization_id === orgId && c.user_id === userId
  );

  if (!conv) {
    // If conversation doesn't exist, create it dynamically
    conv = {
      id: conversationId,
      organization_id: orgId,
      user_id: userId,
      title: content.slice(0, 40) + '...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    EnterpriseDataStore.conversations.unshift(conv);
  }

  // 1. Store user message
  const userMsg = {
    id: uuidv4(),
    organization_id: orgId,
    conversation_id: conv.id,
    user_id: userId,
    role: 'user',
    content,
    citations: [],
    created_at: new Date().toISOString(),
  };
  EnterpriseDataStore.conversationMessages.push(userMsg);

  // 2. Fetch authorized enterprise records within org
  const contextRecords = {
    tasks: EnterpriseDataStore.tasks.filter(t => t.organization_id === orgId).slice(0, 30),
    documents: EnterpriseDataStore.documents.filter(d => d.organization_id === orgId).slice(0, 15),
    approvals: EnterpriseDataStore.approvals.filter(a => a.organization_id === orgId).slice(0, 15),
    workflows: EnterpriseDataStore.workflows.filter(w => w.organization_id === orgId).slice(0, 10),
    insights: EnterpriseDataStore.insights.filter(i => i.organization_id === orgId).slice(0, 10),
  };

  // 3. Retrieve conversation history
  const history = EnterpriseDataStore.conversationMessages
    .filter(m => m.conversation_id === conv!.id)
    .slice(-6)
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  // 4. Grounded AI call
  const aiResult = await answerEnterpriseQuestion(content, contextRecords, history);

  // 5. Store assistant message
  const assistantMsg = {
    id: uuidv4(),
    organization_id: orgId,
    conversation_id: conv.id,
    user_id: null,
    role: 'assistant',
    content: aiResult.answer,
    citations: aiResult.citations,
    created_at: new Date().toISOString(),
  };
  EnterpriseDataStore.conversationMessages.push(assistantMsg);

  conv.updated_at = new Date().toISOString();

  res.json({
    success: true,
    data: {
      user_message: userMsg,
      assistant_message: assistantMsg,
      key_findings: aiResult.key_findings,
      citations: aiResult.citations,
      suggested_next_actions: aiResult.suggested_next_actions,
      limitations: aiResult.limitations,
    },
  });
}

export async function renameConversation(req: AuthenticatedRequest, res: Response) {
  const { conversationId } = req.params;
  const { title } = req.body;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;

  const conv = EnterpriseDataStore.conversations.find(
    c => c.id === conversationId && c.organization_id === orgId && c.user_id === userId
  );

  if (!conv) {
    res.status(404).json({
      success: false,
      error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' },
    });
    return;
  }

  conv.title = title;
  conv.updated_at = new Date().toISOString();

  res.json({
    success: true,
    data: conv,
  });
}

export async function deleteConversation(req: AuthenticatedRequest, res: Response) {
  const { conversationId } = req.params;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;

  const idx = EnterpriseDataStore.conversations.findIndex(
    c => c.id === conversationId && c.organization_id === orgId && c.user_id === userId
  );

  if (idx === -1) {
    res.status(404).json({
      success: false,
      error: { code: 'CONVERSATION_NOT_FOUND', message: 'Conversation not found.' },
    });
    return;
  }

  EnterpriseDataStore.conversations.splice(idx, 1);
  EnterpriseDataStore.conversationMessages = EnterpriseDataStore.conversationMessages.filter(
    m => m.conversation_id !== conversationId
  );

  res.json({
    success: true,
    data: { message: 'Conversation deleted.' },
  });
}
