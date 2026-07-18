import React, { useState } from 'react';
import { Form, Button, Card, Container, Modal } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaHospitalAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const navigate = useNavigate();
  const { loginHandler, completeLogin } = useAuth();

  const isIframe = window.self !== window.top;

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
      const result = await loginHandler(values.email, values.password);
      if (result && result.ok) {
        if (result.profiles.length === 1) {
          completeLogin(result.profiles[0]);
        } else if (result.profiles.length > 1) {
          setAvailableProfiles(result.profiles);
          setShowSelectionModal(true);
        }
      }
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
                {!isIframe && (
                  <Link to="/auth/forgot-password" style={{ fontSize: '12px', textDecoration: 'none' }}>Forgot password?</Link>
                )}
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

          {!isIframe && (
            <div className="text-center mt-4">
              <p className="small text-muted mb-0">
                Don't have an account? <Link to="/auth/register" className="fw-bold text-primary text-decoration-none">Register Pharmacy</Link>
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showSelectionModal} onHide={() => setShowSelectionModal(false)} centered backdrop="static">
        <Modal.Header>
          <Modal.Title className="fw-bold text-primary">Select Pharmacy</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-4">You have access to multiple pharmacies. Please select the one you want to manage.</p>
          <div className="d-flex flex-column gap-3">
            {availableProfiles.map(profile => {
              return (
                <Button
                  key={profile.id}
                  variant="outline-primary"
                  className="text-start p-3 d-flex align-items-center gap-3 border"
                  style={{ borderRadius: '12px' }}
                  onClick={() => {
                    setShowSelectionModal(false);
                    completeLogin(profile);
                  }}
                >
                  <div className="bg-light p-2 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <FaHospitalAlt className="text-primary" size={18} />
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">{profile.pharmacy_name}</h6>
                    <small className="text-muted">{profile.address}</small>
                  </div>
                </Button>
              )
            })}
          </div>
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default Login;
