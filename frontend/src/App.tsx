import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/templates/Layout';
import Dashboard from './components/pages/Dashboard';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import LegalNotice from './components/pages/LegalNotice';
import CookieSettings from './components/pages/CookieSettings';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage';
import ResetPasswordPage from './components/pages/ResetPasswordPage';
import ProtectedRoute from './components/organisms/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const userRole = (user?.role?.toLowerCase() === 'admin' ? 'admin' : 'participant') as 'admin' | 'participant';

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/legal" element={<LegalNotice />} />
      <Route path="/cookies" element={<CookieSettings />} />

      {/* Routes protégées */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout role={userRole}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
