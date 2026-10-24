'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AdminRoutesPage() {
  return (
    <div className="container">
      <Sidebar isAdmin />
      <main className="main-content">
        <Header title="Routes" showBackButton />
        <div className="content-area">
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Manage Routes</h2>
            <p style={{ color: '#6b7280' }}>Route management features will appear here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}