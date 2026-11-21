import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEligibility } from '../hooks/useEligibility';

export default function Schemes() {
  const { user } = useAuth();
  const { schemes, eligibility, loading } = useEligibility(user?.uid);
  const [showAllEligible, setShowAllEligible] = useState(false);
  const [showIneligible, setShowIneligible] = useState(false);
  const PAGE = 50;

  if (loading || !user) return <div className="container">Loading schemes...</div>;

  // Schemes are loaded for the state in the profile, so there is nothing to show until it is filled in.
  if (schemes.length === 0) {
    return (
      <div className="container">
        <h1 style={{ marginBottom: '24px' }}>Government Schemes</h1>
        <div className="card">
          <p style={{ color: '#718096' }}>Complete your profile (including your state) to see which schemes you are eligible for.</p>
        </div>
      </div>
    );
  }

  const eligibleSchemes = schemes.filter(s => eligibility?.eligible.includes(s.id));
  const ineligibleSchemes = schemes.filter(s => eligibility?.ineligible.includes(s.id));

  return (
    <div className="container">
      <h1 style={{ marginBottom: '24px' }}>Government Schemes</h1>
      <p style={{ fontSize: '13px', color: '#718096', marginBottom: '16px' }}>
        Eligibility is an estimate from your profile. Always confirm on the official portal before applying.
      </p>

      <div className="card">
        <h3 style={{ color: '#38a169', marginBottom: '16px' }}>✓ You Are Eligible For ({eligibleSchemes.length})</h3>
        {eligibleSchemes.length === 0 ? (
          <p style={{ color: '#718096' }}>Complete your profile and add documents to see eligible schemes</p>
        ) : (
          (showAllEligible ? eligibleSchemes : eligibleSchemes.slice(0, PAGE)).map(scheme => (
            <div key={scheme.id} style={{ padding: '16px', background: '#f0fff4', borderRadius: '6px', marginBottom: '12px', border: '1px solid #c6f6d5' }}>
              <strong style={{ fontSize: '16px' }}>{scheme.name}</strong>
              <p style={{ fontSize: '14px', color: '#2d3748', marginTop: '8px' }}>{scheme.description}</p>
              <div style={{ fontSize: '13px', color: '#718096', marginTop: '8px' }}>
                State: {scheme.state} | Category: {scheme.category}
                {scheme.officialUrl && (
                  <> | <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer">Details and how to apply</a></>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {eligibleSchemes.length > PAGE && !showAllEligible && (
        <button className="btn" onClick={() => setShowAllEligible(true)} style={{ marginBottom: '16px' }}>
          Show all {eligibleSchemes.length} eligible schemes
        </button>
      )}

      <div className="card">
        <h3 style={{ color: '#718096', marginBottom: '16px' }}>✗ Not Eligible ({ineligibleSchemes.length})</h3>
        {ineligibleSchemes.length > 0 && (
          <button className="btn" onClick={() => setShowIneligible(!showIneligible)} style={{ marginBottom: '12px' }}>
            {showIneligible ? 'Hide' : 'Show'} schemes you are not eligible for
          </button>
        )}
        {!showIneligible ? null : ineligibleSchemes.length === 0 ? (
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
      <p style={{ fontSize: '12px', color: '#a0aec0', marginTop: '16px' }}>
        Scheme data: <a href="https://huggingface.co/datasets/Sumna/indian-government-schemes-2025" target="_blank" rel="noopener noreferrer">Indian Government Schemes Dataset</a> by SmartDuke Technologies (schemefit.com), CC BY 4.0, sourced from myscheme.gov.in.
      </p>
    </div>
  );
}
