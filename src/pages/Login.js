import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { saveUserProfile } from '../services/firestoreService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await saveUserProfile(userCredential.user.uid, {
          name,
          email,
          age: 0,
          income: 0,
          occupation: '',
          state: '',
          createdAt: new Date()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '450px', width: '100%', background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(10px)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '2px solid rgba(13, 148, 136, 0.5)' }}>
        
        {/* Form */}
        <div style={{ padding: '32px 40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img src="/logo.png" alt="Sarva" style={{ height: '50px', marginBottom: '12px' }} />
            <h2 style={{ color: '#0d9488', marginBottom: '4px', fontSize: '24px' }}>
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p style={{ color: '#718096', fontSize: '13px' }}>
              {isSignup ? 'Sign up to get started' : 'Login to your account'}
            </p>
          </div>
          
          {error && <div className="alert alert-danger" style={{ marginBottom: '16px', padding: '10px' }}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            {isSignup && (
              <>
                <label style={{ color: '#2d3748', fontWeight: '500' }}>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter your name"
                  style={{ border: '2px solid #e2e8f0', marginBottom: '8px' }}
                  required 
                />
              </>
            )}
            
            <label style={{ color: '#2d3748', fontWeight: '500' }}>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter your email"
              style={{ border: '2px solid #e2e8f0', marginBottom: '8px' }}
              required 
            />
            
            <label style={{ color: '#2d3748', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Enter your password"
              style={{ border: '2px solid #e2e8f0', marginBottom: isSignup ? '8px' : '0' }}
              required 
            />
            
            {isSignup && (
              <>
                <label style={{ color: '#2d3748', fontWeight: '500' }}>Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Confirm your password"
                  style={{ border: '2px solid #e2e8f0', marginBottom: '0' }}
                  required 
                />
              </>
            )}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px', fontSize: '15px', fontWeight: '600', marginTop: '4px' }}>
              {isSignup ? 'Create Account' : 'Login'}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ color: '#718096', fontSize: '13px', marginBottom: '8px' }}>
              {isSignup ? 'Already have an account?' : "Don't have an account?"}
            </p>
            <button 
              onClick={() => { setIsSignup(!isSignup); setError(''); setConfirmPassword(''); setName(''); }} 
              style={{ background: 'transparent', border: '2px solid #0d9488', color: '#0d9488', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
            >
              {isSignup ? 'Login Instead' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
