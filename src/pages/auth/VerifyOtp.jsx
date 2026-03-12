import OtpPage from "../../components/auth/OtpPage"
import { useUi } from "../../context/uiContextBase"
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useEffect } from 'react'

export default function VerifyOtp() {

  const { state } = useLocation()
  const navigate = useNavigate()
  const registerInfo = state?.registerInfo || null
  const resetEmail = state?.resetEmail || null

  const { showAlert, startLoading, stopLoading } = useUi()

  useEffect(() => {
    if (!registerInfo && !resetEmail) {
      showAlert('error', 'Missing information. Please start over.')
      navigate('/auth/login', { replace: true })
    }
  }, [registerInfo, resetEmail, navigate, showAlert])

  if (!registerInfo && !resetEmail) return null;

  const handleVerify = async (otpValue) => {
    if (resetEmail) {
        // Reset Password Flow
        navigate('/auth/reset-password', { state: { email: resetEmail, otp: otpValue } })
        return;
    }

    // Registration Flow
    startLoading()
    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerInfo.email,
        password: registerInfo.password,
        options: {
          data: {
            full_name: registerInfo.ownerName,
            role: 'pharmacy_admin' // Assuming role or metadata needed
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create account. Please try again.')
      }

      // 2. Create Pharmacy Profile via RPC
      const { error: rpcError } = await supabase.rpc('register_pharmacy', {
        p_pharmacy_name: registerInfo.pharmacyName,
        p_license_number: registerInfo.licenseNumber,
        p_email: registerInfo.email,
        p_phone: registerInfo.phone,
        p_address: registerInfo.address,
        p_city: registerInfo.city,
        p_state: registerInfo.state,
        p_zip_code: registerInfo.zipCode,
        p_owner_name: registerInfo.ownerName
      })

      if (rpcError) {
        // If RPC fails, we might want to delete the auth user or handle it.
        // But for now, just throw.
        throw rpcError
      }

      showAlert('success', 'Account created successfully! Please login.')
      navigate('/auth/login', { replace: true })

    } catch (error) {
      console.error(error)
      showAlert("error", error.message || "Account registration error!")
    } finally {
      stopLoading()
    }
  }

  return (
    <OtpPage
      email={registerInfo?.email || resetEmail}
      onVerify={handleVerify}
      fromForgotPassword={resetEmail ? true : false}
    />
  )
}