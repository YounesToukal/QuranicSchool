import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Suspense, lazy } from 'react';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const RecoveryPage = lazy(() => import('./pages/RecoveryPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const ParentGuidePage = lazy(() => import('./pages/ParentGuidePage'));
const TeacherGuidePage = lazy(() => import('./pages/TeacherGuidePage'));
const AdminGuidePage = lazy(() => import('./pages/AdminGuidePage'));

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route
            path="/parent-guide"
            element={
              <ProtectedRoute role="parent">
                <ParentGuidePage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/parent/*"
            element={
              <ProtectedRoute role="parent">
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/teacher-guide"
            element={
              <ProtectedRoute role="teacher">
                <TeacherGuidePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute role="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin-guide"
            element={
              <ProtectedRoute role="admin">
                <AdminGuidePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
