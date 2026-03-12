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

  // Helper to fetch profile data
  const fetchProfile = useCallback(async (userId) => {
    try {
      // 1. Get business entity ID for this user
      const { data: businessEntity, error: beError } = await supabase
        .from('business_entities')
        .select('id, entity_type')
        .eq('user_id', userId)
        .eq('entity_type', 'pharmacy')
        .single();

      if (beError) {
        console.log("beError", beError)
        throw beError
      };
      
      if (!businessEntity) throw new Error('No pharmacy business entity found for this user.');

      // 2. Get pharmacy profile using business entity ID
      const { data: profile, error: profileError } = await supabase
        .from('pharmacy_profile')
        .select('*')
        .eq('business_entity_id', businessEntity.id)
        .single();

      if (profileError) {
        console.log("profileError", profileError)
        throw profileError
      };

      dispatch(setProfile(profile));
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }, [dispatch]);

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

        // Fetch profile immediately after login
        const profile = await fetchProfile(data.user.id);
        
        // Fetch inventory data globally
        await loadInventoryData(profile.id, dispatch);
        
        showAlert('success', 'Login successful!');
        navigate('/dashboard/profile', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
      // Clean up if data loading fails
      await supabase.auth.signOut();
      dispatch(clearUserProfile());
      showAlert('error', error.message || 'Login failed.');
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
    fetchProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
