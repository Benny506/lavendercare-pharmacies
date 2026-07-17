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
  const { showAlert, startLoading, stopLoading } = useUi();

  const { drugs } = useSelector(state => state.inventory);
  const { profile } = useSelector(state => state.userProfile);
  const [batches, setBatches] = useState([]);

  const [visit, setVisit] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingVisit, setLoadingVisit] = useState(true);

  // Mapping of prescription.id -> array of { batch_id, formulation_id, quantity, batchInfo }
  const [dispensedItems, setDispensedItems] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (visitId && profile?.id) {
      fetchVisitAndPrescriptions();
    }
  }, [visitId, profile?.id]);

  const fetchVisitAndPrescriptions = async () => {
    setLoadingVisit(true);
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
      setLoadingVisit(false);
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

  if (!visitId) return <div className="p-4">No visit selected.</div>;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-4">
        <Button variant="link" className="p-0 text-secondary me-3" onClick={() => navigate(-1)}>
          <FaArrowLeft size={20} />
        </Button>
        <h2 className="h4 mb-0 text-primary fw-bold" style={{ fontFamily: 'Sora' }}>Fulfill Prescriptions</h2>
      </div>

      {loadingVisit ? (
        <div className="text-center py-5"><Spinner animation="border" /></div>
      ) : (
        <>
          <Card className="shadow-sm border-0 mb-4 bg-primary text-white">
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
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0 align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-0 px-4 py-3">Prescription</th>
                        <th className="border-0 py-3" style={{ width: '350px' }}>Dispense From Inventory</th>
                        <th className="border-0 py-3 text-end pe-4">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted">No prescriptions found.</td>
                        </tr>
                      ) : (
                        prescriptions.map(p => {
                          const selectedItems = dispensedItems[p.id] || [];

                          return (
                            <tr key={p.id}>
                              <td className="px-4 py-3">
                                <div className="fw-bold">{p.medication_name}</div>
                                <div className="text-muted small mb-1">{p.dosage} • {p.frequency} • {p.duration}</div>
                                {p.instructions && <Badge bg="light" text="dark" className="fw-normal">{p.instructions}</Badge>}
                              </td>
                              <td className="py-3">
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
                                  className="d-flex gap-2"
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
                              </td>
                              <td className="py-3 text-end pe-4">
                                {selectedItems.length > 0 ? (
                                  <div className="fw-bold text-dark">
                                    ₦{selectedItems.reduce((acc, curr) => acc + (curr.quantity * (curr.batchInfo.unit_price || 0)), 0).toLocaleString()}
                                  </div>
                                ) : (
                                  <span className="text-muted small">-</span>
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </Table>
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

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-100 rounded-pill shadow-sm d-flex align-items-center justify-content-center gap-2"
                    onClick={handleFulfill}
                  >
                    <FaCheckCircle /> Complete
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      <ConfirmModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={() => executeFulfill([])}
        title="Complete without Fulfilling"
        message="You have not selected any medications to dispense. Are you sure you want to complete this prescription with 0 items? This will close the visit on your end."
        confirmText="Yes, Complete"
        cancelText="Cancel"
        variant="warning"
      />
    </div>
  );
}
