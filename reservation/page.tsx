'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function ReservationPage() {
  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header title="My Reservation" showBackButton />
        <div className="content-area">
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>My Reservations</h2>
            <p style={{ color: '#6b7280' }}>Your active reservations will appear here.</p>
          </div>
        </div>
      </main>
    </div>
  );
}