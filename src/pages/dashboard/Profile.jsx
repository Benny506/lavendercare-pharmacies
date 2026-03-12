import React, { useState, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Image } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaUserMd, FaBuilding, FaPhone, FaMapMarkerAlt, FaEnvelope, FaEdit, FaSave, FaTimes, FaCamera } from 'react-icons/fa';
import { useUi } from '../../context/uiContextBase';
import { supabase } from '../../lib/supabaseClient';
import { setProfile } from '../../features/userProfile/userProfileSlice';
import { uploadAsset, getPublicImageUrl } from '../../lib/requestApi';

const Profile = () => {
  const { profile, user } = useSelector((state) => state.userProfile);
  const dispatch = useDispatch();
  const { showAlert, startLoading, stopLoading } = useUi();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const getInitials = (name) => {
    if (!name) return '??';
    const words = name.trim().split(/\s+/);
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    if (name.length > 1) {
      return name.substring(0, 2).toUpperCase();
    }
    return (name[0] + name[0]).toUpperCase();
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 4MB)
    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      showAlert('error', 'File size exceeds 4MB limit.');
      return;
    }

    startLoading();
    try {
      const { filePath, error: uploadError } = await uploadAsset({
        file,
        id: profile.id,
        bucket_name: 'user_profiles',
        ext: file.name.split('.').pop()
      });

      if (uploadError) throw new Error(uploadError);

      const { data, error: updateError } = await supabase
        .from('pharmacy_profile')
        .update({
          profile_img: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (updateError) throw updateError;

      dispatch(setProfile(data));
      showAlert('success', 'Profile image updated!');
    } catch (error) {
      console.error('Image upload error:', error);
      showAlert('error', 'Failed to update profile image.');
    } finally {
      stopLoading();
    }
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      pharmacy_name: profile?.pharmacy_name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      zip_code: profile?.zip_code || '',
      owner_name: profile?.owner_name || '',
      license_number: profile?.license_number || '',
    },
    validationSchema: Yup.object({
      pharmacy_name: Yup.string().required('Required'),
      phone: Yup.string().required('Required'),
      address: Yup.string().required('Required'),
      city: Yup.string().required('Required'),
      state: Yup.string().required('Required'),
      zip_code: Yup.string().required('Required'),
      owner_name: Yup.string().required('Required'),
      license_number: Yup.string().required('Required'),
    }),
    onSubmit: async (values) => {
      startLoading();
      try {
        const { data, error } = await supabase
          .from('pharmacy_profile')
          .update({
            pharmacy_name: values.pharmacy_name,
            phone: values.phone,
            address: values.address,
            city: values.city,
            state: values.state,
            zip_code: values.zip_code,
            owner_name: values.owner_name,
            license_number: values.license_number,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;

        dispatch(setProfile(data));
        showAlert('success', 'Profile updated successfully!');
        setIsEditing(false);
      } catch (error) {
        console.error('Update error:', error);
        showAlert('error', 'Failed to update profile.');
      } finally {
        stopLoading();
      }
    },
  });

  if (!profile) return <div className="text-center py-5">Loading profile...</div>;

  return (
    <Container fluid className="px-0">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {/* Header removed as per request */}
            </div>
            {!isEditing ? (
              <Button 
                variant="primary" 
                onClick={() => setIsEditing(true)}
                className="d-flex align-items-center gap-2 shadow-sm"
                style={{ backgroundColor: '#7B3FE4', border: 'none' }}
              >
                <FaEdit /> Edit Profile
              </Button>
            ) : (
              <div className="d-flex gap-2">
                <Button variant="light" onClick={() => setIsEditing(false)} className="d-flex align-items-center gap-2 border">
                  <FaTimes /> Cancel
                </Button>
                <Button 
                  variant="success" 
                  onClick={formik.handleSubmit} 
                  className="d-flex align-items-center gap-2 text-white"
                  style={{ backgroundColor: '#2ecc71', border: 'none' }}
                >
                  <FaSave /> Save Changes
                </Button>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Main Info Card */}
        <Col md={8}>
          <Card className="shadow-sm border-0 h-100 rounded-4 overflow-hidden">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-primary">
                <FaBuilding /> Pharmacy Details
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">Pharmacy Name</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          type="text"
                          {...formik.getFieldProps('pharmacy_name')}
                          isInvalid={formik.touched.pharmacy_name && formik.errors.pharmacy_name}
                        />
                      ) : (
                        <div className="fs-5 fw-medium text-dark">{profile.pharmacy_name}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">License Number</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          type="text"
                          {...formik.getFieldProps('license_number')}
                          isInvalid={formik.touched.license_number && formik.errors.license_number}
                        />
                      ) : (
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-5 fw-medium text-dark">{profile.license_number}</span>
                          <Badge bg="success" pill className="small">Active</Badge>
                        </div>
                      )}
                    </Form.Group>
                  </Col>

                  <Col md={12}><hr className="my-2 text-muted opacity-25" /></Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">Phone Number</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          type="text"
                          {...formik.getFieldProps('phone')}
                          isInvalid={formik.touched.phone && formik.errors.phone}
                        />
                      ) : (
                        <div className="d-flex align-items-center gap-2 text-dark">
                          <FaPhone className="text-muted" size={14} />
                          {profile.phone}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">Email Address</Form.Label>
                      <div className="d-flex align-items-center gap-2 text-dark">
                        <FaEnvelope className="text-muted" size={14} />
                        {profile.email} {/* Email is usually not editable here or requires separate flow */}
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={12}><hr className="my-2 text-muted opacity-25" /></Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">Address</Form.Label>
                      {isEditing ? (
                        <Form.Control
                          type="text"
                          {...formik.getFieldProps('address')}
                          isInvalid={formik.touched.address && formik.errors.address}
                          className="mb-2"
                        />
                      ) : (
                        <div className="d-flex align-items-start gap-2 text-dark mb-1">
                          <FaMapMarkerAlt className="text-muted mt-1" size={14} />
                          {profile.address}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">City</Form.Label>
                      {isEditing ? (
                         <Form.Control
                          type="text"
                          {...formik.getFieldProps('city')}
                          isInvalid={formik.touched.city && formik.errors.city}
                        />
                      ) : (
                        <div>{profile.city}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">State</Form.Label>
                      {isEditing ? (
                         <Form.Control
                          type="text"
                          {...formik.getFieldProps('state')}
                          isInvalid={formik.touched.state && formik.errors.state}
                        />
                      ) : (
                        <div>{profile.state}</div>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small text-muted fw-bold">Zip Code</Form.Label>
                      {isEditing ? (
                         <Form.Control
                          type="text"
                          {...formik.getFieldProps('zip_code')}
                          isInvalid={formik.touched.zip_code && formik.errors.zip_code}
                        />
                      ) : (
                        <div>{profile.zip_code}</div>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Owner/Account Info Card */}
        <Col md={4}>
          <Card className="shadow-sm border-0 h-100 rounded-4 overflow-hidden">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2 text-secondary">
                <FaUserMd /> Account Owner
              </h5>
            </Card.Header>
            <Card.Body className="p-4 d-flex flex-column align-items-center text-center">
              <div className="position-relative mb-4">
                <div 
                  className="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary fw-bold shadow-sm overflow-hidden" 
                  style={{ width: '120px', height: '120px', fontSize: '2.5rem', border: '4px solid #fff' }}
                >
                  {profile.profile_img ? (
                    <Image 
                      src={getPublicImageUrl({ path: profile.profile_img, bucket_name: 'user_profiles' })} 
                      className="w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    getInitials(profile.pharmacy_name)
                  )}
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="position-absolute bottom-0 end-0 rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: '36px', height: '36px', backgroundColor: '#7B3FE4', border: 'none' }}
                  onClick={() => fileInputRef.current.click()}
                >
                  <FaCamera size={16} />
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="d-none" 
                />
              </div>
              
              <Form.Group className="w-100 mb-3">
                <Form.Label className="small text-muted fw-bold">Owner Name</Form.Label>
                {isEditing ? (
                  <Form.Control
                    type="text"
                    className="text-center"
                    {...formik.getFieldProps('owner_name')}
                    isInvalid={formik.touched.owner_name && formik.errors.owner_name}
                  />
                ) : (
                  <h5 className="fw-bold mb-0">{profile.owner_name}</h5>
                )}
              </Form.Group>

              <div className="mt-auto w-100 pt-3 border-top">
                <small className="text-muted d-block mb-2">Account Status</small>
                <Badge bg="success" className="px-3 py-2 rounded-pill">Active & Verified</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
