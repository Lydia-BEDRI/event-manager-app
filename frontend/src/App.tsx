import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/templates/Layout';
import Dashboard from './components/pages/Dashboard';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import LegalNotice from './components/pages/LegalNotice';
import CookieSettings from './components/pages/CookieSettings';

const App: React.FC = () => {
  const userRole: 'admin' | 'participant' = 'participant';

  return (
    <BrowserRouter>
      <Layout role={userRole}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal" element={<LegalNotice />} />
          <Route path="/cookies" element={<CookieSettings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
