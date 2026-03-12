import React, { useState } from 'react';
import { Card, Button, Form, Modal, Row, Col, Badge } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { FaPlus, FaTrash, FaIndustry, FaPhone, FaMapMarkerAlt, FaSearch, FaEdit } from 'react-icons/fa';
import { useUi } from '../../../context/uiContextBase';
import { addManufacturer, deleteManufacturer, updateManufacturer } from '../../../features/inventory/inventorySlice';

const Manufacturers = () => {
  const { manufacturers, loading } = useSelector((state) => state.inventory);
  const { profile } = useSelector((state) => state.userProfile);
  const dispatch = useDispatch();
  const { showAlert, startLoading, stopLoading } = useUi();

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const formik = useFormik({
    initialValues: {
      name: '',
      contact_info: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Required'),
      contact_info: Yup.string().required('Required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      startLoading();
      try {
        if (editMode && selectedItem) {
          console.log(selectedItem)
          await dispatch(updateManufacturer({
            id: selectedItem.id,
            manufacturer: values
          })).unwrap();
          showAlert('success', 'Manufacturer updated successfully!');
        } else {
          await dispatch(addManufacturer({
            pharmacyId: profile.id,
            manufacturer: values
          })).unwrap();
          showAlert('success', 'Manufacturer added successfully!');
        }
        resetForm();
        setShowModal(false);
        setEditMode(false);
        setSelectedItem(null);
      } catch (error) {
        showAlert('error', error || 'Failed to save manufacturer');
      } finally {
        stopLoading();
      }
    },
  });

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditMode(true);
    formik.setValues({
      name: item.name,
      contact_info: item.contact_info,
    });
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedItem(null);
    formik.resetForm();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure? This action cannot be undone if drugs are linked.')) {
      startLoading();
      try {
        await dispatch(deleteManufacturer(id)).unwrap();
        showAlert('success', 'Manufacturer deleted');
      } catch (error) {
        showAlert('error', 'Cannot delete manufacturer. It may be in use.');
      } finally {
        stopLoading();
      }
    }
  };

  const filteredData = manufacturers.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="position-relative" style={{ minWidth: '300px' }}>
          <FaSearch className="position-absolute text-muted" style={{ top: '12px', left: '12px' }} />
          <Form.Control
            type="text"
            placeholder="Search manufacturers..."
            className="ps-5 rounded-pill border-0 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditMode(false);
            setSelectedItem(null);
            formik.resetForm();
            setShowModal(true);
          }}
          className="d-flex align-items-center gap-2 rounded-pill px-4 shadow-sm"
          style={{ backgroundColor: '#7B3FE4', border: 'none' }}
        >
          <FaPlus size={14} /> Add Manufacturer
        </Button>
      </div>

      {/* Content Grid */}
      {filteredData.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <FaIndustry size={48} className="mb-3 opacity-25" />
          <p>No manufacturers found. Add one to get started.</p>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredData.map((item) => (
            <Col key={item.id}>
              <Card className="h-100 border-0 shadow-sm rounded-4 hover-shadow transition-all">
                <Card.Body className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-primary" style={{ width: '48px', height: '48px' }}>
                        <FaIndustry size={20} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">{item.name}</h6>
                        <small className="text-muted">ID: {item.id.slice(0, 8)}</small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        className="text-primary rounded-circle p-2"
                        onClick={() => handleEdit(item)}
                      >
                        <FaEdit size={14} />
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        className="text-danger rounded-circle p-2"
                        onClick={() => handleDelete(item.id)}
                      >
                        <FaTrash size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-top">
                    <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                      <FaPhone size={12} />
                      <span>{item.contact_info}</span>
                    </div>
                    {/* Placeholder for future stats like "5 Drugs Linked" */}
                    <Badge bg="light" text="dark" className="fw-normal border">
                      Active Partner
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add Modal */}
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editMode ? 'Edit Manufacturer' : 'Add Manufacturer'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0 mt-3">
          <p className="text-muted small mb-4">{editMode ? 'Update details for this manufacturer.' : 'Enter details for the new pharmaceutical manufacturer.'}</p>
          <Form onSubmit={formik.handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Company Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Pfizer, GSK"
                {...formik.getFieldProps('name')}
                isInvalid={formik.touched.name && formik.errors.name}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid">{formik.errors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-muted">Contact Information</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Address, Phone, Email..."
                {...formik.getFieldProps('contact_info')}
                isInvalid={formik.touched.contact_info && formik.errors.contact_info}
                className="rounded-3"
              />
              <Form.Control.Feedback type="invalid">{formik.errors.contact_info}</Form.Control.Feedback>
            </Form.Group>
            <div className="d-grid">
              <Button
                type="submit"
                disabled={loading}
                className="rounded-pill py-2 fw-bold"
                style={{ backgroundColor: '#7B3FE4', border: 'none' }}
              >
                {loading ? 'Saving...' : (editMode ? 'Update Manufacturer' : 'Add Manufacturer')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <style>{`
        .hover-shadow:hover {
          transform: translateY(-2px);
          box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Manufacturers;
