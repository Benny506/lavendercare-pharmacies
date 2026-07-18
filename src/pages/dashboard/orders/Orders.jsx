import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Table, Alert, Button, Form, InputGroup } from 'react-bootstrap';
import { FaClock, FaBox, FaCheckCircle, FaSearch, FaFilter } from 'react-icons/fa';
import '../../../scss/_orders.scss';
import { useUi } from '../../../context/uiContextBase';
import { supabase } from '../../../lib/supabaseClient';
import { useSelector, useDispatch } from 'react-redux';
import { setOrders, updateOrderStatus } from '../../../features/orders/ordersSlice';
import OrderDetailsModal from './OrderDetailsModal';
import ConfirmModal from '../../../components/common/ConfirmModal';

const Orders = () => {
  const { startLoading, stopLoading, showAlert, showSubtleLoader, hideSubtleLoader } = useUi();
  const { profile } = useSelector((state) => state.userProfile);
  const { orders } = useSelector((state) => state.orders);
  const dispatch = useDispatch();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    if (!profile) return;
    showSubtleLoader('Fetching orders...');
    try {
      const { data, error } = await supabase
        .from('pharmacy_orders')
        .select(`
          *,
          platform_order: pharmacy_platform_orders (*, user: user_profiles(name), patient: patients(first_name, last_name)),
          order_items: pharmacy_order_items (*)
        `)
        .eq('pharmacy_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      dispatch(setOrders(data || []));
    } catch (error) {
      showAlert('error', 'Failed to fetch orders.');
    } finally {
      hideSubtleLoader();
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [profile]);

  const handleMarkAsPicked = async () => {
    if (!confirmModal.orderId) return;
    startLoading();
    try {
      const { error } = await supabase
        .from('pharmacy_orders')
        .update({ order_status: 'picked' })
        .eq('id', confirmModal.orderId);
      if (error) throw error;
      showAlert('success', 'Order marked as picked up.');
      dispatch(updateOrderStatus({ orderId: confirmModal.orderId, status: 'picked' }));
      fetchOrders(); // Sync in background
    } catch (error) {
      showAlert('error', 'Failed to update order status.');
    } finally {
      stopLoading();
      setConfirmModal({ show: false, orderId: null });
    }
  };

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, placed: 0, picked: 0 };
    orders.forEach(order => {
      if (order.platform_order.payment_status === 'pending') counts.pending++;
      else if (order.order_status === 'placed') counts.placed++;
      else if (order.order_status === 'picked') counts.picked++;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const customerName = (order.platform_order?.user?.name || 
                            (order.platform_order?.patient ? `${order.platform_order.patient.first_name} ${order.platform_order.patient.last_name}` : 'Unknown')).toLowerCase();
      const matchesSearch = customerName.includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        matchesStatus = order.order_status === statusFilter;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const StatusCard = ({ icon, title, count, variant }) => (
    <Col md={4}>
      <Card className={`status-card status-card-${variant} border-0 shadow-sm h-100`}>
        <Card.Body className="p-3">
          <div className="d-flex align-items-center">
            <div className={`icon-wrapper icon-${variant} p-2 rounded-circle`} style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>{icon}</div>
            <div className="ms-3">
              <div className="text-muted small fw-medium mb-1">{title}</div>
              <div className="fs-5 fw-bold">{count}</div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  return (
    <Container fluid className="orders-page">
      <Row className="mb-4">
        <StatusCard icon={<FaClock size={22} />} title="Pending Payment" count={statusCounts.pending} variant="warning" />
        <StatusCard icon={<FaBox size={22} />} title="Awaiting Pickup" count={statusCounts.placed} variant="primary" />
        <StatusCard icon={<FaCheckCircle size={22} />} title="Completed" count={statusCounts.picked} variant="success" />
      </Row>

      <Card className="orders-list-card border-0 shadow-sm">
        <Card.Header className="bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h6 className="mb-0 fw-bold">All Orders</h6>
          <div className="d-flex gap-2 flex-wrap">
            <InputGroup size="sm" style={{ width: '250px' }}>
              <InputGroup.Text className="bg-light border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
              <Form.Control 
                placeholder="Search by customer..." 
                className="bg-light border-start-0 ps-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <InputGroup size="sm" style={{ width: '180px' }}>
              <InputGroup.Text className="bg-light border-end-0"><FaFilter className="text-muted" /></InputGroup.Text>
              <Form.Select 
                className="bg-light border-start-0 ps-0 text-muted"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="placed">Awaiting Pickup</option>
                <option value="picked">Completed</option>
              </Form.Select>
            </InputGroup>
          </div>
        </Card.Header>
        <Card.Body>
          {filteredOrders.length === 0 ? (
            <Alert variant="info" className="m-0">No orders found matching your criteria.</Alert>
          ) : (
            <Row className="g-3">
              {filteredOrders.map(order => (
                <Col xs={12} md={6} xl={4} key={order.id}>
                  <Card 
                    className="h-100 border shadow-sm" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s', borderColor: 'rgba(0,0,0,0.08)' }} 
                    onClick={() => handleViewDetails(order)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Card.Body className="d-flex flex-column gap-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="text-muted small mb-1">Customer</div>
                          <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                            {order.platform_order?.user?.name || 
                             (order.platform_order?.patient ? `${order.platform_order.patient.first_name} ${order.platform_order.patient.last_name}` : 'Unknown')}
                          </div>
                        </div>
                        <Badge pill bg={order.order_status === 'placed' ? 'primary-light' : 'secondary-light'} 
                               className={order.order_status === 'placed' ? 'text-primary border border-primary' : 'text-secondary border border-secondary'}
                               style={{ backgroundColor: order.order_status === 'placed' ? 'rgba(13, 110, 253, 0.1)' : 'rgba(108, 117, 125, 0.1)' }}>
                          {order.order_status}
                        </Badge>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded mt-2">
                        <div>
                          <div className="text-muted small mb-1">Total Amount</div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>₦{order.subtotal_amount.toLocaleString()}</div>
                        </div>
                        <div className="text-end">
                          <div className="text-muted small mb-1">Payment Status</div>
                          <Badge pill bg={order.platform_order.payment_status === 'paid' ? 'success-light' : 'warning-light'} 
                                 className={order.platform_order.payment_status === 'paid' ? 'text-success border border-success' : 'text-warning border border-warning'}
                                 style={{ backgroundColor: order.platform_order.payment_status === 'paid' ? 'rgba(25, 135, 84, 0.1)' : 'rgba(255, 193, 7, 0.1)' }}>
                            {order.platform_order.payment_status}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                        <Button variant="link" size="sm" className="p-0 text-decoration-none fw-medium" onClick={(e) => { e.stopPropagation(); handleViewDetails(order); }}>View Details</Button>
                        {order.order_status === 'placed' && (
                          <Button variant="success" size="sm" className="fw-medium" onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, orderId: order.id }); }}>Mark as Picked</Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      <OrderDetailsModal 
        order={selectedOrder} 
        show={showModal} 
        onHide={() => setShowModal(false)} 
      />

      <ConfirmModal 
        show={confirmModal.show}
        onHide={() => setConfirmModal({ show: false, orderId: null })}
        onConfirm={handleMarkAsPicked}
        title="Confirm Pickup"
        message="Are you sure you want to mark this order as picked up? This action cannot be undone."
        variant="success"
      />
    </Container>
  );
};

export default Orders;
