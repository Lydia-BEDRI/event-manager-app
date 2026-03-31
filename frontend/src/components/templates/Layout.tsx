import React, { useState } from 'react';
import Header from '../organisms/Header';
import Sidebar from '../organisms/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  role?: 'ADMIN' | 'PARTICIPANT';
}

const Layout: React.FC<LayoutProps> = ({ children, role = 'PARTICIPANT' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

return (
    <div className="min-h-screen bg-primary-dark p-0 sm:p-4 xl:p-6 xl:pl-0 flex flex-col xl:flex-row relative">
      {isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="xl:hidden fixed inset-0 bg-primary-dark/60 z-40"
          aria-label="Fermer le menu"
        />
      )}

      <div
        className={`xl:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transition-transform duration-200 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          role={role}
          isMobileDrawer
          onNavigate={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="hidden xl:block">
        <Sidebar role={role} />
      </div>

      <div className="flex w-full flex-1 bg-white rounded-none sm:rounded-3xl overflow-hidden shadow-xl xl:h-[calc(100vh-3rem)]">
        
        <div className="flex-1 flex flex-col">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 sm:p-6 xl:p-8">
              {children}
            </div>
          </main>
        </div>

      </div>
    </div>
  );
};

export default Layout;
