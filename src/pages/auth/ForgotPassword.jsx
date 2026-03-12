import React from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { useUi } from '../../context/uiContextBase';
import { supabase } from '../../lib/supabaseClient';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { showAlert, startLoading, stopLoading } = useUi();

  const formik = useFormik({
    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Required'),
    }),
    onSubmit: async (values) => {
      startLoading();
      try {
        const { data: userExists, error } = await supabase.rpc('user_exists', { email_input: values.email });
        
        if (error) throw error;

        if (userExists) {
            showAlert('success', 'User found! Sending OTP...');
            navigate('/auth/verify-otp', { state: { resetEmail: values.email } });
        } else {
            showAlert('error', 'User with this email does not exist.');
        }

      } catch (error) {
        console.error(error);
        showAlert('error', 'Failed to verify email. Please try again.');
      } finally {
        stopLoading();
      }
    },
  });

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #ede9fe, #f5f5f9)', minWidth: '100vw' }}>
      <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <h4 className="fw-bold text-primary">Forgot Password?</h4>
            <p className="text-muted small">Enter your email to receive an OTP</p>
          </div>

          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-4" controlId="email">
              <Form.Label className="small text-muted fw-bold">Email Address</Form.Label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0"><FaEnvelope className="text-muted" /></span>
                <Form.Control
                  type="email"
                  placeholder="name@pharmacy.com"
                  className="border-start-0 ps-0"
                  {...formik.getFieldProps('email')}
                  isInvalid={formik.touched.email && formik.errors.email}
                />
                <Form.Control.Feedback type="invalid">{formik.errors.email}</Form.Control.Feedback>
              </div>
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100 py-2 fw-bold shadow-sm" style={{ background: '#7b3fe4', border: 'none' }}>
              Send OTP
            </Button>
          </Form>

          <div className="text-center mt-4">
            <Link to="/auth/login" className="text-decoration-none text-muted small">
              <FaArrowLeft className="me-1" /> Back to Login
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ForgotPassword;
