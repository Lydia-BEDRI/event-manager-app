import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/templates/Layout";
import AdminDashboard from "./components/pages/AdminDashboard";
import ParticipantDashboard from "./components/pages/ParticipantDashboard";
import ExportPage from "./components/pages/ExportPage";
import EventsPage from "./components/pages/EventsPage";
import PrivacyPolicy from "./components/pages/PrivacyPolicy";
import LegalNotice from "./components/pages/LegalNotice";
import CookieSettings from "./components/pages/CookieSettings";
import LoginPage from "./components/pages/LoginPage";
import RegisterPage from "./components/pages/RegisterPage";
import ForgotPasswordPage from "./components/pages/ForgotPasswordPage";
import ResetPasswordPage from "./components/pages/ResetPasswordPage";
import ProtectedRoute from "./components/organisms/ProtectedRoute";
import ZonesPage from "./components/pages/ZonesPage";
import CreateEventPage from "./components/pages/CreateEventPage";
import EditEventPage from "./components/pages/EditEventPage";
import CreateZonePage from "./components/pages/CreateZonePage";
import EditZonePage from "./components/pages/EditZonePage";
import ParticipantsPage from "./components/pages/ParticipantsPage";
import ProfilePage from "./components/pages/ProfilePage";
import ChatsPage from "./components/pages/ChatsPage";
import EventChatPage from "./components/pages/EventChatPage";

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  const userRole = user?.role?.toUpperCase() as
    | "ADMIN"
    | "PARTICIPANT"
    | undefined;

  const getDashboardComponent = () => {
    if (userRole === "ADMIN") {
      return <AdminDashboard />;
    }
    return <ParticipantDashboard />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-dark flex items-center justify-center">
        <div className="text-white text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/privacy"
        element={
          isAuthenticated ? (
            <Layout role={userRole || "PARTICIPANT"}>
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
            <Layout role={userRole || "PARTICIPANT"}>
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
            <Layout role={userRole || "PARTICIPANT"}>
              <CookieSettings />
            </Layout>
          ) : (
            <CookieSettings />
          )
        }
      />

      {/* Routes protégées */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout role={userRole || "PARTICIPANT"}>
              {getDashboardComponent()}
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Route racine redirige vers dashboard si authentifié, sinon vers login */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Route Exports (Admin uniquement) */}
      <Route
        path="/exports"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role="ADMIN">
              <ExportPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Route Events */}
      <Route
        path="/events/create"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role="ADMIN">
              <CreateEventPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id/edit"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role="ADMIN">
              <EditEventPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Layout role={userRole || "PARTICIPANT"}>
              <EventsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/zones"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role={"ADMIN"}>
              <ZonesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/zones/create"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role={"ADMIN"}>
              <CreateZonePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/zones/:zoneId/edit"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role={"ADMIN"}>
              <EditZonePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/participants"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role={"ADMIN"}>
              <ParticipantsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout role={userRole || "PARTICIPANT"}>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/chats"
        element={
          <ProtectedRoute>
            <Layout role={userRole || "PARTICIPANT"}>
              <ChatsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/chats/:eventId"
        element={
          <ProtectedRoute>
            <Layout role={userRole || "PARTICIPANT"}>
              <EventChatPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* redirige vers login si non authentifié */}
      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
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
