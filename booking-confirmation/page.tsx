'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './page.module.css';

interface Booking {
  id: string;
  bookingCode: string;
  busName: string;
  route: string;
  datetime: string;
  seat: string;
  price: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export default function BookingConfirmationPage() {
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

        // Save to My Bookings (prevent duplicates)
        saveBooking(data, formattedDate);
      }
    }
  }, []);

  const saveBooking = (data: any, formattedDate: string) => {
    const bookingCode = generateBookingCode();
    
    const newBooking: Booking = {
      id: bookingCode,
      bookingCode: bookingCode,
      busName: data.busName || 'JoyBus',
      route: `${data.from || 'Cebu'} → ${data.to || 'Oslob'}`,
      datetime: `${formattedDate} | ${data.time || '8:00AM'}`,
      seat: data.seat || '15',
      price: data.price || '200',
      status: 'upcoming'
    };

    // Get existing bookings
    const stored = localStorage.getItem('user_bookings');
    let bookings: Booking[] = stored ? JSON.parse(stored) : [];

    // Check for duplicates (same bus, route, date, seat)
    const isDuplicate = bookings.some(b => 
      b.busName === newBooking.busName &&
      b.route === newBooking.route &&
      b.datetime === newBooking.datetime &&
      b.seat === newBooking.seat
    );

    if (!isDuplicate) {
      bookings.push(newBooking);
      localStorage.setItem('user_bookings', JSON.stringify(bookings));
      console.log('Booking saved:', bookingCode);
    } else {
      console.log('Duplicate booking prevented');
    }
  };

  const generateBookingCode = () => {
    const num = Math.floor(Math.random() * 900) + 100;
    return `BOK-${num}`;
  };

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header showBackButton />
        
        <div className="content-area">
          <div className={styles.successIcon}>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </div>

          <div className="card">
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

          <div className={styles.confirmationButtons}>
            <button 
              className="btn-primary" 
              onClick={() => router.push('/ticket')}
            >
              Download Ticket
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => router.push('/my-bookings')}
            >
              View MyBookings
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
