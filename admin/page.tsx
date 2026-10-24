'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AdminDashboardPage() {
  return (
    <div className="container">
      <Sidebar isAdmin />
      <main className="main-content">
        <Header title="Dashboard" />
        <div className="content-area">
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Dashboard Overview</h2>
            <p style={{ color: '#6b7280' }}>Welcome to the admin dashboard. Select an option from the sidebar to manage the system.</p>
          </div>
        </div>
      </main>
    </div>
  );
}