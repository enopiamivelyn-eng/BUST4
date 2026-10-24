'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function SearchResultsPage() {
  const router = useRouter();
  const [busData, setBusData] = useState({
    busName: 'JoyBus',
    from: 'Cebu',
    to: 'Oslob',
    date: 'September 5, 2026',
    time: '8:00AM',
    seat: '15',
    price: '200'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchData = sessionStorage.getItem('searchData');
      if (searchData) {
        const data = JSON.parse(searchData);
        const dateObj = new Date(data.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        const bookingData = {
          busName: 'JoyBus',
          from: data.from || 'Cebu',
          to: data.to || 'Oslob',
          date: data.date || '2026-09-05',
          time: data.time || '8:00 AM',
          seat: data.seatNo || '15',
          price: '200'
        };
        
        setBusData({
          ...bookingData,
          date: formattedDate
        });
        
        sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
      }
    }
  }, []);

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header title="Hello + Username!" showBackButton />
        
        <div className="content-area">
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Bus</h2>
            
            <div className={styles.bookDetails}>
              <div className={styles.busImageSmall}></div>
              
              <div className={styles.bookingInfo}>
                <p style={{ marginBottom: '10px', fontSize: '16px', color: '#6b7280' }}>
                  {busData.date} | {busData.time}
                </p>
                <div className={styles.routeInfo}>
                  <span style={{ fontWeight: '600' }}>{busData.from}</span>
                  <span style={{ margin: '0 10px' }}>→</span>
                  <span style={{ fontWeight: '600' }}>{busData.to}</span>
                </div>
                <p style={{ marginTop: '10px', color: '#6b7280' }}>Seat: {busData.seat}</p>
                <p style={{ fontSize: '20px', fontWeight: '600', marginTop: '10px' }}>
                  ₱{busData.price}
                </p>
              </div>
            </div>

            <div className={styles.centerContent}>
              <button 
                className="btn-primary" 
                onClick={() => router.push('/passenger-details')}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
