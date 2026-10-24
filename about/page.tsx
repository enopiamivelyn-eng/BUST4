'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header title="About Us" showBackButton />
        <div className="content-area">
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>About Bus Ticketing</h2>
            <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
              Bus Ticketing System is a modern, user-friendly platform designed to make
              bus travel booking simple and efficient. We connect passengers with
              reliable bus operators across the region.
            </p>
            <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
              Our mission is to provide seamless travel experiences through technology,
              offering real-time booking, secure payments, and instant confirmation.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}