'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './home.module.css';

export default function HomePage() {
  const router = useRouter();

  const routes = [
    { name: 'Cebu-Bato', price: '₱300', duration: '5 hours' },
    { name: 'Cebu-Oslob', price: '₱200', duration: '5 hours' },
    { name: 'Cebu-Boljoon', price: '₱300', duration: '5 hours' },
    { name: 'Cebu-Dalaguete', price: '₱300', duration: '5 hours' },
  ];

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <Header title="Hello + Username!" />
        
        <div className="content-area">
          <svg className={styles.busImage} viewBox="0 0 600 250" xmlns="http://www.w3.org/2000/svg">
            <rect x="100" y="80" width="400" height="120" rx="25" fill="#1e3a8a"/>
            <rect x="115" y="95" width="370" height="90" rx="20" fill="#2563eb"/>
            <rect x="140" y="115" width="70" height="50" rx="8" fill="#93c5fd"/>
            <rect x="220" y="115" width="70" height="50" rx="8" fill="#93c5fd"/>
            <rect x="300" y="115" width="70" height="50" rx="8" fill="#93c5fd"/>
            <rect x="380" y="115" width="70" height="50" rx="8" fill="#93c5fd"/>
            <circle cx="190" cy="200" r="28" fill="#1f2937"/>
            <circle cx="190" cy="200" r="18" fill="#6b7280"/>
            <circle cx="410" cy="200" r="28" fill="#1f2937"/>
            <circle cx="410" cy="200" r="18" fill="#6b7280"/>
            <rect x="475" y="120" width="20" height="40" rx="5" fill="#fbbf24"/>
            <rect x="475" y="165" width="20" height="25" rx="5" fill="#ef4444"/>
          </svg>

          <section className={styles.routesSection}>
            <h3>Popular Routes</h3>
            <div className={styles.routesGrid}>
              {routes.map((route, index) => (
                <div key={index} className={styles.routeCard}>
                  <div className={styles.routeImage}></div>
                  <h4>{route.name}</h4>
                  <p className={styles.price}>{route.price}</p>
                  <p className={styles.duration}>{route.duration}</p>
                </div>
              ))}
            </div>
            
            <div className={styles.centerContent}>
              <button className="btn-primary" onClick={() => router.push('/search')}>
                Book Now
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
