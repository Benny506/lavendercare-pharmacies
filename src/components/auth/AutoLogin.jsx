import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../../lib/supabaseClient';
import { setSession, setUser, setProfile, setIsLoading, clearUserProfile } from '../../features/userProfile/userProfileSlice';
import { useUi } from '../../context/uiContextBase';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

import { loadInventoryData } from '../../utils/dataLoader';

const AutoLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading, showAlert } = useUi();
  const { user } = useSelector((state) => state.userProfile);

  useEffect(() => {
    const checkSession = async () => {
      startLoading();
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (!session) {
          // No session, redirect to login unless already there
          if (!location.pathname.startsWith('/auth')) {
            navigate('/auth/login', { replace: true });
          }
          return;
        }

        dispatch(setSession(session));
        dispatch(setUser(session.user));

        // Fetch profile
        // 1. Get business entity ID for this user
        const { data: businessEntity, error: beError } = await supabase
          .from('business_entities')
          .select('id, entity_type')
          .eq('user_id', session.user.id)
          .eq('entity_type', 'pharmacy')
          .single();

        if (beError) throw beError;
        if (!businessEntity) throw new Error('No pharmacy business entity found for this user.');

        // 2. Get pharmacy profile using business entity ID
        const { data: profile, error: profileError } = await supabase
          .from('pharmacy_profile')
          .select('*')
          .eq('business_entity_id', businessEntity.id)
          .single();

        if (profileError) throw profileError;

        dispatch(setProfile(profile));

        // Load inventory data globally
        await loadInventoryData(profile.id, dispatch);

        // If on login/register page and authenticated, redirect to dashboard
        if (location.pathname.startsWith('/auth')) {
             navigate('/dashboard/profile', { replace: true });
        }

      } catch (error) {
        console.error('AutoLogin error:', error);
        showAlert('error', error.message || 'Session expired or invalid. Please login again.');
        await supabase.auth.signOut();
        dispatch(clearUserProfile());
        navigate('/auth/login', { replace: true });
      } finally {
        stopLoading();
        dispatch(setIsLoading(false));
      }
    };

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally omitting location to run only on mount

  return <Outlet />;
};

export default AutoLogin;
