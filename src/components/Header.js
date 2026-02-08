import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <header style={{ background: '#0d9488', color: 'white', padding: '0', marginBottom: '24px', height: '60px', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/logo.png" alt="Sarva" style={{ height: '100px', filter: 'brightness(1.3)' }} />
        </Link>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
          <Link to="/profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</Link>
          <Link to="/documents" style={{ color: 'white', textDecoration: 'none' }}>Documents</Link>
          <Link to="/medicines" style={{ color: 'white', textDecoration: 'none' }}>Medicines</Link>
          <Link to="/schemes" style={{ color: 'white', textDecoration: 'none' }}>Schemes</Link>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
