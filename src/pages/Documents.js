import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserDocuments, addDocument, deleteDocument, updateDocument } from '../services/firestoreService';
import { format, differenceInDays } from 'date-fns';

const DOC_TYPES = ['Aadhaar', 'PAN', 'Ration Card', 'Voter ID', 'Driving License', 'Passport', 'Income Certificate', 'Caste Certificate', 'Birth Certificate', 'Domicile Certificate'];

export default function Documents() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: '', documentNumber: '', issueDate: '', expiryDate: '', mobileNumber: '' });
  const [filter, setFilter] = useState('all');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [pendingDoc, setPendingDoc] = useState(null);
  const [verifyingDoc, setVerifyingDoc] = useState(null);
  const [verifyOtp, setVerifyOtp] = useState('');

  useEffect(() => {
    if (user?.uid) loadDocuments();
  }, [user?.uid]);

  const loadDocuments = async () => {
    const docs = await getUserDocuments(user.uid);
    setDocuments(docs);
  };

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mock document-mobile verification (always succeeds for demo)
    const isLinked = true;
    if (!isLinked) {
      alert('Document verification failed: This document is not linked to the provided mobile number.');
      return;
    }
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setPendingDoc(form);
    setOtpStep(true);
    alert(`Document verified with mobile number!\nYour OTP is: ${otp}\n(In production, this would be sent via SMS)`);
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (otp === generatedOtp) {
      await addDocument(user.uid, { ...pendingDoc, status: 'valid', verified: true, verifiedAt: new Date() });
      setForm({ type: '', documentNumber: '', issueDate: '', expiryDate: '', mobileNumber: '' });
      setShowForm(false);
      setOtpStep(false);
      setOtp('');
      setPendingDoc(null);
      loadDocuments();
      alert('Document verified and added successfully!');
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const handleVerifyExisting = (doc) => {
    const otp = generateOtp();
    setGeneratedOtp(otp);
    setVerifyingDoc(doc);
    alert(`Your OTP is: ${otp}\n(In production, this would be sent via SMS)`);
  };

  const handleExistingOtpVerify = async (e) => {
    e.preventDefault();
    if (verifyOtp === generatedOtp) {
      await updateDocument(verifyingDoc.id, { verified: true, verifiedAt: new Date() });
      setVerifyingDoc(null);
      setVerifyOtp('');
      loadDocuments();
      alert('Document verified successfully!');
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Delete this document?')) {
      await deleteDocument(docId);
      loadDocuments();
    }
  };

  const getDocumentStatus = (doc) => {
    if (!doc.expiryDate) return { status: 'valid', color: '#38a169', days: null };
    const days = differenceInDays(new Date(doc.expiryDate), new Date());
    if (days < 0) return { status: 'expired', color: '#e53e3e', days };
    if (days <= 30) return { status: 'expiring', color: '#d69e2e', days };
    return { status: 'valid', color: '#38a169', days };
  };

  const filteredDocs = documents.filter(doc => {
    if (filter === 'all') return true;
    const { status } = getDocumentStatus(doc);
    return status === filter;
  });

  const stats = {
    total: documents.length,
    valid: documents.filter(d => getDocumentStatus(d).status === 'valid').length,
    expiring: documents.filter(d => getDocumentStatus(d).status === 'expiring').length,
    expired: documents.filter(d => getDocumentStatus(d).status === 'expired').length
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Documents</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Document'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>{otpStep ? 'Verify OTP' : 'Add New Document'}</h3>
          {!otpStep ? (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label>Document Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
                    <option value="">Select Type</option>
                    {DOC_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label>Document Number</label>
                  <input value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} required />
                </div>
                <div>
                  <label>Issue Date</label>
                  <input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
                </div>
                <div>
                  <label>Expiry Date (if applicable)</label>
                  <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                </div>
                <div>
                  <label>Mobile Number (for verification)</label>
                  <input type="tel" value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} placeholder="Enter 10-digit mobile" maxLength="10" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Verify Document & Send OTP</button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerify}>
              <div className="alert alert-success">OTP has been sent! (Check the alert popup)</div>
              <label>Enter OTP</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" maxLength="6" required />
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary">Verify & Add Document</button>
                <button type="button" onClick={() => { setOtpStep(false); setOtp(''); }} style={{ padding: '10px 20px', border: '1px solid #cbd5e0', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Back</button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Your Documents</h3>
        {documents.length === 0 ? (
          <p style={{ color: '#718096' }}>No documents found</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {documents.map(doc => {
              const { status, color, days } = getDocumentStatus(doc);
              return (
                <div key={doc.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '18px' }}>{doc.type}</strong>
                        <span className={`badge badge-${status === 'valid' ? 'success' : status === 'expiring' ? 'warning' : 'danger'}`}>
                          {status === 'expired' ? 'Expired' : status === 'expiring' ? `Expires in ${days} days` : 'Valid'}
                        </span>
                        {doc.verified ? (
                          <span className="badge badge-success" style={{ background: '#0d9488', color: 'white' }}>✓ Verified</span>
                        ) : (
                          <span className="badge badge-warning">Not Verified</span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>
                        <strong>Number:</strong> {doc.documentNumber}
                      </div>
                      {doc.mobileNumber && (
                        <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>
                          <strong>Linked Mobile:</strong> {doc.mobileNumber}
                        </div>
                      )}
                      <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>
                        <strong>Issue Date:</strong> {format(new Date(doc.issueDate), 'MMM dd, yyyy')}
                      </div>
                      {doc.expiryDate && (
                        <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>
                          <strong>Expiry Date:</strong> {format(new Date(doc.expiryDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      {doc.verified && doc.verifiedAt && (
                        <div style={{ fontSize: '13px', color: '#0d9488', marginTop: '8px' }}>
                          ✓ Verified on {format(new Date(doc.verifiedAt.seconds * 1000), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      {!doc.verified && (
                        verifyingDoc?.id === doc.id ? (
                          <form onSubmit={handleExistingOtpVerify} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input type="text" value={verifyOtp} onChange={(e) => setVerifyOtp(e.target.value)} placeholder="Enter OTP" maxLength="6" style={{ padding: '6px', fontSize: '14px' }} required />
                            <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '14px' }}>Verify</button>
                            <button type="button" onClick={() => { setVerifyingDoc(null); setVerifyOtp(''); }} style={{ padding: '6px 12px', fontSize: '14px', border: '1px solid #cbd5e0', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Cancel</button>
                          </form>
                        ) : (
                          <button onClick={() => handleVerifyExisting(doc)} style={{ padding: '8px 16px', background: '#0d9488', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Verify</button>
                        )
                      )}
                      <button className="btn btn-danger" onClick={() => handleDelete(doc.id)} style={{ padding: '8px 16px' }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
