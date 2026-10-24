'use client';

import { useState, useEffect } from 'react';
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
  deletedAt?: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Load bookings from localStorage
  useEffect(() => {
    loadBookings();
    
    // Sync with backend every 10 seconds (fast sync)
    const syncInterval = setInterval(() => {
      syncWithBackend();
    }, 10000);

    return () => clearInterval(syncInterval);
  }, []);

  const loadBookings = () => {
    const stored = localStorage.getItem('user_bookings');
    if (stored) {
      const data = JSON.parse(stored);
      setBookings(data.filter((b: Booking) => !b.deletedAt));
    } else {
      // Default booking
      const defaultBooking: Booking = {
        id: 'BOK-108',
        bookingCode: 'BOK-108',
        busName: 'JoyBus',
        route: 'Cebu → Oslob',
        datetime: 'September 5, 2026 | 8:00AM',
        seat: '15',
        price: '200',
        status: 'upcoming'
      };
      setBookings([defaultBooking]);
      localStorage.setItem('user_bookings', JSON.stringify([defaultBooking]));
    }
  };

  const syncWithBackend = async () => {
    try {
      // Check for deleted bookings from backend
      const response = await fetch('/api/sync-bookings', { method: 'POST' });
      if (response.ok) {
        const { deletedCodes } = await response.json();
        if (deletedCodes?.length > 0) {
          removeDeletedBookings(deletedCodes);
        }
      }
    } catch (error) {
      console.log('Sync skipped');
    }
  };

  const removeDeletedBookings = (deletedCodes: string[]) => {
    const updated = bookings.filter(b => !deletedCodes.includes(b.bookingCode));
    if (updated.length !== bookings.length) {
      setBookings(updated);
      localStorage.setItem('user_bookings', JSON.stringify(updated));
    }
  };

  const deleteBooking = (id: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      const updated = bookings.filter(b => b.id !== id);
      setBookings(updated);
      localStorage.setItem('user_bookings', JSON.stringify(updated));
    }
  };

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header showBackButton />
        
        <div className="content-area">
          <div className={styles.tabs}>
            <div 
              className={`${styles.tab} ${activeTab === 'upcoming' ? styles.active : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </div>
            <div 
              className={`${styles.tab} ${activeTab === 'completed' ? styles.active : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </div>
            <div 
              className={`${styles.tab} ${activeTab === 'cancelled' ? styles.active : ''}`}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
            </div>
          </div>

          <div className={styles.tabContent}>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div key={booking.id} className={styles.bookingCard}>
                  <div className={styles.bookingHeader}>
                    <span className={styles.bookingId}>{booking.bookingCode}</span>
                    <span className={styles.bookingStatus}>{booking.status}</span>
                  </div>
                  <div className={styles.bookingDetails}>
                    <div className={styles.busName}>{booking.busName}</div>
                    <div className={styles.route}>{booking.route}</div>
                    <div className={styles.datetime}>{booking.datetime}</div>
                    <div className={styles.seatInfo}>Seat: {booking.seat}</div>
                    <div className={styles.price}>₱{booking.price}</div>
                  </div>
                  <div className={styles.bookingActions}>
                    <button 
                      className={styles.viewTicketBtn}
                      onClick={() => router.push('/ticket')}
                    >
                      View ticket
                    </button>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => deleteBooking(booking.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>No {activeTab} bookings</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
