import React, { useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginHandler } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Required'),
      password: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      await loginHandler(values.email, values.password);
    },
  });

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #ede9fe, #f5f5f9)', minWidth: '100vw' }}>
      <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <img src="/logo.svg" alt="Logo" style={{ width: '60px', height: '60px', marginBottom: '16px' }} />
            <h4 className="fw-bold text-primary">LavenderCare Pharmacy</h4>
            <p className="text-muted small">Sign in to manage your inventory</p>
          </div>

          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3" controlId="email">
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

            <Form.Group className="mb-4" controlId="password">
              <div className="d-flex justify-content-between align-items-center">
                <Form.Label className="small text-muted fw-bold mb-0">Password</Form.Label>
                <Link to="/auth/forgot-password" style={{ fontSize: '12px', textDecoration: 'none' }}>Forgot password?</Link>
              </div>
              <div className="input-group mt-2">
                <span className="input-group-text bg-light border-end-0"><FaLock className="text-muted" /></span>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
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

            <Button variant="primary" type="submit" className="w-100 py-2 fw-bold shadow-sm" style={{ background: '#7b3fe4', border: 'none' }}>
              Sign In
            </Button>
          </Form>

          <div className="text-center mt-4">
            <p className="small text-muted mb-0">
              Don't have an account? <Link to="/auth/register" className="fw-bold text-primary text-decoration-none">Register Pharmacy</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
