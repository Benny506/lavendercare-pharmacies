import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Table, Alert, Button } from 'react-bootstrap';
import { FaClock, FaBox, FaCheckCircle } from 'react-icons/fa';
import '../../../scss/_orders.scss';
import { useUi } from '../../../context/uiContextBase';
import { supabase } from '../../../lib/supabaseClient';
import { useSelector } from 'react-redux';
import OrderDetailsModal from './OrderDetailsModal';
import ConfirmModal from '../../../components/common/ConfirmModal';

const Orders = () => {
  const { startLoading, stopLoading, showAlert } = useUi();
  const { profile } = useSelector((state) => state.userProfile);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null });

  const fetchOrders = async () => {
    if (!profile) return;
    startLoading();
    try {
      const { data, error } = await supabase
        .from('pharmacy_orders')
        .select(`
          *,
          platform_order: pharmacy_platform_orders (*, user: user_profiles(name)),
          order_items: pharmacy_order_items (*)
        `)
        .eq('pharmacy_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      showAlert('error', 'Failed to fetch orders.');
    } finally {
      stopLoading();
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
      fetchOrders(); // Refresh orders
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

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const StatusCard = ({ icon, title, count, variant }) => (
    <Col md={4}>
      <Card className={`status-card status-card-${variant}`}>
        <Card.Body>
          <div className="d-flex align-items-center">
            <div className={`icon-wrapper icon-${variant}`}>{icon}</div>
            <div className="ms-3">
              <h5 className="card-title text-muted">{title}</h5>
              <p className="card-text fs-4 fw-bold">{count}</p>
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

      <Card className="orders-list-card">
        <Card.Header>All Orders</Card.Header>
        <Card.Body className="p-0">
          {orders.length === 0 ? (
            <Alert variant="info" className="m-3">No orders found for this pharmacy.</Alert>
          ) : (
            <Table responsive hover className="orders-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.platform_order.user.name}</td>
                    <td>₦{order.subtotal_amount.toLocaleString()}</td>
                    <td>
                      <Badge pill bg={order.platform_order.payment_status === 'paid' ? 'success-light' : 'warning-light'} 
                             className={order.platform_order.payment_status === 'paid' ? 'text-success' : 'text-warning'}>
                        {order.platform_order.payment_status}
                      </Badge>
                    </td>
                    <td>
                      <Badge pill bg={order.order_status === 'placed' ? 'primary-light' : 'secondary-light'} 
                             className={order.order_status === 'placed' ? 'text-primary' : 'text-secondary'}>
                        {order.order_status}
                      </Badge>
                    </td>
                    <td>
                      <Button variant="link" size="sm" onClick={() => handleViewDetails(order)}>View</Button>
                      {order.order_status === 'placed' && (
                        <Button variant="success" size="sm" onClick={() => setConfirmModal({ show: true, orderId: order.id })}>Mark as Picked</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
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
