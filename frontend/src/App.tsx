import React from 'react';
import Layout from './components/templates/Layout';
import Dashboard from './components/pages/Dashboard';

const App: React.FC = () => {
  const userRole: 'admin' | 'participant' = 'participant';

  return (
    <Layout role={userRole}>
      <Dashboard />
    </Layout>
  );
};

export default App;
