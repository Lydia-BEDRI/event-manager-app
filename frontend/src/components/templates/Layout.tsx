import React from 'react';
import Header from '../organisms/Header';
import Sidebar from '../organisms/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  role?: 'admin' | 'participant';
}

const Layout: React.FC<LayoutProps> = ({ children, role = 'participant' }) => {
return (
    <div className="min-h-screen bg-primary-dark p-6 pl-0 flex">
      <Sidebar role={role} />
      <div className="flex w-full h-[calc(100vh-3rem)] bg-white rounded-3xl overflow-hidden shadow-xl">
        
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>

      </div>
    </div>
  );
};

export default Layout;
