import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEligibility } from '../hooks/useEligibility';
import { calculateImpactScore } from '../services/eligibilityEngine';
import { format } from 'date-fns';
import Welcome from '../components/Welcome';
import { getUserProfile } from '../services/firestoreService';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, documents, medicines, schemes, eligibility, dependencies, loading, refresh } = useEligibility(user?.uid);
  const [showWelcome, setShowWelcome] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      if (user?.uid) {
        const userProfile = await getUserProfile(user.uid);
        setShowWelcome(!userProfile || !userProfile.age);
        setCheckingProfile(false);
      }
    };
    checkProfile();
  }, [user?.uid]);

  if (loading || !user || checkingProfile) return <div className="container">Loading dashboard...</div>;

  if (showWelcome) {
    return <Welcome onComplete={() => { setShowWelcome(false); refresh(); }} />;
  }

  const eligibleSchemes = schemes.filter(s => eligibility?.eligible.includes(s.id));
  const criticalDependencies = dependencies.filter(d => d.daysUntilExpiry <= 30);

  return (
    <div className="container">
      <h1 style={{ marginBottom: '24px' }}>Dashboard</h1>

      {/* Critical Alerts */}
      {criticalDependencies.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid #e53e3e' }}>
          <h3 style={{ color: '#e53e3e', marginBottom: '16px' }}>⚠️ What You'll Lose Next</h3>
          {criticalDependencies.map(dep => (
            <div key={dep.itemId} className="alert alert-danger" style={{ marginBottom: '12px' }}>
              <strong>{dep.itemName}</strong> expires in <strong>{dep.daysUntilExpiry} days</strong>
              {dep.affectedSchemes.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '13px' }}>
                  You will lose: {dep.affectedSchemes.map(s => s.name).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {documents.length === 0 && (
        <div className="alert alert-warning">
          <strong>👋 Get Started:</strong> Add your documents and complete your profile to see eligible schemes!
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3182ce' }}>{documents.length}</div>
          <div style={{ color: '#718096' }}>Documents</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#38a169' }}>{medicines.length}</div>
          <div style={{ color: '#718096' }}>Medicines</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d69e2e' }}>{eligibleSchemes.length}</div>
          <div style={{ color: '#718096' }}>Eligible Schemes</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#e53e3e' }}>{dependencies.length}</div>
          <div style={{ color: '#718096' }}>Expiring Soon</div>
        </div>
      </div>

      {/* Eligible Schemes */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Your Eligible Schemes</h3>
        {eligibleSchemes.length === 0 ? (
          <p style={{ color: '#718096' }}>Complete your profile to see eligible schemes</p>
        ) : (
          eligibleSchemes.map(scheme => (
            <div key={scheme.id} style={{ padding: '12px', background: '#f7fafc', borderRadius: '6px', marginBottom: '8px' }}>
              <strong>{scheme.name}</strong>
              <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>{scheme.description}</div>
            </div>
          ))
        )}
      </div>

      {/* Expiry Timeline */}
      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>Expiry Timeline (Next 90 Days)</h3>
        {dependencies.length === 0 ? (
          <p style={{ color: '#718096' }}>No items expiring soon</p>
        ) : (
          dependencies.map(dep => (
            <div key={dep.itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div>
                <strong>{dep.itemName}</strong>
                <span className={`badge ${dep.daysUntilExpiry <= 30 ? 'badge-danger' : 'badge-warning'}`} style={{ marginLeft: '8px' }}>
                  {dep.daysUntilExpiry} days
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#718096' }}>
                {format(new Date(dep.expiryDate), 'MMM dd, yyyy')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
