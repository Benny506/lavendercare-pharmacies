import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useDispatch, useSelector } from 'react-redux';
import { setSession, setUser, setProfile, setIsLoading, clearUserProfile } from '../features/userProfile/userProfileSlice';
import { useUi } from './uiContextBase';
import { useNavigate } from 'react-router-dom';
import { loadInventoryData } from '../utils/dataLoader';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { startLoading, stopLoading, showAlert } = useUi();
  const { session, user } = useSelector((state) => state.userProfile);

  // Helper to fetch all authorized pharmacies
  const fetchAuthorizedPharmacies = useCallback(async (userId) => {
    try {
      let authorizedEntities = [];

      // 1. Check direct ownership
      const { data: directEntities } = await supabase
        .from('business_entities')
        .select('id, hospital_id')
        .eq('user_id', userId)
        .eq('entity_type', 'pharmacy');
      
      if (directEntities) {
        authorizedEntities = [...directEntities];
      }

      // 2. Check hospital affiliation
      const { data: hospitalProfile } = await supabase
        .from('hospital_profiles')
        .select('hospital_id, role')
        .eq('id', userId)
        .single();

      if (hospitalProfile && ['hospital_admin', 'pharmacist'].includes(hospitalProfile.role)) {
        const { data: hospitalEntities } = await supabase
          .from('business_entities')
          .select('id, hospital_id')
          .eq('hospital_id', hospitalProfile.hospital_id)
          .eq('entity_type', 'pharmacy');
        
        if (hospitalEntities) {
          // Add to authorized if not already there
          hospitalEntities.forEach(he => {
            if (!authorizedEntities.find(e => e.id === he.id)) {
              authorizedEntities.push(he);
            }
          });
        }
      }

      if (authorizedEntities.length === 0) {
        throw new Error('No pharmacy business entity found for this user.');
      }

      // 3. Get pharmacy profiles for all authorized entities
      const entityIds = authorizedEntities.map(e => e.id);
      const { data: profiles, error: profileError } = await supabase
        .from('pharmacy_profile')
        .select('*')
        .in('business_entity_id', entityIds);

      if (profileError) throw profileError;

      return profiles || [];
    } catch (error) {
      console.error('Error fetching authorized pharmacies:', error);
      throw error;
    }
  }, []);

  // Login Handler
  const loginHandler = async (email, password) => {
    startLoading();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session && data.user) {
        dispatch(setSession(data.session));
        dispatch(setUser(data.user));

        // Fetch authorized pharmacies
        const profiles = await fetchAuthorizedPharmacies(data.user.id);
        
        stopLoading();
        return { ok: true, profiles };
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clean up if data loading fails
      await supabase.auth.signOut();
      dispatch(clearUserProfile());
      showAlert('error', error.message || 'Login failed.');
      stopLoading();
      return { ok: false, error: error.message };
    }
  };

  // Complete Login
  const completeLogin = async (profile) => {
    startLoading();
    try {
      dispatch(setProfile(profile));
      localStorage.setItem('selectedPharmacyId', profile.business_entity_id);
      
      // Fetch inventory data globally
      await loadInventoryData(profile.id, dispatch);
      
      showAlert('success', 'Login successful!');
      navigate('/dashboard/profile', { replace: true });
    } catch (error) {
      console.error('Error completing login:', error);
      showAlert('error', 'Failed to initialize pharmacy profile.');
    } finally {
      stopLoading();
    }
  };

  // Logout Handler
  const logoutHandler = async () => {
    startLoading();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('selectedPharmacyId');
      dispatch(clearUserProfile());
      navigate('/auth/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      showAlert('error', 'Failed to logout.');
    } finally {
      stopLoading();
    }
  };

  // Sync session state on mount (handled by AutoLogin component mainly, but good to have listener)
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        dispatch(setSession(session));
        dispatch(setUser(session.user));
      } else if (event === 'SIGNED_OUT') {
        dispatch(clearUserProfile());
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [dispatch]);

  const value = {
    loginHandler,
    logoutHandler,
    fetchAuthorizedPharmacies,
    completeLogin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
