import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/templates/Layout';
import AdminDashboard from './components/pages/AdminDashboard';
import ParticipantDashboard from './components/pages/ParticipantDashboard';
import ExportPage from './components/pages/ExportPage';
import EventsPage from './components/pages/EventsPage';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import LegalNotice from './components/pages/LegalNotice';
import CookieSettings from './components/pages/CookieSettings';
import LoginPage from './components/pages/LoginPage';
import RegisterPage from './components/pages/RegisterPage';
import ForgotPasswordPage from './components/pages/ForgotPasswordPage';
import ResetPasswordPage from './components/pages/ResetPasswordPage';
import ProtectedRoute from './components/organisms/ProtectedRoute';
import ZonesPage from './components/pages/ZonesPage';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const userRole = user?.role?.toUpperCase() as 'ADMIN' | 'PARTICIPANT' | undefined;

  const getDashboardComponent = () => {
    if (userRole === 'ADMIN') {
      return <AdminDashboard />;
    }
    return <ParticipantDashboard />;
  };

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      <Route
        path="/privacy"
        element={
          isAuthenticated ? (
            <Layout role={userRole || 'PARTICIPANT'}>
              <PrivacyPolicy />
            </Layout>
          ) : (
            <PrivacyPolicy />
          )
        }
      />
      <Route
        path="/legal"
        element={
          isAuthenticated ? (
            <Layout role={userRole || 'PARTICIPANT'}>
              <LegalNotice />
            </Layout>
          ) : (
            <LegalNotice />
          )
        }
      />
      <Route
        path="/cookies"
        element={
          isAuthenticated ? (
            <Layout role={userRole || 'PARTICIPANT'}>
              <CookieSettings />
            </Layout>
          ) : (
            <CookieSettings />
          )
        }
      />

      {/* Routes protégées */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout role={userRole || 'PARTICIPANT'}>
              {getDashboardComponent()}
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Route Exports (Admin uniquement) */}
      <Route
        path="/exports"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Layout role="ADMIN">
              <ExportPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Route Events */}
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Layout role={userRole || 'PARTICIPANT'}>
              <EventsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
       <Route path="/zones" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <Layout role={ 'ADMIN'}>
            <ZonesPage />
          </Layout>
          </ProtectedRoute>
        } />

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
