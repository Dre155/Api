import React from 'react';
import SideNav from './sidenav';
import AuthRoute from './auth';

function AuthLayout({ children }) {
  return (
    <AuthRoute>
      <div className="app-container">
        <SideNav />
        <main className="main-content">
          {children}
        </main>
      </div>
    </AuthRoute>
  );
}

export default AuthLayout;