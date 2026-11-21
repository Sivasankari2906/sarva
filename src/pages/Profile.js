import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, saveUserProfile } from '../services/firestoreService';
import { format } from 'date-fns';

const STATES = ['Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Delhi', 'Gujarat', 'Rajasthan', 'West Bengal'];
const OCCUPATIONS = ['Student', 'Farmer', 'Self-Employed', 'Salaried', 'Unemployed', 'Retired'];
const GENDERS = ['Male', 'Female', 'Other'];
const MARITAL_STATUS = ['Single', 'Married', 'Divorced', 'Widowed'];
const RELIGIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Other'];
const COMMUNITIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ 
    name: '', 
    dateOfBirth: '', 
    gender: '', 
    phone: '', 
    address: '', 
    city: '', 
    pincode: '', 
    maritalStatus: '', 
    age: '', 
    income: '', 
    occupation: '', 
    state: '',
    religion: '',
    community: '',
    bloodGroup: '',
    fatherName: '',
    fatherOccupation: '',
    fatherAge: '',
    motherName: '',
    motherOccupation: '',
    motherAge: '',
    spouseName: '',
    numberOfChildren: '',
    totalFamilyMembers: '',
    emergencyContact: '',
    emergencyContactName: ''
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      const loadProfile = async () => {
        const data = await getUserProfile(user.uid);
        if (data) setProfile(data);
        setLoading(false);
      };
      loadProfile();
    }
  }, [user?.uid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveUserProfile(user.uid, { ...profile, age: parseInt(profile.age), income: parseInt(profile.income) });
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Your Profile</h1>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">✏️ Edit Profile</button>
        )}
      </div>

      {saved && <div className="alert alert-success">✓ Profile updated successfully!</div>}

      {!isEditing ? (
        <>
          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#0d9488', borderBottom: '2px solid #0d9488', paddingBottom: '8px' }}>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Full Name</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.name || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Email</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{user?.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Date of Birth</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.dateOfBirth ? format(new Date(profile.dateOfBirth), 'MMM dd, yyyy') : 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Age</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.age || 'Not set'} years</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Gender</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.gender || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Marital Status</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.maritalStatus || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Phone Number</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.phone || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Blood Group</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.bloodGroup || 'Not set'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#0d9488', borderBottom: '2px solid #0d9488', paddingBottom: '8px' }}>Religion & Community</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Religion</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.religion || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Community/Category</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.community || 'Not set'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#0d9488', borderBottom: '2px solid #0d9488', paddingBottom: '8px' }}>Family Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Total Family Members</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.totalFamilyMembers || 'Not set'}</div>
              </div>
              <div></div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ color: '#0d9488', marginBottom: '12px' }}>Father's Details</h4>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Father's Name</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.fatherName || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Father's Occupation</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.fatherOccupation || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Father's Age</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.fatherAge ? `${profile.fatherAge} years` : 'Not set'}</div>
              </div>
              <div></div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ color: '#0d9488', marginBottom: '12px' }}>Mother's Details</h4>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Mother's Name</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.motherName || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Mother's Occupation</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.motherOccupation || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Mother's Age</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.motherAge ? `${profile.motherAge} years` : 'Not set'}</div>
              </div>
              {profile.maritalStatus === 'Married' && (
                <>
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                    <h4 style={{ color: '#0d9488', marginBottom: '12px' }}>Spouse Details</h4>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Spouse Name</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.spouseName || 'Not set'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Number of Children</div>
                    <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.numberOfChildren || 'Not set'}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#0d9488', borderBottom: '2px solid #0d9488', paddingBottom: '8px' }}>Emergency Contact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Emergency Contact Name</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.emergencyContactName || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Emergency Contact Number</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.emergencyContact || 'Not set'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#0d9488', borderBottom: '2px solid #0d9488', paddingBottom: '8px' }}>Address Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Address</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.address || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>City</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.city || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>State</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.state || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Pincode</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.pincode || 'Not set'}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px', color: '#0d9488', borderBottom: '2px solid #0d9488', paddingBottom: '8px' }}>Professional Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Occupation</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{profile.occupation || 'Not set'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Annual Income</div>
                <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>₹{profile.income?.toLocaleString('en-IN') || 'Not set'}</div>
              </div>
              {profile.createdAt && (
                <div>
                  <div style={{ fontSize: '12px', color: '#718096', marginBottom: '4px' }}>Member Since</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px' }}>{format(new Date(profile.createdAt.seconds * 1000), 'MMM dd, yyyy')}</div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label>Full Name</label>
                <input type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
              </div>
              <div>
                <label>Date of Birth</label>
                <input type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })} required />
              </div>
              <div>
                <label>Age</label>
                <input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} required />
              </div>
              <div>
                <label>Gender</label>
                <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })} required>
                  <option value="">Select Gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label>Marital Status</label>
                <select value={profile.maritalStatus} onChange={(e) => setProfile({ ...profile, maritalStatus: e.target.value })} required>
                  <option value="">Select Status</option>
                  {MARITAL_STATUS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label>Phone Number</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} required />
              </div>
              <div>
                <label>Blood Group</label>
                <select value={profile.bloodGroup} onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}>
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Religion & Community</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label>Religion</label>
                <select value={profile.religion} onChange={(e) => setProfile({ ...profile, religion: e.target.value })}>
                  <option value="">Select Religion</option>
                  {RELIGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label>Community/Category</label>
                <select value={profile.community} onChange={(e) => setProfile({ ...profile, community: e.target.value })}>
                  <option value="">Select Community</option>
                  {COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Family Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label>Total Family Members</label>
                <input type="number" value={profile.totalFamilyMembers} onChange={(e) => setProfile({ ...profile, totalFamilyMembers: e.target.value })} />
              </div>
              <div></div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <h4 style={{ color: '#0d9488', marginBottom: '12px' }}>Father's Details</h4>
              </div>
              <div>
                <label>Father's Name</label>
                <input type="text" value={profile.fatherName} onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })} />
              </div>
              <div>
                <label>Father's Occupation</label>
                <select value={profile.fatherOccupation} onChange={(e) => setProfile({ ...profile, fatherOccupation: e.target.value })}>
                  <option value="">Select Occupation</option>
                  {OCCUPATIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                </select>
              </div>
              <div>
                <label>Father's Age</label>
                <input type="number" value={profile.fatherAge} onChange={(e) => setProfile({ ...profile, fatherAge: e.target.value })} />
              </div>
              <div></div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <h4 style={{ color: '#0d9488', marginBottom: '12px' }}>Mother's Details</h4>
              </div>
              <div>
                <label>Mother's Name</label>
                <input type="text" value={profile.motherName} onChange={(e) => setProfile({ ...profile, motherName: e.target.value })} />
              </div>
              <div>
                <label>Mother's Occupation</label>
                <select value={profile.motherOccupation} onChange={(e) => setProfile({ ...profile, motherOccupation: e.target.value })}>
                  <option value="">Select Occupation</option>
                  {OCCUPATIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                </select>
              </div>
              <div>
                <label>Mother's Age</label>
                <input type="number" value={profile.motherAge} onChange={(e) => setProfile({ ...profile, motherAge: e.target.value })} />
              </div>
              {profile.maritalStatus === 'Married' && (
                <>
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <h4 style={{ color: '#0d9488', marginBottom: '12px' }}>Spouse Details</h4>
                  </div>
                  <div>
                    <label>Spouse Name</label>
                    <input type="text" value={profile.spouseName} onChange={(e) => setProfile({ ...profile, spouseName: e.target.value })} />
                  </div>
                  <div>
                    <label>Number of Children</label>
                    <input type="number" value={profile.numberOfChildren} onChange={(e) => setProfile({ ...profile, numberOfChildren: e.target.value })} />
                  </div>
                </>
              )}
            </div>

            <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Emergency Contact</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label>Emergency Contact Name</label>
                <input type="text" value={profile.emergencyContactName} onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })} />
              </div>
              <div>
                <label>Emergency Contact Number</label>
                <input type="tel" value={profile.emergencyContact} onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })} />
              </div>
            </div>

            <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Address Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Address</label>
                <input type="text" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} required />
              </div>
              <div>
                <label>City</label>
                <input type="text" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} required />
              </div>
              <div>
                <label>State</label>
                <select value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} required>
                  <option value="">Select State</option>
                  {STATES.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
              <div>
                <label>Pincode</label>
                <input type="text" value={profile.pincode} onChange={(e) => setProfile({ ...profile, pincode: e.target.value })} required />
              </div>
            </div>

            <h3 style={{ marginBottom: '16px', color: '#0d9488' }}>Professional Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label>Occupation</label>
                <select value={profile.occupation} onChange={(e) => setProfile({ ...profile, occupation: e.target.value })} required>
                  <option value="">Select Occupation</option>
                  {OCCUPATIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                </select>
              </div>
              <div>
                <label>Annual Income (₹)</label>
                <input type="number" value={profile.income} onChange={(e) => setProfile({ ...profile, income: e.target.value })} required />
              </div>
              <div>
                <label>
                  <input type="checkbox" checked={Boolean(profile.hasDisability)} onChange={(e) => setProfile({ ...profile, hasDisability: e.target.checked })} />
                  {' '}Person with disability
                </label>
              </div>
              <div>
                <label>
                  <input type="checkbox" checked={Boolean(profile.isBPL)} onChange={(e) => setProfile({ ...profile, isBPL: e.target.checked })} />
                  {' '}Below Poverty Line (BPL) card holder
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary">Save Changes</button>
              <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', border: '1px solid #cbd5e0', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
