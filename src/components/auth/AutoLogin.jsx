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

        // 1. Determine target pharmacy
        const targetPharmacyId = sessionStorage.getItem('targetPharmacyId') || localStorage.getItem('selectedPharmacyId');
        
        let businessEntity = null;

        if (targetPharmacyId) {
          // Iframe/Hospital Mode or Selected Standalone
          const { data: targetBe, error: targetBeError } = await supabase
            .from('business_entities')
            .select('*')
            .eq('id', targetPharmacyId)
            .single();

          if (targetBeError) throw targetBeError;

          if (targetBe.user_id === session.user.id) {
            // Direct ownership
            businessEntity = targetBe;
          } else if (targetBe.hospital_id) {
            // Check hospital affiliation
            const { data: hospitalProfile, error: hpError } = await supabase
              .from('hospital_profiles')
              .select('hospital_id, role')
              .eq('id', session.user.id)
              .single();

            if (!hpError && hospitalProfile && hospitalProfile.hospital_id === targetBe.hospital_id) {
              if (['hospital_admin', 'pharmacist'].includes(hospitalProfile.role)) {
                businessEntity = targetBe;
              }
            }
          }

          if (!businessEntity) {
            throw new Error('Unauthorized Access. You do not have permission to manage this pharmacy.');
          }
        } else {
          // Manual Login (Standalone mode)
          const { data: beData, error: beError } = await supabase
            .from('business_entities')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('entity_type', 'pharmacy')
            .single();

          if (beError || !beData) {
            throw new Error('No pharmacy business entity found for this user.');
          }
          businessEntity = beData;
        }

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
        if (location.pathname.startsWith('/auth') || location.pathname === '/') {
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
