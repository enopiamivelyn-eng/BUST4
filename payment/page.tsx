'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function PaymentPage() {
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
  const [selectedMethod, setSelectedMethod] = useState('');

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedMethod) {
      alert('Please select a payment method');
      return;
    }
    
    if (typeof window !== 'undefined') {
      const bookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');
      bookingData.paymentMethod = selectedMethod;
      bookingData.paymentDate = new Date().toISOString();
      
      sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    }
    
    setTimeout(() => {
      router.push('/booking-confirmation');
    }, 1000);
  };

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header showBackButton />
        
        <div className="content-area">
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Book Details</h3>
            
            <div className={styles.bookDetails}>
              <div className={styles.busImageSmall}></div>
              
              <div className={styles.bookingInfo}>
                <h3>{busData.busName}</h3>
                <div className={styles.routeInfo}>
                  <span>{busData.from}</span>
                  <span style={{ margin: '0 10px' }}>→</span>
                  <span>{busData.to}</span>
                </div>
                <p style={{ marginTop: '5px' }}>{busData.date} | {busData.time}</p>
                <p style={{ marginTop: '5px' }}>Seat: {busData.seat}</p>
              </div>
            </div>
          </div>

          <div className={styles.totalSection}>
            <span>Total Amount</span>
            <span>₱{busData.price}</span>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Select Payment Method</h3>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.paymentMethods}>
                <label className={styles.paymentOption}>
                  <div className={styles.paymentLeft}>
                    <div className={styles.paymentIcon}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="#2563eb">
                        <circle cx="12" cy="12" r="10"/>
                        <text x="12" y="16" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">G</text>
                      </svg>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>Gcash</span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="gcash"
                    checked={selectedMethod === 'gcash'}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    required
                  />
                </label>

                <label className={styles.paymentOption}>
                  <div className={styles.paymentLeft}>
                    <div className={styles.paymentIcon} style={{ backgroundColor: '#1f2937' }}>
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                        <rect x="4" y="8" width="16" height="10" rx="2"/>
                        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">M</text>
                      </svg>
                    </div>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>Maya</span>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="maya"
                    checked={selectedMethod === 'maya'}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                  />
                </label>
              </div>

              <div className={styles.centerContent}>
                <button type="submit" className="btn-primary">
                  Pay ₱{busData.price}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
