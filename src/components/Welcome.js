import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { seedMockData } from '../utils/mockData';
import * as firestoreService from '../services/firestoreService';

export default function Welcome({ onComplete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLoadMockData = async () => {
    setLoading(true);
    setMessage('Loading mock data...');
    const result = await seedMockData(user.uid, firestoreService);
    setMessage(result.message);
    setLoading(false);
    if (result.success) {
      setTimeout(() => onComplete(), 1500);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '16px' }}>👋 Welcome to Sarva!</h2>
        <p style={{ color: '#718096', marginBottom: '24px' }}>
          Sarva helps you track document expiry and government scheme eligibility.
        </p>

        <div style={{ background: '#f7fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>🚀 Quick Start Options:</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>Option 1: Load Demo Data</strong>
            <p style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
              Instantly see how Sarva works with sample profile, documents, and medicines
            </p>
            <button 
              className="btn btn-primary" 
              onClick={handleLoadMockData}
              disabled={loading}
              style={{ marginTop: '8px', width: '100%' }}
            >
              {loading ? 'Loading...' : '✨ Load Demo Data'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <strong>Option 2: Manual Setup</strong>
            <p style={{ fontSize: '14px', color: '#718096', marginTop: '4px' }}>
              Start fresh and add your own data
            </p>
            <button 
              className="btn" 
              onClick={onComplete}
              style={{ marginTop: '8px', width: '100%', background: '#e2e8f0' }}
            >
              📝 Start Fresh
            </button>
          </div>
        </div>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-warning'}`}>
            {message}
          </div>
        )}

        <div style={{ fontSize: '13px', color: '#718096', marginTop: '16px' }}>
          <strong>What you'll get with demo data:</strong>
          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
            <li>Profile: 45-year-old Farmer from Karnataka</li>
            <li>4 Documents (Aadhaar, Ration Card, Income Certificate, PAN)</li>
            <li>2 Medicines (including chronic medication)</li>
            <li>6 Government schemes to check eligibility</li>
            <li>Real expiry alerts and dependency mapping</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
