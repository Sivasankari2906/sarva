import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEligibility } from '../hooks/useEligibility';

export default function Schemes() {
  const { user } = useAuth();
  const { schemes, eligibility, loading } = useEligibility(user?.uid);

  if (loading || !user) return <div className="container">Loading schemes...</div>;

  const eligibleSchemes = schemes.filter(s => eligibility?.eligible.includes(s.id));
  const ineligibleSchemes = schemes.filter(s => eligibility?.ineligible.includes(s.id));

  return (
    <div className="container">
      <h1 style={{ marginBottom: '24px' }}>Government Schemes</h1>

      <div className="card">
        <h3 style={{ color: '#38a169', marginBottom: '16px' }}>✓ You Are Eligible For</h3>
        {eligibleSchemes.length === 0 ? (
          <p style={{ color: '#718096' }}>Complete your profile and add documents to see eligible schemes</p>
        ) : (
          eligibleSchemes.map(scheme => (
            <div key={scheme.id} style={{ padding: '16px', background: '#f0fff4', borderRadius: '6px', marginBottom: '12px', border: '1px solid #c6f6d5' }}>
              <strong style={{ fontSize: '16px' }}>{scheme.name}</strong>
              <p style={{ fontSize: '14px', color: '#2d3748', marginTop: '8px' }}>{scheme.description}</p>
              <div style={{ fontSize: '13px', color: '#718096', marginTop: '8px' }}>
                State: {scheme.state} | Category: {scheme.category}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <h3 style={{ color: '#718096', marginBottom: '16px' }}>✗ Not Eligible</h3>
        {ineligibleSchemes.length === 0 ? (
          <p style={{ color: '#718096' }}>All available schemes are eligible for you!</p>
        ) : (
          ineligibleSchemes.map(scheme => (
            <div key={scheme.id} style={{ padding: '16px', background: '#f7fafc', borderRadius: '6px', marginBottom: '12px', opacity: 0.7 }}>
              <strong style={{ fontSize: '16px' }}>{scheme.name}</strong>
              <p style={{ fontSize: '14px', color: '#718096', marginTop: '8px' }}>{scheme.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
