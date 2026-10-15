import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';

// Authenticated Pages
import { DashboardPage } from './pages/app/DashboardPage';
import { TasksPage } from './pages/app/TasksPage';
import { TaskDetailPage } from './pages/app/TaskDetailPage';
import { NewTaskPage } from './pages/app/NewTaskPage';
import { DocumentsPage } from './pages/app/DocumentsPage';
import { DocumentDetailPage } from './pages/app/DocumentDetailPage';
import { DocumentUploadPage } from './pages/app/DocumentUploadPage';
import { AssistantPage } from './pages/app/AssistantPage';
import { WorkflowsPage } from './pages/app/WorkflowsPage';
import { WorkflowDetailPage } from './pages/app/WorkflowDetailPage';
import { NewWorkflowPage } from './pages/app/NewWorkflowPage';
import { ApprovalsPage } from './pages/app/ApprovalsPage';
import { InsightsPage } from './pages/app/InsightsPage';
import { SearchPage } from './pages/app/SearchPage';
import { NotificationsPage } from './pages/app/NotificationsPage';
import { TeamPage } from './pages/app/TeamPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { AuditLogPage } from './pages/app/AuditLogPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Authenticated Workspace Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Tasks */}
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/new" element={<NewTaskPage />} />
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />

          {/* Documents */}
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/upload" element={<DocumentUploadPage />} />
          <Route path="documents/:documentId" element={<DocumentDetailPage />} />

          {/* Nexus AI Assistant */}
          <Route path="assistant" element={<AssistantPage />} />

          {/* Workflows */}
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="workflows/new" element={<NewWorkflowPage />} />
          <Route path="workflows/:workflowId" element={<WorkflowDetailPage />} />

          {/* Approvals */}
          <Route path="approvals" element={<ApprovalsPage />} />

          {/* Insights */}
          <Route path="insights" element={<InsightsPage />} />

          {/* Search & Notifications */}
          <Route path="search" element={<SearchPage />} />
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Team & Directory */}
          <Route path="team" element={<TeamPage />} />

          {/* Settings & Audit Logs */}
          <Route path="settings/organization" element={<SettingsPage />} />
          <Route
            path="audit-log"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'executive']}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
