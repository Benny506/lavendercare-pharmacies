import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Spinner, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserInjured, FaStethoscope, FaCalendarDay, FaArrowRight } from 'react-icons/fa';
import { supabase } from '../../../lib/supabaseClient';

export default function HospitalQueue() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0 text-primary fw-bold" style={{ fontFamily: 'Sora' }}>Hospital Queue</h2>
        <Button variant="outline-primary" onClick={fetchQueue} disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
        </Button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0 px-4 py-3 text-muted">Patient</th>
                <th className="border-0 py-3 text-muted">Vitals/Info</th>
                <th className="border-0 text-end px-4 py-3 text-muted">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    <Spinner animation="border" size="sm" className="text-primary me-2" />
                    <span className="text-muted small">Loading queue...</span>
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-5">
                    <div className="text-muted mb-3"><FaUserInjured size={40} /></div>
                    <h5>Queue is empty</h5>
                    <p className="text-muted">No patients are currently waiting for pharmacy.</p>
                  </td>
                </tr>
              ) : (
                visits.map((visit) => {
                  const patient = visit.patients;
                  
                  return (
                    <tr key={visit.id}>
                      <td className="px-4 py-3">
                        <div className="fw-bold text-dark">{patient?.first_name} {patient?.last_name}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-muted small">
                          {getAge(patient?.date_of_birth)} yrs • {patient?.gender}
                        </div>
                      </td>
                      <td className="text-end px-4 py-3">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/dashboard/hospital-queue/fulfill?visit_id=${visit.id}`)}
                          className="rounded-pill px-3"
                        >
                          Fulfill <FaArrowRight className="ms-1" size={12} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
