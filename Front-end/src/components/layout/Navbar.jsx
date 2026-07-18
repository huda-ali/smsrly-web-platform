import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar({ variant = 'default' }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const Logo = () => (
    <div className={styles.brand} onClick={() => navigate('/')}>
      <div className={styles.logoBox}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <span className={styles.brandName}>SMSRLY</span>
    </div>
  );

  if (variant === 'dashboard') return null;

  return (
    <nav className={`${styles.navbar} ${variant === 'transparent' ? styles.transparent : ''}`}>
      <Logo />
      <div className={styles.links}>
        <button className={styles.link} onClick={() => navigate('/search')}>Browse Homes</button>
        {(user?.role === 'owner' || !user) && (
          <button className={styles.link} onClick={() => user ? navigate('/dashboard') : navigate('/signup')}>For Owners</button>
        )}
        <button className={styles.link} onClick={() => navigate('/search?amenities=true')}>Nearby Services</button>
      </div>
      <div className={styles.actions}>
        {user ? (
          <>
            {user.role === 'admin' && (
              <button className={styles.link} onClick={() => navigate('/admin')}>Admin Panel</button>
            )}
            {user.role === 'owner' && (
              <button className={styles.link} onClick={() => navigate('/dashboard')}>Dashboard</button>
            )}
            <button className={styles.avatarBtn} onClick={() => navigate('/profile')} title={user.name}>
              <div className={styles.avatarCircle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              </div>
              <span className={styles.avatarName}>{user.name.split(' ')[0]}</span>
            </button>
          </>
        ) : (
          <>
            <button className={styles.signInBtn} onClick={() => navigate('/signin')}>Sign In</button>
            <button className={styles.getStartedBtn} onClick={() => navigate('/signup')}>Get Started</button>
            <div className={styles.guestBadge} onClick={() => navigate('/signin')}>
              <div className={styles.guestCircle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              </div>
              <span className={styles.guestLabel}>Guest</span>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
