import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useUi } from '../../context/uiContextBase';

const AutoLoginGate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startLoading, stopLoading } = useUi();
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    if (isBootstrapped) return;

    const bootstrapAuth = async () => {
      startLoading();
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const access_token = urlParams.get('access_token');
        const refresh_token = urlParams.get('refresh_token');
        const pharmacyId = urlParams.get('pharmacy_id');
        const iframeMode = urlParams.get('iframe');

        // 1. Rehydrate Session if tokens are passed
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          // Clear tokens from URL
          window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }

        // 2. Persist Target & Iframe State
        if (iframeMode === 'true') {
          sessionStorage.setItem('isIframeMode', 'true');
        }
        if (pharmacyId) {
          sessionStorage.setItem('targetPharmacyId', pharmacyId);
        }

        // 3. Prevent routing to restricted auth screens in Iframe mode
        const isIframe = sessionStorage.getItem('isIframeMode') === 'true';
        const restrictedAuthRoutes = ['/auth/register', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-otp'];
        
        if (isIframe && restrictedAuthRoutes.includes(location.pathname)) {
          navigate('/auth/login', { replace: true });
        }

      } catch (error) {
        console.error("AutoLoginGate bootstrap error:", error);
      } finally {
        setIsBootstrapped(true);
        stopLoading();
      }
    };

    bootstrapAuth();
  }, [navigate, location.pathname, isBootstrapped, startLoading, stopLoading]);

  return null;
};

export default AutoLoginGate;
