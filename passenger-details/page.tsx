'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './page.module.css';

export default function PassengerDetailsPage() {
  const router = useRouter();
  const [busData, setBusData] = useState({
    busName: 'JoyBus',
    from: 'Cebu',
    to: 'Oslob',
    date: 'September 5, 2026',
    time: '8:00AM',
    seat: '15'
  });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    idNumber: ''
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
          seat: data.seat || '15'
        });
      }
    }
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (typeof window !== 'undefined') {
      const bookingData = JSON.parse(sessionStorage.getItem('bookingData') || '{}');
      bookingData.passengerName = formData.fullName;
      bookingData.passengerEmail = formData.email;
      bookingData.passengerId = formData.idNumber;
      
      sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    }
    
    router.push('/payment');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header showBackButton />
        
        <div className="content-area">
          <h2 style={{ marginBottom: '30px', color: '#2563eb' }}>Passenger Details</h2>
          
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

          <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '20px' }}>Passenger Information</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">FullName</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="form-control"
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="idNumber">ID Number</label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  className="form-control"
                  placeholder="Enter ID number"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.centerContent}>
                <button type="submit" className="btn-primary">
                  Continue to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
