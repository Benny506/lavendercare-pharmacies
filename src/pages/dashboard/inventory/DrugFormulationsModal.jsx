import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Row, Col, Card, Badge, Image, InputGroup } from 'react-bootstrap';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import { FaPlus, FaTrash, FaUpload, FaTimes, FaEdit, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { updateDrugFormulations } from '../../../features/inventory/inventorySlice';
import { useUi } from '../../../context/uiContextBase';

const DrugFormulationsModal = ({ show, onHide, drug, onToggleVisibility }) => {
  const dispatch = useDispatch();
  const { startLoading, stopLoading, showAlert } = useUi();
  const [editMode, setEditMode] = useState(false);
  
  // Validation Schema
  const validationSchema = Yup.object({
    formulations: Yup.array().of(
      Yup.object().shape({
        strength: Yup.string().required('Strength is required'),
        form: Yup.string().required('Form is required'),
        selling_price: Yup.number().required('Selling price is required').positive('Price must be positive'),
        images: Yup.array()
          .min(1, 'At least 1 image is required')
          .max(4, 'Maximum 4 images allowed')
      })
    )
  });

  const formik = useFormik({
    initialValues: {
      formulations: drug?.drug_formulations?.map(f => ({
        id: f.id,
        strength: f.strength,
        form: f.form,
        selling_price: f.selling_price || '',
        images: f.drug_formulation_images || [], // Existing images
        is_visible: f.is_visible !== false // Default to true if undefined
      })) || []
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      startLoading();
      try {
        await dispatch(updateDrugFormulations({
          drugId: drug.id,
          formulations: values.formulations
        })).unwrap();
        showAlert('success', 'Formulations updated successfully');
        setEditMode(false);
        // onHide(); // Keep modal open or close? User said "toggle edit mode", implies staying in modal.
      } catch (error) {
        console.error(error);
        showAlert('error', error.message || 'Failed to update formulations');
      } finally {
        stopLoading();
      }
    }
  });

  const handleImageUpload = (e, index, push) => {
    const files = Array.from(e.target.files);
    const currentImages = formik.values.formulations[index].images;
    
    if (currentImages.length + files.length > 4) {
      showAlert('error', 'Maximum 4 images allowed per formulation');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', `File ${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    // Add valid files to Formik state
    // We need to mix existing images (objects) and new files (File objects)
    const newImages = [...currentImages, ...validFiles];
    formik.setFieldValue(`formulations.${index}.images`, newImages);
  };

  const removeImage = (formulationIndex, imageIndex) => {
    const currentImages = [...formik.values.formulations[formulationIndex].images];
    currentImages.splice(imageIndex, 1);
    formik.setFieldValue(`formulations.${formulationIndex}.images`, currentImages);
  };

  const getPreviewUrl = (fileOrUrl) => {
    if (fileOrUrl instanceof File) {
      return URL.createObjectURL(fileOrUrl);
    }
    return fileOrUrl.image_url || fileOrUrl; // Handle DB object or string URL
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex justify-content-between align-items-center w-100 pe-3">
          <span>Formulations: {drug?.name}</span>
          {!editMode && (
            <Button variant="outline-primary" size="sm" onClick={() => setEditMode(true)}>
              <FaEdit className="me-2" /> Edit Formulations
            </Button>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-light">
        <FormikProvider value={formik}>
          <Form onSubmit={formik.handleSubmit}>
            <FieldArray name="formulations">
              {({ push, remove }) => (
                <Row>
                  {formik.values.formulations.map((formulation, index) => (
                    <Col md={12} key={index} className="mb-3">
                      <Card className="shadow-sm border-0">
                        <Card.Body>
                          <div className="d-flex justify-content-between mb-3 align-items-center">
                            <h6 className="fw-bold text-primary mb-0">
                              Formulation #{index + 1}
                              {!formulation.is_visible && (
                                <Badge bg="secondary" className="ms-2">Hidden</Badge>
                              )}
                            </h6>
                            <div className="d-flex gap-2">
                              {formulation.id && (
                                <Button
                                  variant={formulation.is_visible ? "outline-secondary" : "outline-success"}
                                  size="sm"
                                  onClick={() => onToggleVisibility && onToggleVisibility(formulation)}
                                  title={formulation.is_visible ? "Hide Formulation" : "Show Formulation"}
                                >
                                  {formulation.is_visible ? <FaEyeSlash /> : <FaEye />}
                                  <span className="ms-1 d-none d-md-inline">
                                    {formulation.is_visible ? "Hide" : "Show"}
                                  </span>
                                </Button>
                              )}
                              {editMode && (
                                <Button 
                                  variant="outline-danger" 
                                  size="sm" 
                                  onClick={() => remove(index)}
                                  disabled={formik.values.formulations.length === 1} 
                                >
                                  <FaTrash /> Remove
                                </Button>
                              )}
                            </div>
                          </div>

                          <Row className="g-3">
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Strength</Form.Label>
                                <Form.Control
                                  type="text"
                                  disabled={!editMode}
                                  {...formik.getFieldProps(`formulations.${index}.strength`)}
                                  isInvalid={
                                    formik.touched.formulations?.[index]?.strength && 
                                    formik.errors.formulations?.[index]?.strength
                                  }
                                />
                                <Form.Control.Feedback type="invalid">
                                  {formik.errors.formulations?.[index]?.strength}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group>
                                <Form.Label>Form</Form.Label>
                                <Form.Control
                                  type="text"
                                  disabled={!editMode}
                                  {...formik.getFieldProps(`formulations.${index}.form`)}
                                  isInvalid={
                                    formik.touched.formulations?.[index]?.form && 
                                    formik.errors.formulations?.[index]?.form
                                  }
                                />
                                <Form.Control.Feedback type="invalid">
                                  {formik.errors.formulations?.[index]?.form}
                                </Form.Control.Feedback>
                              </Form.Group>
                            </Col>
                            <Col md={12}>
                                <Form.Group>
                                    <Form.Label>Selling Price</Form.Label>
                                    <InputGroup>
                                        <InputGroup.Text>NGN</InputGroup.Text>
                                        <Form.Control
                                            type="number"
                                            disabled={!editMode}
                                            {...formik.getFieldProps(`formulations.${index}.selling_price`)}
                                            isInvalid={formik.touched.formulations?.[index]?.selling_price && formik.errors.formulations?.[index]?.selling_price}
                                        />
                                    </InputGroup>
                                    <Form.Control.Feedback type="invalid">
                                        {formik.errors.formulations?.[index]?.selling_price}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            
                            {/* Images Section */}
                            <Col md={12}>
                              <Form.Label>Images (Min 1, Max 4) {editMode && <span className="text-danger">*</span>}</Form.Label>
                              <div className="d-flex flex-wrap gap-3 align-items-start">
                                {/* Image Previews */}
                                {formulation.images && formulation.images.map((img, imgIndex) => (
                                  <div key={imgIndex} className="position-relative">
                                    <Image 
                                      src={getPreviewUrl(img)} 
                                      thumbnail 
                                      style={{ width: '100px', height: '100px', objectFit: 'cover' }} 
                                    />
                                    {editMode && (
                                      <Button
                                        variant="danger"
                                        size="sm"
                                        className="position-absolute top-0 end-0 p-0 d-flex align-items-center justify-content-center rounded-circle"
                                        style={{ width: '20px', height: '20px', transform: 'translate(30%, -30%)' }}
                                        onClick={() => removeImage(index, imgIndex)}
                                      >
                                        <FaTimes size={10} />
                                      </Button>
                                    )}
                                  </div>
                                ))}

                                {/* Add Image Button */}
                                {editMode && formulation.images.length < 4 && (
                                  <div 
                                    className="border rounded d-flex align-items-center justify-content-center bg-white"
                                    style={{ width: '100px', height: '100px', cursor: 'pointer', borderStyle: 'dashed' }}
                                  >
                                    <label className="w-100 h-100 d-flex flex-column align-items-center justify-content-center cursor-pointer mb-0">
                                      <FaUpload className="text-muted mb-1" />
                                      <small className="text-muted" style={{ fontSize: '10px' }}>Upload</small>
                                      <input 
                                        type="file" 
                                        className="d-none" 
                                        accept="image/*" 
                                        multiple 
                                        onChange={(e) => handleImageUpload(e, index)}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                              {formik.touched.formulations?.[index]?.images && typeof formik.errors.formulations?.[index]?.images === 'string' && (
                                <div className="text-danger small mt-1">
                                  {formik.errors.formulations?.[index]?.images}
                                </div>
                              )}
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}

                  {editMode && (
                    <Col md={12}>
                      <Button 
                        variant="outline-primary" 
                        className="w-100 border-dashed" 
                        onClick={() => push({ strength: '', form: '', images: [], selling_price: '' })}
                      >
                        <FaPlus /> Add Another Formulation
                      </Button>
                    </Col>
                  )}
                </Row>
              )}
            </FieldArray>

            {editMode && (
                <div className="d-flex justify-content-end gap-2 mt-4 sticky-bottom bg-white p-3 border-top" style={{ zIndex: 10 }}>
                    <Button variant="secondary" onClick={() => {
                        formik.resetForm();
                        setEditMode(false);
                    }}>
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        style={{ backgroundColor: '#7B3FE4', border: 'none' }}
                        disabled={!formik.isValid || formik.isSubmitting}
                    >
                        Save Changes
                    </Button>
                </div>
            )}
          </Form>
        </FormikProvider>
      </Modal.Body>
    </Modal>
  );
};

export default DrugFormulationsModal;
