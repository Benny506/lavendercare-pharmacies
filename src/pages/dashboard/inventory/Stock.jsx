import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Table, Badge, InputGroup, Image } from 'react-bootstrap';
import { FaPlus, FaSearch, FaFilter, FaBoxes, FaExclamationTriangle, FaCheckCircle, FaCalendarTimes, FaHistory, FaEdit, FaPills } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { addBatch, updateBatch } from '../../../features/inventory/inventorySlice';
import { useUi } from '../../../context/uiContextBase';

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Calculate status based on expiry and quantity
const getBatchStatus = (batch) => {
  const today = new Date();
  const expiry = new Date(batch.expiry_date);
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  if (batch.quantity_remaining <= 0) return { label: 'Out of Stock', variant: 'secondary', icon: <FaBoxes /> };
  if (expiry < today) return { label: 'Expired', variant: 'danger', icon: <FaCalendarTimes /> };
  if (expiry < threeMonthsFromNow) return { label: 'Expiring Soon', variant: 'warning', icon: <FaExclamationTriangle /> };
  if (batch.quantity_remaining < 10) return { label: 'Low Stock', variant: 'warning', icon: <FaBoxes /> };
  return { label: 'In Stock', variant: 'success', icon: <FaCheckCircle /> };
};

const Stock = () => {
  const dispatch = useDispatch();
  const { batches, drugs, suppliers, batchesLoaded, drugsLoaded, suppliersLoaded } = useSelector((state) => state.inventory);
  const { profile } = useSelector((state) => state.userProfile);
  const { startLoading, stopLoading, showAlert } = useUi();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const validationSchema = Yup.object({
    drug_id: Yup.string().required('Drug is required'),
    formulation_id: Yup.string().required('Formulation is required'),
    batch_number: Yup.string().required('Batch Number is required'),
    expiry_date: Yup.date().required('Expiry Date is required').min(new Date(), 'Expiry date must be in the future'),
    quantity: Yup.number().required('Quantity is required').positive('Must be positive').integer('Must be an integer'),
    unit_cost: Yup.number().required('Unit Cost is required').positive('Must be positive'),
    supplier_id: Yup.string().required('Supplier is required'),
  });

  const handleSaveBatch = async (values, { resetForm }) => {
    startLoading();
    try {
      if (editMode && selectedBatch) {
        // Update Batch
        const updateData = {
          drug_formulation_id: values.formulation_id,
          batch_number: values.batch_number,
          expiry_date: values.expiry_date,
          quantity: values.quantity, // Will be ignored by backend for updates
          unit_price: values.unit_cost,
          supplier_id: values.supplier_id
        };

        await dispatch(updateBatch({
          id: selectedBatch.id,
          batch: updateData
        })).unwrap();

        showAlert('success', 'Batch updated successfully');
      } else {
        // Add Batch
        const batchData = {
          pharmacy_id: profile.id,
          drug_formulation_id: values.formulation_id,
          batch_number: values.batch_number,
          expiry_date: values.expiry_date,
          quantity: values.quantity, // Initial quantity
          unit_price: values.unit_cost,
          supplier_id: values.supplier_id
        };

        const movementData = {
          quantity: values.quantity,
          reason: 'Initial Stock In'
        };

        await dispatch(addBatch({
          pharmacyId: profile.id,
          batch: batchData,
          movement: movementData
        })).unwrap();

        showAlert('success', 'Batch added successfully');
      }

      setShowAddModal(false);
      resetForm();
      setEditMode(false);
      setSelectedBatch(null);
    } catch (error) {
      console.error(error);
      showAlert('error', error || 'Failed to save batch');
    } finally {
      stopLoading();
    }
  };

  const handleEdit = (batch) => {
    setSelectedBatch(batch);
    setEditMode(true);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditMode(false);
    setSelectedBatch(null);
  };

  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      const drugName = batch.drug_formulations?.drugs?.name?.toLowerCase() || '';
      const genericName = batch.drug_formulations?.drugs?.generic_name?.toLowerCase() || '';
      const batchNum = batch.batch_number?.toLowerCase() || '';
      const matchesSearch = drugName.includes(searchTerm.toLowerCase()) ||
        genericName.includes(searchTerm.toLowerCase()) ||
        batchNum.includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const status = getBatchStatus(batch);
      if (filterStatus === 'all') return true;
      if (filterStatus === 'expired') return status.label === 'Expired';
      if (filterStatus === 'expiring') return status.label === 'Expiring Soon';
      if (filterStatus === 'low') return status.label === 'Low Stock';
      if (filterStatus === 'out') return status.label === 'Out of Stock';

      return true;
    });
  }, [batches, searchTerm, filterStatus]);

  // Derived state for drug selection in modal
  const getFormulationsForDrug = (drugId, allDrugs) => {
    const drug = allDrugs.find(d => d.id === drugId);
    return drug ? drug.drug_formulations : [];
  };

  return (
    <Container fluid className="p-lg-0 p-md-0 p-0" style={{ backgroundColor: '#f8f9fa' }}>
      <div style={{ overflowX: 'hidden' }} className="d-flex justify-content-end align-items-center mb-4">
        <Button
          variant="primary"
          className="d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
          style={{ backgroundColor: '#7B3FE4', border: 'none', borderRadius: '8px' }}
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus /> Stock In
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm mb-4" style={{ overflowX: 'hidden', borderRadius: '12px' }}>
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0 text-muted">
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search by drug name, generic name, or batch #..."
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="all">All Statuses</option>
                <option value="expired">Expired</option>
                <option value="expiring">Expiring Soon</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </Form.Select>
            </Col>
            <Col className="text-end text-muted small">
              Showing {filteredBatches.length} batches
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Batches Table */}
      <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
        <div style={{ }}>
          <Table
            responsive
            hover
            className="mb-0"
            style={{
            }}
          >
            <thead className="bg-light text-muted small text-uppercase">
              <tr>
                <th className="ps-4 py-3 border-0" style={{ minWidth: '120px' }}>Image</th>
                <th className="py-3 border-0" style={{ minWidth: '250px' }}>Drug Details</th>
                <th className="py-3 border-0" style={{ minWidth: '200px' }}>Batch Info</th>
                <th className="py-3 border-0" style={{ minWidth: '130px' }}>Stock</th>
                <th className="py-3 border-0" style={{ minWidth: '170px' }}>Expiry</th>
                <th className="py-3 border-0" style={{ minWidth: '170px' }}>Status</th>
                <th className="pe-4 py-3 border-0 text-end" style={{ minWidth: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const drug = batch.drug_formulations?.drugs;
                  const formulation = batch.drug_formulations;
                  const status = getBatchStatus(batch);
                  // Use first image if available, otherwise placeholder
                  const firstImage = formulation?.images?.[0]?.image_url;

                  return (
                    <tr key={batch.id}>
                      <td className="py-3">
                        <div
                          className="rounded bg-light d-flex align-items-center justify-content-center overflow-hidden border"
                          style={{ width: '50px', height: '50px' }}
                        >
                          {firstImage ? (
                            <Image src={firstImage} width={50} height={50} style={{ objectFit: 'cover' }} />
                          ) : (
                            <FaPills className="text-secondary opacity-50" size={20} />
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="fw-bold text-dark text-break">{drug?.name}</div>
                        <div className="small text-muted text-break">{drug?.generic_name}</div>
                        <div className="small text-primary">{formulation?.strength} {formulation?.form}</div>
                      </td>
                      <td className="py-3">
                        <div className="font-monospace small bg-light d-inline-block px-2 py-1 rounded">
                          {batch.batch_number}
                        </div>
                        <div className="small text-muted mt-1 text-truncate" style={{ maxWidth: '150px' }}>
                          {batch.suppliers?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="fw-bold fs-5">{batch.quantity_remaining}</div>
                        <div className="small text-muted">Cost: ${batch.unit_price}</div>
                      </td>
                      <td className="py-3">
                        <div>{formatDate(batch.expiry_date)}</div>
                      </td>
                      <td className="py-3">
                        <Badge bg={status.variant} className="d-inline-flex align-items-center gap-1 px-2 py-1 fw-normal">
                          {status.icon} <span className="d-none d-lg-inline">{status.label}</span>
                        </Badge>
                      </td>
                      <td className="pe-4 py-3 text-end">
                        <Button
                          variant="link"
                          className="p-0 text-primary me-3"
                          onClick={() => handleEdit(batch)}
                        >
                          <FaEdit size={16} title="Edit Batch" />
                        </Button>
                        <Button variant="link" className="p-0 text-secondary">
                          <FaHistory size={16} title="View Movement History" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    <FaBoxes size={40} className="mb-3 opacity-50" />
                    <p className="mb-0">No batches found matching your criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Batch Modal */}
      <Modal show={showAddModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold">{editMode ? 'Edit Stock Batch' : 'Add New Stock Batch'}</Modal.Title>
        </Modal.Header>
        <Formik
          initialValues={{
            drug_id: editMode && selectedBatch ? selectedBatch.drug_formulations.drug_id : '',
            formulation_id: editMode && selectedBatch ? selectedBatch.drug_formulation_id : '',
            batch_number: editMode && selectedBatch ? selectedBatch.batch_number : '',
            expiry_date: editMode && selectedBatch ? selectedBatch.expiry_date : '',
            quantity: editMode && selectedBatch ? selectedBatch.quantity_remaining : '',
            unit_cost: editMode && selectedBatch ? selectedBatch.unit_price : '',
            supplier_id: editMode && selectedBatch ? selectedBatch.supplier_id : ''
          }}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSaveBatch}
        >
          {({ handleSubmit, handleChange, values, touched, errors, setFieldValue }) => {
            const formulations = values.drug_id ? getFormulationsForDrug(values.drug_id, drugs) : [];

            return (
              <Form onSubmit={handleSubmit}>
                <Modal.Body className="p-4">
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Select Drug</Form.Label>
                        <Form.Select
                          name="drug_id"
                          value={values.drug_id}
                          onChange={(e) => {
                            handleChange(e);
                            setFieldValue('formulation_id', '');
                          }}
                          isInvalid={touched.drug_id && !!errors.drug_id}
                          disabled={editMode} // Disable drug selection in edit mode
                        >
                          <option value="">Choose a drug...</option>
                          {drugs.map(drug => (
                            <option key={drug.id} value={drug.id}>{drug.name} ({drug.generic_name})</option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.drug_id}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Select Formulation</Form.Label>
                        <Form.Select
                          name="formulation_id"
                          value={values.formulation_id}
                          onChange={handleChange}
                          isInvalid={touched.formulation_id && !!errors.formulation_id}
                          disabled={!values.drug_id || editMode} // Disable formulation in edit mode
                        >
                          <option value="">Choose formulation...</option>
                          {formulations.map(f => (
                            <option key={f.id} value={f.id}>{f.strength} - {f.form}</option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.formulation_id}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Batch Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="batch_number"
                          value={values.batch_number}
                          onChange={handleChange}
                          isInvalid={touched.batch_number && !!errors.batch_number}
                          placeholder="e.g. BATCH-001"
                        />
                        <Form.Control.Feedback type="invalid">{errors.batch_number}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Supplier</Form.Label>
                        <Form.Select
                          name="supplier_id"
                          value={values.supplier_id}
                          onChange={handleChange}
                          isInvalid={touched.supplier_id && !!errors.supplier_id}
                        >
                          <option value="">Choose supplier...</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.supplier_id}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Quantity {editMode && <span className="text-muted small">(Read-only)</span>}</Form.Label>
                        <Form.Control
                          type="number"
                          name="quantity"
                          value={values.quantity}
                          onChange={handleChange}
                          isInvalid={touched.quantity && !!errors.quantity}
                          min="1"
                          disabled={editMode} // Disable quantity in edit mode
                        />
                        <Form.Control.Feedback type="invalid">{errors.quantity}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Unit Cost ($)</Form.Label>
                        <Form.Control
                          type="number"
                          step="0.01"
                          name="unit_cost"
                          value={values.unit_cost}
                          onChange={handleChange}
                          isInvalid={touched.unit_cost && !!errors.unit_cost}
                          min="0"
                        />
                        <Form.Control.Feedback type="invalid">{errors.unit_cost}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Expiry Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="expiry_date"
                          value={values.expiry_date}
                          onChange={handleChange}
                          isInvalid={touched.expiry_date && !!errors.expiry_date}
                        />
                        <Form.Control.Feedback type="invalid">{errors.expiry_date}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                  <Button variant="light" onClick={handleCloseModal}>Cancel</Button>
                  <Button
                    type="submit"
                    style={{ backgroundColor: '#7B3FE4', border: 'none' }}
                  >
                    {editMode ? 'Update Batch' : 'Confirm Stock In'}
                  </Button>
                </Modal.Footer>
              </Form>
            );
          }}
        </Formik>
      </Modal>
    </Container >
  );
};

export default Stock;