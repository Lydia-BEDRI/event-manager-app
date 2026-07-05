import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { trackPageView } from "./observability/matomo";
import CookieConsentBanner from "./components/organisms/CookieConsentBanner";
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
import AvailableEventsPage from "./components/pages/AvailableEventsPage";
import MyParticipationsPage from "./components/pages/MyParticipationsPage";
import MyQrCodesPage from "./components/pages/MyQrCodesPage";
import PresenceVerificationPage from "./components/pages/PresenceVerificationPage";
import AdminSettingsPage from "./components/pages/AdminSettingsPage";
import KioskPage from "./components/pages/KioskPage";
import BadgeWriterPage from "./components/pages/BadgeWriterPage";

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
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role="ADMIN">
              <EventsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/available-events"
        element={
          <ProtectedRoute allowedRoles={["PARTICIPANT"]}>
            <Layout role="PARTICIPANT">
              <AvailableEventsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-participations"
        element={
          <ProtectedRoute allowedRoles={["PARTICIPANT"]}>
            <Layout role="PARTICIPANT">
              <MyParticipationsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-qr-codes"
        element={
          <ProtectedRoute allowedRoles={["PARTICIPANT"]}>
            <Layout role="PARTICIPANT">
              <MyQrCodesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/presence"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role={userRole || "PARTICIPANT"}>
              <PresenceVerificationPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kiosk"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <KioskPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/badge-writer"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role="ADMIN">
              <BadgeWriterPage />
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
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <Layout role="ADMIN">
              <AdminSettingsPage />
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

const AnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
};

const pageTitles: Record<string, string> = {
  '/login': 'Connexion',
  '/register': 'Inscription',
  '/forgot-password': 'Mot de passe oublié',
  '/reset-password': 'Réinitialisation du mot de passe',
  '/privacy': 'Politique de confidentialité',
  '/legal': 'Mentions légales',
  '/cookies': 'Gestion des cookies',
  '/dashboard': 'Tableau de bord',
  '/exports': 'Exports',
  '/events': 'Événements',
  '/events/create': 'Créer un événement',
  '/available-events': 'Événements disponibles',
  '/my-participations': 'Mes participations',
  '/my-qr-codes': 'Mes QR codes',
  '/presence': 'Vérifier une présence',
  '/kiosk': 'Kiosque d’accès',
  '/badge-writer': 'Encoder un badge',
  '/zones': 'Zones',
  '/zones/create': 'Créer une zone',
  '/participants': 'Participants',
  '/admin/settings': 'Paramètres',
  '/profile': 'Mon profil',
  '/chats': 'Discussions',
};

const PageMetadata: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = pageTitles[pathname];
    if (!title && /^\/events\/[^/]+\/edit$/.test(pathname)) title = 'Modifier un événement';
    if (!title && /^\/zones\/[^/]+\/edit$/.test(pathname)) title = 'Modifier une zone';
    if (!title && /^\/chats\/[^/]+$/.test(pathname)) title = 'Discussion d’événement';
    document.title = `${title || 'EventManager'} | EventManager`;
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AnalyticsTracker />
      <PageMetadata />
      <CookieConsentBanner />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
