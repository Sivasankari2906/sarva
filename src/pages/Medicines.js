import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserMedicines, addMedicine, updateDocument, deleteDoc } from '../services/firestoreService';
import { format, differenceInDays } from 'date-fns';
import { deleteDoc as deleteFirestoreDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';

const MEDICINE_CATEGORIES = ['Chronic Disease', 'Acute Treatment', 'Preventive', 'Supplement', 'Other'];
const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream/Ointment', 'Inhaler'];

export default function Medicines() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    category: '',
    dosageForm: '',
    strength: '',
    frequency: '',
    prescribedBy: '',
    prescriptionDate: '',
    expiryDate: '', 
    refillDate: '', 
    quantity: '',
    continuityRequired: false 
  });

  useEffect(() => {
    if (user?.uid) loadMedicines();
  }, [user?.uid]);

  const loadMedicines = async () => {
    const meds = await getUserMedicines(user.uid);
    setMedicines(meds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await addMedicine(user.uid, form);
    setForm({ 
      name: '', 
      category: '',
      dosageForm: '',
      strength: '',
      frequency: '',
      prescribedBy: '',
      prescriptionDate: '',
      expiryDate: '', 
      refillDate: '', 
      quantity: '',
      continuityRequired: false 
    });
    setShowForm(false);
    loadMedicines();
  };

  const handleDelete = async (medId) => {
    if (window.confirm('Delete this medicine?')) {
      await deleteFirestoreDoc(doc(db, 'medicines', medId));
      loadMedicines();
    }
  };

  const getMedicineStatus = (med) => {
    const expiryDays = differenceInDays(new Date(med.expiryDate), new Date());
    const refillDays = med.refillDate ? differenceInDays(new Date(med.refillDate), new Date()) : null;
    
    if (expiryDays < 0) return { status: 'expired', color: '#e53e3e', message: 'Expired' };
    if (expiryDays <= 30) return { status: 'expiring', color: '#d69e2e', message: `Expires in ${expiryDays} days` };
    if (refillDays !== null && refillDays <= 7) return { status: 'refill', color: '#3182ce', message: `Refill in ${refillDays} days` };
    return { status: 'active', color: '#38a169', message: 'Active' };
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Medicines</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Medicine'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Add New Medicine</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label>Medicine Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Metformin" required />
              </div>
              <div>
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select Category</option>
                  {MEDICINE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label>Dosage Form</label>
                <select value={form.dosageForm} onChange={(e) => setForm({ ...form, dosageForm: e.target.value })} required>
                  <option value="">Select Form</option>
                  {DOSAGE_FORMS.map(form => <option key={form} value={form}>{form}</option>)}
                </select>
              </div>
              <div>
                <label>Strength/Dosage</label>
                <input value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} placeholder="e.g., 500mg" required />
              </div>
              <div>
                <label>Frequency</label>
                <input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="e.g., Twice daily" required />
              </div>
              <div>
                <label>Quantity</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g., 30 tablets" required />
              </div>
              <div>
                <label>Prescribed By</label>
                <input value={form.prescribedBy} onChange={(e) => setForm({ ...form, prescribedBy: e.target.value })} placeholder="Doctor name" />
              </div>
              <div>
                <label>Prescription Date</label>
                <input type="date" value={form.prescriptionDate} onChange={(e) => setForm({ ...form, prescriptionDate: e.target.value })} />
              </div>
              <div>
                <label>Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} required />
              </div>
              <div>
                <label>Next Refill Date</label>
                <input type="date" value={form.refillDate} onChange={(e) => setForm({ ...form, refillDate: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.continuityRequired} onChange={(e) => setForm({ ...form, continuityRequired: e.target.checked })} style={{ width: 'auto', marginRight: '8px' }} />
                  Continuity Required (for chronic conditions)
                </label>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>Add Medicine</button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Your Medicines</h3>
        {medicines.length === 0 ? (
          <p style={{ color: '#718096' }}>No medicines added yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {medicines.map(med => {
              const { status, color, message } = getMedicineStatus(med);
              return (
                <div key={med.id} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '18px' }}>{med.name}</strong>
                        <span className={`badge badge-${status === 'active' ? 'success' : status === 'refill' ? 'warning' : 'danger'}`}>
                          {message}
                        </span>
                        {med.continuityRequired && (
                          <span className="badge" style={{ background: '#0d9488', color: 'white' }}>Chronic</span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px', color: '#718096' }}>
                        <div><strong>Category:</strong> {med.category}</div>
                        <div><strong>Form:</strong> {med.dosageForm}</div>
                        <div><strong>Strength:</strong> {med.strength}</div>
                        <div><strong>Frequency:</strong> {med.frequency}</div>
                        <div><strong>Quantity:</strong> {med.quantity}</div>
                        {med.prescribedBy && <div><strong>Prescribed By:</strong> {med.prescribedBy}</div>}
                        {med.prescriptionDate && <div><strong>Prescription Date:</strong> {format(new Date(med.prescriptionDate), 'MMM dd, yyyy')}</div>}
                        <div><strong>Expiry:</strong> {format(new Date(med.expiryDate), 'MMM dd, yyyy')}</div>
                        {med.refillDate && <div><strong>Next Refill:</strong> {format(new Date(med.refillDate), 'MMM dd, yyyy')}</div>}
                      </div>
                    </div>
                    <button className="btn btn-danger" onClick={() => handleDelete(med.id)} style={{ padding: '8px 16px' }}>Delete</button>
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
