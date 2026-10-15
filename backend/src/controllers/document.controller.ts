import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
import { AuthenticatedRequest } from '../types';
import { EnterpriseDataStore } from '../repositories/data.store';
import { analyzeEnterpriseDocument } from '../services/gemini.service';
import { getAdminClient } from '../lib/supabase';
import { env } from '../config/env';

export async function listDocuments(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const docs = EnterpriseDataStore.documents
    .filter(d => d.organization_id === orgId)
    .map(d => {
      const uploader = EnterpriseDataStore.profiles.find(p => p.id === d.uploaded_by);
      const department = EnterpriseDataStore.departments.find(dept => dept.id === d.department_id);
      return {
        ...d,
        uploader: uploader ? { full_name: uploader.full_name, job_title: uploader.job_title } : null,
        department: department ? { name: department.name } : null,
      };
    });

  res.json({
    success: true,
    data: docs,
  });
}

export async function uploadDocument(req: AuthenticatedRequest, res: Response) {
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      error: { code: 'FILE_MISSING', message: 'No file was uploaded.' },
    });
    return;
  }

  const { title, category, department_id, description, related_task_id } = req.body;
  const docTitle = title || file.originalname;

  // Extract readable text
  let extractedText = '';
  try {
    if (file.mimetype === 'application/pdf') {
      const parsedPdf = await pdfParse(file.buffer);
      extractedText = parsedPdf.text || '';
    } else {
      extractedText = file.buffer.toString('utf-8');
    }
  } catch (err: any) {
    console.warn('Text extraction warning:', err);
    extractedText = `File: ${file.originalname} (${file.size} bytes). Text extraction preview unavailable.`;
  }

  const docId = uuidv4();
  const storagePath = `${orgId}/${docId}_${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

  const newDoc = {
    id: docId,
    organization_id: orgId,
    department_id: department_id || null,
    uploaded_by: userId,
    title: docTitle,
    description: description || '',
    category: category || 'general',
    storage_path: storagePath,
    mime_type: file.mimetype,
    file_size: file.size,
    processing_status: 'uploaded',
    processing_error: null,
    extracted_text: extractedText,
    analysis: null as any,
    related_task_id: related_task_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Upload to Supabase Storage if configured
  const supabase = getAdminClient();
  if (supabase) {
    try {
      await supabase.storage
        .from(env.SUPABASE_DOCUMENTS_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });
    } catch (storageErr: any) {
      console.warn('Supabase storage upload notice:', storageErr.message || storageErr);
    }
  }

  EnterpriseDataStore.documents.unshift(newDoc);

  // Activity log
  EnterpriseDataStore.activityLogs.unshift({
    id: uuidv4(),
    organization_id: orgId,
    actor_id: userId,
    action: 'DOCUMENT_UPLOADED',
    resource_type: 'document',
    resource_id: newDoc.id,
    details: { title: newDoc.title, category: newDoc.category, size: newDoc.file_size },
    created_at: new Date().toISOString(),
  });

  // Automatically trigger background analysis
  setImmediate(async () => {
    try {
      newDoc.processing_status = 'processing';
      const analysis = await analyzeEnterpriseDocument(extractedText, docTitle);
      newDoc.analysis = analysis;
      newDoc.processing_status = 'completed';
      newDoc.updated_at = new Date().toISOString();

      // Notify uploader
      EnterpriseDataStore.notifications.unshift({
        id: uuidv4(),
        organization_id: orgId,
        user_id: userId,
        type: 'DOCUMENT_ANALYZED',
        title: 'Document Intelligence Analysis Completed',
        message: `Analysis for "${newDoc.title}" is ready with ${analysis.action_items?.length || 0} suggested action items.`,
        resource_type: 'document',
        resource_id: newDoc.id,
        idempotency_key: `doc-analysis-${newDoc.id}`,
        read_at: null,
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      newDoc.processing_status = 'failed';
      newDoc.processing_error = err.message || 'Analysis processing failed';
    }
  });

  res.status(201).json({
    success: true,
    data: newDoc,
  });
}

export async function getDocumentById(req: AuthenticatedRequest, res: Response) {
  const { documentId } = req.params;
  const orgId = req.user!.organization_id;

  const doc = EnterpriseDataStore.documents.find(d => d.id === documentId && d.organization_id === orgId);
  if (!doc) {
    res.status(404).json({
      success: false,
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
    });
    return;
  }

  const uploader = EnterpriseDataStore.profiles.find(p => p.id === doc.uploaded_by);
  const department = EnterpriseDataStore.departments.find(dept => dept.id === doc.department_id);

  res.json({
    success: true,
    data: {
      ...doc,
      uploader: uploader || null,
      department: department || null,
    },
  });
}

export async function analyzeDocument(req: AuthenticatedRequest, res: Response) {
  const { documentId } = req.params;
  const orgId = req.user!.organization_id;

  const doc = EnterpriseDataStore.documents.find(d => d.id === documentId && d.organization_id === orgId);
  if (!doc) {
    res.status(404).json({
      success: false,
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
    });
    return;
  }

  doc.processing_status = 'processing';
  doc.processing_error = null;

  try {
    const analysis = await analyzeEnterpriseDocument(doc.extracted_text || doc.title, doc.title);
    doc.analysis = analysis;
    doc.processing_status = 'completed';
    doc.updated_at = new Date().toISOString();

    res.json({
      success: true,
      data: {
        document_id: doc.id,
        processing_status: doc.processing_status,
        analysis,
      },
    });
  } catch (err: any) {
    doc.processing_status = 'failed';
    doc.processing_error = err.message || 'Analysis failed';
    res.status(500).json({
      success: false,
      error: { code: 'DOCUMENT_ANALYSIS_FAILED', message: doc.processing_error },
    });
  }
}

export async function getDocumentStatus(req: AuthenticatedRequest, res: Response) {
  const { documentId } = req.params;
  const orgId = req.user!.organization_id;

  const doc = EnterpriseDataStore.documents.find(d => d.id === documentId && d.organization_id === orgId);
  if (!doc) {
    res.status(404).json({
      success: false,
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
    });
    return;
  }

  res.json({
    success: true,
    data: {
      id: doc.id,
      processing_status: doc.processing_status,
      processing_error: doc.processing_error,
      has_analysis: !!doc.analysis,
    },
  });
}

export async function acceptActionItems(req: AuthenticatedRequest, res: Response) {
  const { documentId } = req.params;
  const orgId = req.user!.organization_id;
  const userId = req.user!.id;
  const { action_items } = req.body;

  const doc = EnterpriseDataStore.documents.find(d => d.id === documentId && d.organization_id === orgId);
  if (!doc) {
    res.status(404).json({
      success: false,
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
    });
    return;
  }

  const createdTasks: any[] = [];
  for (const item of action_items) {
    const task = {
      id: uuidv4(),
      organization_id: orgId,
      department_id: item.department_id || doc.department_id || req.user!.department_id || null,
      title: item.title,
      description: item.description || `Generated from document: ${doc.title}`,
      acceptance_criteria: [],
      status: 'todo',
      priority: item.priority || 'medium',
      assignee_id: item.assignee_id || null,
      created_by: userId,
      due_at: item.due_at || null,
      completed_at: null,
      source_document_id: doc.id,
      tags: ['document-extracted', doc.category],
      metadata: { source_document_title: doc.title },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    EnterpriseDataStore.tasks.unshift(task);
    createdTasks.push(task);
  }

  // Activity log
  EnterpriseDataStore.activityLogs.unshift({
    id: uuidv4(),
    organization_id: orgId,
    actor_id: userId,
    action: 'TASKS_CREATED_FROM_DOCUMENT',
    resource_type: 'document',
    resource_id: doc.id,
    details: { count: createdTasks.length },
    created_at: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    data: {
      message: `Created ${createdTasks.length} task(s) from document action items.`,
      tasks: createdTasks,
    },
  });
}

export async function getDocumentDownloadUrl(req: AuthenticatedRequest, res: Response) {
  const { documentId } = req.params;
  const orgId = req.user!.organization_id;

  const doc = EnterpriseDataStore.documents.find(d => d.id === documentId && d.organization_id === orgId);
  if (!doc) {
    res.status(404).json({
      success: false,
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
    });
    return;
  }

  const supabase = getAdminClient();
  let signedUrl: string | null = null;

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(env.SUPABASE_DOCUMENTS_BUCKET)
        .createSignedUrl(doc.storage_path, env.SIGNED_URL_TTL_SECONDS);

      if (!error && data?.signedUrl) {
        signedUrl = data.signedUrl;
      }
    } catch (err: any) {
      console.warn('Could not generate Supabase signed URL:', err.message);
    }
  }

  res.json({
    success: true,
    data: {
      document_id: doc.id,
      title: doc.title,
      download_url: signedUrl,
      expires_in_seconds: env.SIGNED_URL_TTL_SECONDS,
      storage_type: signedUrl ? 'supabase_storage' : 'application_cache',
    },
  });
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response) {
  const { documentId } = req.params;
  const orgId = req.user!.organization_id;

  const idx = EnterpriseDataStore.documents.findIndex(d => d.id === documentId && d.organization_id === orgId);
  if (idx === -1) {
    res.status(404).json({
      success: false,
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
    });
    return;
  }

  const [removedDoc] = EnterpriseDataStore.documents.splice(idx, 1);

  // Remove from Supabase Storage if configured
  const supabase = getAdminClient();
  if (supabase && removedDoc?.storage_path) {
    try {
      await supabase.storage
        .from(env.SUPABASE_DOCUMENTS_BUCKET)
        .remove([removedDoc.storage_path]);
    } catch (storageErr: any) {
      console.warn('Supabase storage removal notice:', storageErr.message);
    }
  }

  res.json({
    success: true,
    data: { message: 'Document deleted successfully.' },
  });
}
