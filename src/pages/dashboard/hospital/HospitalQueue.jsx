import React, { useEffect, useState } from 'react';
import { Card, Button, Spinner, Badge, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserInjured, FaStethoscope, FaCalendarDay, FaArrowRight } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';
import { useUi } from '../../../context/uiContextBase';

export default function HospitalQueue() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { showSubtleLoader, hideSubtleLoader } = useUi();

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    showSubtleLoader('Fetching hospital queue...');
    setError(null);
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id,
          created_at,
          status,
          patients ( first_name, last_name, date_of_birth, gender ),
          prescriptions!inner ( id, status )
        `)
        .in('prescriptions.status', ['pending'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      setVisits(data || []);
    } catch (err) {
      console.error('Error fetching hospital queue:', err);
      setError('Failed to fetch the hospital queue.');
    } finally {
      setLoading(false);
      hideSubtleLoader();
    }
  };

  const getAge = (date_of_birth) => {
    if (!date_of_birth) return 'N/A';
    const diff = Date.now() - new Date(date_of_birth).getTime();
    const age = new Date(diff).getUTCFullYear() - 1970;
    return age;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-end mb-4">
        <Button variant="primary" className="rounded-pill px-4 shadow-sm" onClick={fetchQueue}>
          Refresh Queue
        </Button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" className="text-primary mb-3" />
          <p className="text-muted">Loading queue...</p>
        </div>
      ) : visits.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-4 shadow-sm border-0 mt-2">
          <div className="text-muted mb-3"><FaUserInjured size={48} opacity={0.5} /></div>
          <h5 className="fw-bold">Queue is empty</h5>
          <p className="text-muted">No patients are currently waiting for pharmacy.</p>
        </div>
      ) : (
        <Row className="g-3">
          {visits.map((visit) => {
            const patient = visit.patients;
            return (
              <Col xs={12} md={6} xl={4} key={visit.id}>
                <Card className="h-100 border shadow-sm" style={{ transition: 'all 0.2s', borderColor: 'rgba(0,0,0,0.08)' }}>
                  <Card.Body className="d-flex flex-column gap-3 p-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-flex align-items-center justify-content-center">
                        <FaUserInjured size={24} />
                      </div>
                      <div>
                        <h6 className="mb-1 fw-bold text-dark fs-5">{patient?.first_name} {patient?.last_name}</h6>
                        <div className="text-muted small">
                          {getAge(patient?.date_of_birth)} yrs • {patient?.gender}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-3 border-top d-flex justify-content-end">
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/dashboard/hospital-queue/fulfill?visit_id=${visit.id}`)}
                        className="rounded-pill px-4 fw-medium"
                      >
                        Fulfill <FaArrowRight className="ms-2" size={12} />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
