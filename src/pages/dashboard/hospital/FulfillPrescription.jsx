import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Table, Form, Row, Col, Badge } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useUi } from '../../../context/uiContextBase';
import { FaCheckCircle, FaTimes, FaSearch, FaArrowLeft } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import ConfirmModal from '../../../components/common/ConfirmModal';

export default function FulfillPrescription() {
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visit_id');
  const navigate = useNavigate();
  const { showAlert, startLoading, stopLoading, showSubtleLoader, hideSubtleLoader } = useUi();

  const { drugs } = useSelector(state => state.inventory);
  const { profile } = useSelector(state => state.userProfile);
  const [batches, setBatches] = useState([]);

  const [visit, setVisit] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);

  // Mapping of prescription.id -> array of { batch_id, formulation_id, quantity, batchInfo }
  const [dispensedItems, setDispensedItems] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (visitId && profile?.id) {
      fetchVisitAndPrescriptions();
    }
  }, [visitId, profile?.id]);

  const fetchVisitAndPrescriptions = async () => {
    showSubtleLoader('Loading prescription details...');
    try {
      const { data: vData, error: vErr } = await supabase
        .from('visits')
        .select(`
          id, primary_payment_type,
          patients ( first_name, last_name ),
          patient_hmos:primary_patient_hmo_id (
            hospital_hmos ( drug_coverage_percentage )
          )
        `)
        .eq('id', visitId)
        .single();

      if (vErr) throw vErr;
      setVisit(vData);

      const { data: pData, error: pErr } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('visit_id', visitId);

      if (pErr) throw pErr;
      setPrescriptions(pData || []);

      const { data: bData, error: bErr } = await supabase
        .from('inventory_batches')
        .select(`
          *,
          drug_formulations (
            *,
            drugs (name, generic_name, manufacturers(name))
          ),
          suppliers (name)
        `)
        .eq('pharmacy_id', profile.id)
        .order('expiry_date', { ascending: true });

      if (bErr) throw bErr;
      setBatches(bData || []);

    } catch (error) {
      console.error(error);
      showAlert('error', 'Failed to load visit details or inventory');
    } finally {
      hideSubtleLoader();
    }
  };

  const handleSelectBatch = (prescriptionId, batchId, quantity) => {
    if (!batchId || !quantity) return;
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    setDispensedItems(prev => {
      const current = prev[prescriptionId] || [];
      return {
        ...prev,
        [prescriptionId]: [...current, {
          batch_id: batchId,
          formulation_id: batch.drug_formulation_id,
          quantity: parseInt(quantity),
          batchInfo: batch // for display and calculations
        }]
      };
    });
  };

  const handleRemoveDispensed = (prescriptionId, index) => {
    setDispensedItems(prev => {
      const current = prev[prescriptionId] || [];
      const updated = [...current];
      updated.splice(index, 1);
      return {
        ...prev,
        [prescriptionId]: updated
      };
    });
  };

  // Pricing Calculations
  let totalCost = 0;
  let hmoCoverage = 0;
  let outOfPocket = 0;

  const hmoPercentage = visit?.patient_hmos?.hospital_hmos?.drug_coverage_percentage || 0;
  const isHmoVisit = visit?.primary_payment_type === 'HMO';

  Object.values(dispensedItems).flat().forEach(item => {
    const itemTotal = (item.batchInfo.unit_price || 0) * item.quantity;
    totalCost += itemTotal;

    const isCovered = item.batchInfo?.drug_formulations?.is_hmo_covered;
    if (isHmoVisit && isCovered) {
      const coveredAmt = itemTotal * (hmoPercentage / 100);
      hmoCoverage += coveredAmt;
      outOfPocket += (itemTotal - coveredAmt);
    } else {
      outOfPocket += itemTotal;
    }
  });

  const handleFulfill = async () => {
    // Flatten dispensed items
    const payload = [];
    Object.keys(dispensedItems).forEach(pId => {
      dispensedItems[pId].forEach(item => {
        payload.push({
          prescription_id: pId,
          batch_id: item.batch_id,
          formulation_id: item.formulation_id,
          quantity: item.quantity
        });
      });
    });

    if (payload.length === 0) {
      setShowConfirm(true);
      return;
    }

    await executeFulfill(payload);
  };

  const executeFulfill = async (payload) => {
    setShowConfirm(false);
    startLoading();
    try {
      const { data, error } = await supabase.rpc('fulfill_hospital_prescription', {
        p_visit_id: visitId,
        p_pharmacy_id: profile?.id,
        p_dispensed_batches: payload
      });

      if (error) throw error;
      showAlert('success', 'Order fulfilled and billed atomically!');
      navigate('/dashboard/hospital-queue');
    } catch (error) {
      console.error(error);
      showAlert('error', error.message || 'Failed to fulfill prescription');
    } finally {
      stopLoading();
    }
  };

  const executeCancel = async () => {
    if (!cancellationReason.trim()) {
      showAlert('error', 'Please provide a cancellation reason.');
      return;
    }

    setShowConfirm(false);
    setShowCancelModal(false);
    startLoading();

    try {
      const { data, error } = await supabase.rpc('cancel_hospital_prescription_visit', {
        p_visit_id: visitId,
        p_pharmacy_id: profile?.id,
        p_reason: cancellationReason
      });

      if (error) throw error;
      showAlert('success', 'Prescription order cancelled successfully!');
      navigate('/dashboard/hospital-queue');
    } catch (error) {
      console.error(error);
      showAlert('error', error.message || 'Failed to cancel prescription');
    } finally {
      stopLoading();
    }
  };

  if (!visitId) return <div className="p-4">No visit selected.</div>;

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <Button variant="link" className="p-0 text-muted text-decoration-none d-inline-flex align-items-center" onClick={() => navigate('/dashboard/hospital-queue')}>
          <FaArrowLeft size={16} className="me-2" /> Back to Queue
        </Button>
      </div>

      {!visit && prescriptions.length === 0 ? null : (
        <>
          <Card className="shadow-sm border-0 mb-4 bg-primary text-white rounded-4">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p className="mb-1 text-white-50 small text-uppercase">Patient</p>
                  <h5 className="mb-0 fw-bold">{visit?.patients?.first_name} {visit?.patients?.last_name}</h5>
                </Col>
                <Col md={6} className="text-md-end mt-3 mt-md-0">
                  <p className="mb-1 text-white-50 small text-uppercase">Payment Type</p>
                  <Badge bg={isHmoVisit ? 'warning' : 'success'} className="fs-6">
                    {visit?.primary_payment_type}
                  </Badge>
                  {isHmoVisit && (
                    <div className="mt-1 small text-white-50">
                      Drug Coverage: {hmoPercentage}%
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Row>
            <Col lg={8}>
              <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-white py-3 border-bottom-0">
                  <h5 className="mb-0 fw-bold">Prescribed Items</h5>
                </Card.Header>
                <Card.Body className="p-3 bg-light">
                  {prescriptions.length === 0 ? (
                    <div className="text-center py-4 text-muted bg-white rounded border">No prescriptions found.</div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {prescriptions.map(p => {
                        const selectedItems = dispensedItems[p.id] || [];
                        const itemCost = selectedItems.reduce((acc, curr) => acc + (curr.quantity * (curr.batchInfo.unit_price || 0)), 0);

                        return (
                          <Card key={p.id} className="border-0 shadow-sm rounded-4">
                            <Card.Body className="p-4">
                              <Row className="gy-3">
                                <Col md={4}>
                                  <div className="fw-bold text-dark fs-5 mb-1">{p.medication_name}</div>
                                  <div className="text-muted small mb-2">{p.dosage} • {p.frequency} • {p.duration}</div>
                                  {p.notes && <Badge bg="light" text="dark" className="fw-normal">{p.notes}</Badge>}
                                </Col>
                                <Col md={5} className="border-start border-end px-4">
                                  <div className="mb-3 text-muted small fw-bold text-uppercase">Dispense From Inventory</div>
                                  {/* List already selected batches */}
                                  {selectedItems.map((item, idx) => {
                                    const isCovered = item.batchInfo?.drug_formulations?.is_hmo_covered;
                                    return (
                                      <div key={idx} className="d-flex align-items-center justify-content-between bg-light rounded p-2 mb-2 border border-success">
                                        <div>
                                          <div className="small fw-bold">
                                            {item.batchInfo?.drug_formulations?.drugs?.name}
                                            {isHmoVisit && (
                                              <Badge bg={isCovered ? "success" : "secondary"} className="ms-2" style={{ fontSize: '10px' }}>
                                                {isCovered ? 'HMO Covered' : 'Not Covered'}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="text-muted" style={{ fontSize: '11px' }}>Qty: {item.quantity} (Batch: {item.batchInfo?.batch_number})</div>
                                        </div>
                                        <Button variant="link" className="text-danger p-0 ms-2" onClick={() => handleRemoveDispensed(p.id, idx)}>
                                          <FaTimes />
                                        </Button>
                                      </div>
                                    );
                                  })}

                                  {/* Form to add a batch */}
                                  <Form
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      const form = e.target;
                                      handleSelectBatch(p.id, form.batchId.value, form.quantity.value);
                                      form.reset();
                                    }}
                                    className="d-flex flex-wrap gap-2 mt-2"
                                  >
                                    <Form.Select size="sm" name="batchId" required>
                                      <option value="">Select inventory batch...</option>
                                      {batches?.map(b => {
                                        const name = b.drug_formulations?.drugs?.name;
                                        const strength = b.drug_formulations?.strength;
                                        const price = b.unit_price;
                                        const isCovered = b.drug_formulations?.is_hmo_covered;
                                        const isNegative = b.quantity_remaining <= 0;
                                        return (
                                          <option key={b.id} value={b.id}>
                                            {isNegative ? '⚠️ ' : ''}{name} {strength} (₦{price}) {isHmoVisit ? (isCovered ? ' - [HMO Covered]' : ' - [Not Covered]') : ''} - Stock: {b.quantity_remaining} {isNegative ? '(Negative Stock)' : ''}
                                          </option>
                                        )
                                      })}
                                    </Form.Select>
                                    <Form.Control type="number" name="quantity" size="sm" style={{ width: '70px' }} placeholder="Qty" required min="1" />
                                    <Button type="submit" size="sm" variant="outline-primary">+</Button>
                                  </Form>
                                </Col>
                                <Col md={3} className="text-md-end d-flex flex-column justify-content-center">
                                  <div className="text-muted small text-uppercase mb-1">Item Cost</div>
                                  {selectedItems.length > 0 ? (
                                    <div className="fw-bold text-primary fs-5">
                                      ₦{itemCost.toLocaleString()}
                                    </div>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
                <Card.Header className="bg-white py-3 border-bottom-0">
                  <h5 className="mb-0 fw-bold">Billing Summary</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-3 text-muted">
                    <span>Total Cost:</span>
                    <span>₦{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {isHmoVisit && (
                    <div className="d-flex justify-content-between mb-3 text-success">
                      <span>HMO Coverage:</span>
                      <span>-₦{hmoCoverage.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <hr />
                  <div className="d-flex justify-content-between mb-4">
                    <span className="fw-bold fs-5">Patient Pays:</span>
                    <span className="fw-bold fs-5 text-primary">₦{outOfPocket.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="bg-light p-3 rounded text-muted small mb-3 border border-warning" style={{ borderLeftWidth: '4px !important', borderLeftColor: '#ffc107 !important' }}>
                    <strong><FaCheckCircle className="text-warning me-1" /> Payment Disclaimer:</strong><br />
                    Only click "Complete" after the patient has physically paid the full "Patient Pays" amount at the counter. If the amount is ₦0.00, you're good to go!
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      className="w-100 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                      onClick={() => setShowCancelModal(true)}
                    >
                      <FaTimes /> Cancel Order
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-100 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                      onClick={handleFulfill}
                    >
                      <FaCheckCircle /> Complete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <ConfirmModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={() => {
          setShowConfirm(false);
          setShowCancelModal(true);
        }}
        title="Complete without Fulfilling"
        message="You have not selected any medications to dispense. Are you sure you want to complete this prescription with 0 items? This will officially cancel the order."
        confirmText="Yes, Cancel Order"
        cancelText="Go Back"
        variant="warning"
      />

      {/* Cancel Modal with Reason */}
      <ConfirmModal
        show={showCancelModal}
        onHide={() => setShowCancelModal(false)}
        onConfirm={executeCancel}
        title="Cancel Prescription Order"
        message={
          <div>
            <p>Please provide a reason for cancelling this prescription order. This will cancel all pending items for this visit.</p>
            <Form.Group>
              <Form.Label className="small fw-bold text-danger">Cancellation Reason *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Medication out of stock, patient refused..."
              />
            </Form.Group>
          </div>
        }
        confirmText="Confirm Cancellation"
        cancelText="Back"
        variant="danger"
      />
    </div>
  );
}
