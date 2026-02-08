import { useState, useEffect } from 'react';
import { getUserProfile, getUserDocuments, getUserMedicines, getSchemesByState, getEligibilityCache, getDependencyMap } from '../services/firestoreService';
import { calculateEligibility, generateDependencyMap } from '../services/eligibilityEngine';

export const useEligibility = (userId) => {
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadData = async () => {
      try {
        const [userProfile, userDocs, userMeds] = await Promise.all([
          getUserProfile(userId),
          getUserDocuments(userId),
          getUserMedicines(userId)
        ]);

        setProfile(userProfile);
        setDocuments(userDocs);
        setMedicines(userMeds);

        if (userProfile?.state) {
          const stateSchemes = await getSchemesByState(userProfile.state);
          setSchemes(stateSchemes);

          // Calculate eligibility
          const eligibilityResult = calculateEligibility(userProfile, userDocs, userMeds, stateSchemes);
          setEligibility(eligibilityResult);

          // Generate dependency map
          const dependencyMap = generateDependencyMap(userProfile, userDocs, userMeds, stateSchemes, eligibilityResult.eligible);
          setDependencies(dependencyMap);
        }
      } catch (error) {
        console.error('Error loading eligibility data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const refresh = async () => {
    setLoading(true);
    const [userDocs, userMeds] = await Promise.all([
      getUserDocuments(userId),
      getUserMedicines(userId)
    ]);
    setDocuments(userDocs);
    setMedicines(userMeds);

    if (profile && schemes.length > 0) {
      const eligibilityResult = calculateEligibility(profile, userDocs, userMeds, schemes);
      setEligibility(eligibilityResult);
      const dependencyMap = generateDependencyMap(profile, userDocs, userMeds, schemes, eligibilityResult.eligible);
      setDependencies(dependencyMap);
    }
    setLoading(false);
  };

  return { profile, documents, medicines, schemes, eligibility, dependencies, loading, refresh };
};
