'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function TicketPage() {
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
      const bookingData = sessionStorage.getItem('bookingData');
      if (bookingData) {
        const data = JSON.parse(bookingData);
        const dateObj = new Date(data.date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        setBusData({
          busName: data.busName || 'JoyBus',
          from: data.from || 'Cebu',
          to: data.to || 'Oslob',
          date: formattedDate,
          time: data.time || '8:00AM',
          seat: data.seat || '15',
          price: data.price || '200'
        });
      }
    }
  }, []);

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header showBackButton />
        
        <div className="content-area">
          <div className="card">
            <div className={styles.qrContainer}>
              {/* QR Code */}
              <div className={styles.qrCode}>
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  {/* Top-left corner */}
                  <rect x="10" y="10" width="50" height="50" fill="none" stroke="black" strokeWidth="8"/>
                  <rect x="22" y="22" width="26" height="26" fill="black"/>
                  
                  {/* Top-right corner */}
                  <rect x="140" y="10" width="50" height="50" fill="none" stroke="black" strokeWidth="8"/>
                  <rect x="152" y="22" width="26" height="26" fill="black"/>
                  
                  {/* Bottom-left corner */}
                  <rect x="10" y="140" width="50" height="50" fill="none" stroke="black" strokeWidth="8"/>
                  <rect x="22" y="152" width="26" height="26" fill="black"/>
                  
                  {/* Data modules */}
                  <rect x="70" y="10" width="8" height="8" fill="black"/>
                  <rect x="82" y="10" width="8" height="8" fill="black"/>
                  <rect x="94" y="10" width="8" height="8" fill="black"/>
                  <rect x="118" y="10" width="8" height="8" fill="black"/>
                  
                  <rect x="10" y="70" width="8" height="8" fill="black"/>
                  <rect x="22" y="70" width="8" height="8" fill="black"/>
                  <rect x="46" y="70" width="8" height="8" fill="black"/>
                  
                  <rect x="70" y="22" width="8" height="8" fill="black"/>
                  <rect x="70" y="34" width="8" height="8" fill="black"/>
                  <rect x="82" y="34" width="8" height="8" fill="black"/>
                  <rect x="94" y="22" width="8" height="8" fill="black"/>
                  <rect x="106" y="34" width="8" height="8" fill="black"/>
                  <rect x="118" y="22" width="8" height="8" fill="black"/>
                  
                  <rect x="70" y="46" width="8" height="8" fill="black"/>
                  <rect x="94" y="46" width="8" height="8" fill="black"/>
                  <rect x="106" y="46" width="8" height="8" fill="black"/>
                  <rect x="130" y="46" width="8" height="8" fill="black"/>
                  
                  <rect x="70" y="70" width="8" height="8" fill="black"/>
                  <rect x="82" y="70" width="8" height="8" fill="black"/>
                  <rect x="94" y="82" width="8" height="8" fill="black"/>
                  <rect x="106" y="70" width="8" height="8" fill="black"/>
                  <rect x="118" y="82" width="8" height="8" fill="black"/>
                  <rect x="130" y="70" width="8" height="8" fill="black"/>
                  
                  <rect x="70" y="94" width="8" height="8" fill="black"/>
                  <rect x="82" y="106" width="8" height="8" fill="black"/>
                  <rect x="94" y="94" width="8" height="8" fill="black"/>
                  <rect x="106" y="106" width="8" height="8" fill="black"/>
                  <rect x="118" y="94" width="8" height="8" fill="black"/>
                  <rect x="130" y="106" width="8" height="8" fill="black"/>
                  
                  <rect x="70" y="118" width="8" height="8" fill="black"/>
                  <rect x="82" y="118" width="8" height="8" fill="black"/>
                  <rect x="94" y="130" width="8" height="8" fill="black"/>
                  <rect x="106" y="118" width="8" height="8" fill="black"/>
                  <rect x="118" y="130" width="8" height="8" fill="black"/>
                  <rect x="130" y="118" width="8" height="8" fill="black"/>
                  
                  <rect x="70" y="142" width="8" height="8" fill="black"/>
                  <rect x="82" y="154" width="8" height="8" fill="black"/>
                  <rect x="94" y="166" width="8" height="8" fill="black"/>
                  <rect x="106" y="154" width="8" height="8" fill="black"/>
                  <rect x="118" y="166" width="8" height="8" fill="black"/>
                  <rect x="130" y="142" width="8" height="8" fill="black"/>
                  
                  <rect x="142" y="70" width="8" height="8" fill="black"/>
                  <rect x="154" y="82" width="8" height="8" fill="black"/>
                  <rect x="166" y="70" width="8" height="8" fill="black"/>
                  <rect x="178" y="82" width="8" height="8" fill="black"/>
                  <rect x="190" y="70" width="8" height="8" fill="black"/>
                  
                  <rect x="142" y="94" width="8" height="8" fill="black"/>
                  <rect x="154" y="106" width="8" height="8" fill="black"/>
                  <rect x="166" y="118" width="8" height="8" fill="black"/>
                  <rect x="178" y="94" width="8" height="8" fill="black"/>
                  <rect x="190" y="106" width="8" height="8" fill="black"/>
                  
                  <rect x="142" y="130" width="8" height="8" fill="black"/>
                  <rect x="154" y="142" width="8" height="8" fill="black"/>
                  <rect x="166" y="154" width="8" height="8" fill="black"/>
                  <rect x="178" y="166" width="8" height="8" fill="black"/>
                  <rect x="190" y="178" width="8" height="8" fill="black"/>
                </svg>
              </div>

              <h3 style={{ margin: '20px 0 10px', fontSize: '24px' }}>{busData.busName}</h3>
              
              <div className={styles.routeInfo}>
                <span style={{ fontSize: '20px', fontWeight: '600' }}>{busData.from}</span>
                <span style={{ margin: '0 15px', fontSize: '20px' }}>→</span>
                <span style={{ fontSize: '20px', fontWeight: '600' }}>{busData.to}</span>
              </div>
              
              <p style={{ fontSize: '18px', marginBottom: '8px', color: '#6b7280' }}>
                {busData.date} | {busData.time}
              </p>
              <p style={{ fontSize: '18px', marginBottom: '15px', fontWeight: '600' }}>
                Seat: {busData.seat}
              </p>
              <p style={{ fontSize: '22px', fontWeight: '700', color: '#1f2937' }}>
                Total Amount: ₱{busData.price}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
