'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (email && password) {
      // Store user session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userEmail', email);
      }
      
      // Check if admin login
      if (email.includes('admin')) {
        router.push('/admin/buses');
      } else {
        router.push('/home');
      }
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginLeft}>
        <div className={styles.loginLogo}>
          <div className={styles.logo}>
            <img src="/assets/images/logo-SCSIT.png" alt="SCSIT Logo" />
          </div>
        </div>
        
        <div className={styles.logoTextContainer}>
          <span className={styles.logoText}>
            Salazar <span className={styles.logoHighlight}>Lost and Found</span>
          </span>
        </div>

        <svg className={styles.busIllustration} viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
          <rect x="50" y="60" width="300" height="100" rx="20" fill="#1e3a8a"/>
          <rect x="60" y="70" width="280" height="80" rx="15" fill="#2563eb"/>
          <rect x="80" y="85" width="50" height="40" rx="5" fill="#93c5fd"/>
          <rect x="140" y="85" width="50" height="40" rx="5" fill="#93c5fd"/>
          <rect x="200" y="85" width="50" height="40" rx="5" fill="#93c5fd"/>
          <rect x="260" y="85" width="50" height="40" rx="5" fill="#93c5fd"/>
          <circle cx="120" cy="160" r="20" fill="#1f2937"/>
          <circle cx="120" cy="160" r="12" fill="#6b7280"/>
          <circle cx="280" cy="160" r="20" fill="#1f2937"/>
          <circle cx="280" cy="160" r="12" fill="#6b7280"/>
          <rect x="330" y="90" width="15" height="30" rx="3" fill="#fbbf24"/>
          <rect x="330" y="130" width="15" height="20" rx="3" fill="#ef4444"/>
        </svg>
      </div>

      <div className={styles.loginRight}>
        <div className={styles.loginForm}>
          <h2>Welcome!</h2>
          <p>Sign in to continue</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <a href="#" className={styles.forgotLink}>Forgot Password</a>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
