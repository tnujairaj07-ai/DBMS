import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import CoursesMentorsPage from './pages/student/CoursesMentorsPage';
import FacultyProfilePage from './pages/faculty/FacultyProfilePage';
import ProjectIdeasPage from './pages/projects/ProjectIdeasPage';
import TeamsPage from './pages/teams/TeamsPage';
import TeamDetailPage from './pages/teams/TeamDetailPage';
import ProposalsPage from './pages/proposals/ProposalsPage';
import AdminAllocationPage from './pages/admin/AdminAllocationPage';
import ProjectMilestonesPage from './pages/milestones/ProjectMilestonesPage';
import FacultyReviewQueuePage from './pages/faculty/FacultyReviewQueuePage';
import MilestoneReportsPage from './pages/milestones/MilestoneReportsPage';
import PeerMentorsPage from './pages/peer/PeerMentorsPage';
import ConsultationsPage from './pages/consultations/ConsultationsPage';
import ExecutiveAnalyticsPage from './pages/reports/ExecutiveAnalyticsPage';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/ideas" element={<ProjectIdeasPage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/teams/:id" element={<TeamDetailPage />} />
        <Route path="/proposals" element={<ProposalsPage />} />
        <Route path="/milestones" element={<ProjectMilestonesPage />} />
        <Route path="/projects/:proposalId/milestones" element={<ProjectMilestonesPage />} />
        <Route path="/peer-mentors" element={<PeerMentorsPage />} />
        <Route path="/consultations" element={<ConsultationsPage />} />
        <Route path="/analytics" element={<ExecutiveAnalyticsPage />} />
        <Route path="/reports/milestones" element={<MilestoneReportsPage />} />

        {/* Faculty Protected Routes */}
        <Route
          path="/faculty/review-queue"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <FacultyReviewQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/profile"
          element={
            <ProtectedRoute allowedRoles={['FACULTY']}>
              <FacultyProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/allocations"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAllocationPage />
            </ProtectedRoute>
          }
        />

        {/* Courses & Mentors */}
        <Route path="/courses" element={<CoursesMentorsPage />} />

        {/* Student Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}
