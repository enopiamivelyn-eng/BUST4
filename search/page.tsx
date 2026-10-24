'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './search.module.css';

export default function SearchPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    from: 'Cebu',
    to: 'Oslob',
    date: '2026-09-05',
    time: '8:00 AM',
    passengers: '1',
    seatNo: '15'
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Store in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('searchData', JSON.stringify(formData));
    }
    
    router.push('/search-results');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header title="Hello + Username!" showBackButton />
        
        <div className="content-area">
          <div className={styles.searchForm}>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="from">From</label>
                <input
                  type="text"
                  id="from"
                  name="from"
                  className="form-control"
                  value={formData.from}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="to">To</label>
                <input
                  type="text"
                  id="to"
                  name="to"
                  className="form-control"
                  value={formData.to}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGrid}>
                <div className="form-group">
                  <label htmlFor="date">Departure Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time">Time</label>
                  <select
                    id="time"
                    name="time"
                    className="form-control"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  >
                    {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className="form-group">
                  <label htmlFor="passengers">Passenger</label>
                  <select
                    id="passengers"
                    name="passengers"
                    className="form-control"
                    value={formData.passengers}
                    onChange={handleChange}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="seatNo">Seat No.</label>
                  <select
                    id="seatNo"
                    name="seatNo"
                    className="form-control"
                    value={formData.seatNo}
                    onChange={handleChange}
                    required
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.centerContent}>
                <button type="submit" className="btn-primary">Search</button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
