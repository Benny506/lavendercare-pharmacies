import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { useUi } from '../../context/uiContextBase';
import { supabase } from '../../lib/supabaseClient';

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { state } = useLocation();
  const { showAlert, startLoading, stopLoading } = useUi();

  const email = state?.email;
  const otp = state?.otp;

  useEffect(() => {
    if (!email || !otp) {
        showAlert('error', 'Invalid session. Please start again.');
        navigate('/auth/login', { replace: true });
    }
  }, [email, otp, navigate, showAlert]);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      password: Yup.string().min(8, 'Password must be at least 8 characters').required('Required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Required'),
    }),
    onSubmit: async (values) => {
      startLoading();
      try {
        const { data, error } = await supabase.rpc('reset_password_via_otp', {
            p_email: email,
            p_otp: otp,
            p_new_password: values.password
        });

        if (error) throw error;

        if (data) {
            showAlert('success', 'Password reset successfully! Please login.');
            navigate('/auth/login', { replace: true });
        } else {
            throw new Error('Failed to reset password.');
        }

      } catch (error) {
        console.error(error);
        showAlert('error', error.message || 'Failed to reset password. Please try again.');
      } finally {
        stopLoading();
      }
    },
  });

  if (!email || !otp) return null;

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #ede9fe, #f5f5f9)', minWidth: '100vw' }}>
      <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h4 className="fw-bold text-primary">Reset Password</h4>
            <p className="text-muted small">Create a new secure password</p>
          </div>

          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3" controlId="password">
              <Form.Label className="small text-muted fw-bold">New Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><FaLock className="text-muted" /></span>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="border-start-0 border-end-0 ps-0"
                  {...formik.getFieldProps('password')}
                  isInvalid={formik.touched.password && formik.errors.password}
                />
                <Button
                  variant="outline-secondary"
                  className="border-start-0 border-light bg-light"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </Button>
                <Form.Control.Feedback type="invalid">{formik.errors.password}</Form.Control.Feedback>
              </div>
            </Form.Group>

            <Form.Group className="mb-4" controlId="confirmPassword">
              <Form.Label className="small text-muted fw-bold">Confirm Password</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><FaLock className="text-muted" /></span>
                <Form.Control
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="border-start-0 border-end-0 ps-0"
                  {...formik.getFieldProps('confirmPassword')}
                  isInvalid={formik.touched.confirmPassword && formik.errors.confirmPassword}
                />
                <Button
                  variant="outline-secondary"
                  className="border-start-0 border-light bg-light"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </Button>
                <Form.Control.Feedback type="invalid">{formik.errors.confirmPassword}</Form.Control.Feedback>
              </div>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 py-2 fw-bold shadow-sm" style={{ background: '#7b3fe4', border: 'none' }}>
              Reset Password
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ResetPassword;
