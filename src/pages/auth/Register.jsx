import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, ProgressBar } from 'react-bootstrap';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { FaBuilding, FaUserMd, FaMapMarkerAlt, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { useUi } from '../../context/uiContextBase';
import { supabase } from '../../lib/supabaseClient';

const Register = () => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { showAlert, startLoading, stopLoading } = useUi();

  const totalSteps = 3;

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['pharmacyName', 'licenseNumber', 'email', 'phone'];
    } else if (step === 2) {
      fieldsToValidate = ['address', 'city', 'state', 'zipCode'];
    }

    const errors = await formik.validateForm();
    const touched = {};
    let hasError = false;

    fieldsToValidate.forEach(field => {
      touched[field] = true;
      if (errors[field]) {
        hasError = true;
      }
    });

    formik.setTouched({ ...formik.touched, ...touched });

    if (!hasError) {
      setStep(step + 1);
    }
  };
  const prevStep = () => setStep(step - 1);

  const validationSchema = Yup.object({
    pharmacyName: Yup.string().required('Pharmacy Name is required'),
    licenseNumber: Yup.string().required('License Number is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    phone: Yup.string().required('Phone Number is required'),
    address: Yup.string().required('Address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required'),
    zipCode: Yup.string().required('Zip Code is required'),
    ownerName: Yup.string().required('Owner Name is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required'),
  });

  const formik = useFormik({
    initialValues: {
      pharmacyName: '',
      licenseNumber: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      ownerName: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      startLoading();
      try {
        const { data, error } = await supabase.rpc("user_exists", { email_input: values.email })

        // console.log(data)

        // throw new Error()

        if(error){
          console.log(error)
          throw new Error()
        }

        if(data){
          stopLoading()
          showAlert('error', 'Email already in use.');

          return;
        }

        navigate('/auth/verify-otp', { state: { registerInfo: values } });

      } catch (error) {
        console.log(error)
        showAlert('error', 'Registration failed. Please try again.');
      
      } finally {
        stopLoading();
      }
    },
  });

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h5 className="mb-3 text-primary"><FaBuilding className="me-2" />Pharmacy Details</h5>
            <Form.Group className="mb-3">
              <Form.Label>Pharmacy Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter pharmacy name"
                {...formik.getFieldProps('pharmacyName')}
                isInvalid={formik.touched.pharmacyName && formik.errors.pharmacyName}
              />
              <Form.Control.Feedback type="invalid">{formik.errors.pharmacyName}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>License Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter license number"
                {...formik.getFieldProps('licenseNumber')}
                isInvalid={formik.touched.licenseNumber && formik.errors.licenseNumber}
              />
              <Form.Control.Feedback type="invalid">{formik.errors.licenseNumber}</Form.Control.Feedback>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    {...formik.getFieldProps('email')}
                    isInvalid={formik.touched.email && formik.errors.email}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.email}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter phone number"
                    {...formik.getFieldProps('phone')}
                    isInvalid={formik.touched.phone && formik.errors.phone}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.phone}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </>
        );
      case 2:
        return (
          <>
            <h5 className="mb-3 text-primary"><FaMapMarkerAlt className="me-2" />Location</h5>
            <Form.Group className="mb-3">
              <Form.Label>Street Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter street address"
                {...formik.getFieldProps('address')}
                isInvalid={formik.touched.address && formik.errors.address}
              />
              <Form.Control.Feedback type="invalid">{formik.errors.address}</Form.Control.Feedback>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter city"
                    {...formik.getFieldProps('city')}
                    isInvalid={formik.touched.city && formik.errors.city}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.city}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>State</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="State"
                    {...formik.getFieldProps('state')}
                    isInvalid={formik.touched.state && formik.errors.state}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.state}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Zip Code</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Zip"
                    {...formik.getFieldProps('zipCode')}
                    isInvalid={formik.touched.zipCode && formik.errors.zipCode}
                  />
                  <Form.Control.Feedback type="invalid">{formik.errors.zipCode}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </>
        );
      case 3:
        return (
          <>
            <h5 className="mb-3 text-primary"><FaUserMd className="me-2" />Account Setup</h5>
            <Form.Group className="mb-3">
              <Form.Label>Owner's Full Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter owner's name"
                {...formik.getFieldProps('ownerName')}
                isInvalid={formik.touched.ownerName && formik.errors.ownerName}
              />
              <Form.Control.Feedback type="invalid">{formik.errors.ownerName}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <div className="input-group">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  {...formik.getFieldProps('password')}
                  isInvalid={formik.touched.password && formik.errors.password}
                />
                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
                <Form.Control.Feedback type="invalid">{formik.errors.password}</Form.Control.Feedback>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <div className="input-group">
                <Form.Control
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  {...formik.getFieldProps('confirmPassword')}
                  isInvalid={formik.touched.confirmPassword && formik.errors.confirmPassword}
                />
                <Button variant="outline-secondary" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
                <Form.Control.Feedback type="invalid">{formik.errors.confirmPassword}</Form.Control.Feedback>
              </div>
            </Form.Group>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, #ede9fe, #f5f5f9)', minWidth: '100vw' }}>
      <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '600px', borderRadius: '16px' }}>
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <img src="/logo.svg" alt="Logo" style={{ width: '50px', height: '50px', marginBottom: '12px' }} />
            <h3 className="fw-bold text-primary">Register Pharmacy</h3>
            <p className="text-muted">Join LavenderCare Network</p>
          </div>

          <div className="mb-4">
            <ProgressBar now={(step / totalSteps) * 100} variant="primary" style={{ height: '6px' }} />
            <div className="d-flex justify-content-between mt-2 small text-muted">
              <span>Basic Info</span>
              <span>Location</span>
              <span>Account</span>
            </div>
          </div>

          <Form onSubmit={formik.handleSubmit}>
            {renderStepContent()}

            <div className="d-flex justify-content-between mt-4">
              {step > 1 ? (
                <Button variant="outline-secondary" onClick={prevStep}>
                  <FaArrowLeft className="me-2" /> Back
                </Button>
              ) : (
                <div></div> // Spacer
              )}
              
              {step < totalSteps ? (
                <Button variant="primary" onClick={nextStep} style={{ background: '#7b3fe4', border: 'none' }}>
                  Next <FaArrowRight className="ms-2" />
                </Button>
              ) : (
                <Button variant="success" type="submit" className="fw-bold">
                  Complete Registration
                </Button>
              )}
            </div>
          </Form>

          <div className="text-center mt-4 border-top pt-3">
            <p className="small text-muted mb-0">
              Already have an account? <Link to="/auth/login" className="fw-bold text-primary text-decoration-none">Sign In</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;
