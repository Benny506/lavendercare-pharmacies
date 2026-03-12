import React, { useEffect, useState } from 'react';
import { Modal, Card, Spinner, Image, Row, Col } from 'react-bootstrap';
import { supabase } from '../../../lib/supabaseClient';
import ConfirmModal from '../../../components/common/ConfirmModal';
ConfirmModal

const OrderDetailsModal = ({ order, show, onHide }) => {
  const [stockMovements, setStockMovements] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStockMovements = async () => {
      if (!order) return;
      setLoading(true);
      const movements = {};
      for (const item of order.order_items) {
        const { data, error } = await supabase
          .from('pharmacy_stock_movements')
          .select('*, batch:inventory_batches(batch_number, expiry_date)')
          .eq('pharmacy_order_item_id', item.id);
        if (error) console.error('Error fetching stock movements:', error);
        else movements[item.id] = data;
      }
      setStockMovements(movements);
      setLoading(false);
    };

    if (show) {
      fetchStockMovements();
    }
  }, [order, show]);

  if (!order) return null;

  const renderItem = (item) => {
    const snapshot = item.item_snapshot || {};
    const drugInfo = snapshot.drugInfo || {};
    const formulationInfo = snapshot.drugFormulationInfo || {};
    const imageUrl = formulationInfo.images?.[0]?.image_url;

    return (
      <Card key={item.id} className="mb-3 item-detail-card">
        <Card.Body>
          <Row className='wrap g-3'>
            <Col lg={2} className="text-center">
              <Image 
                src={imageUrl || 'https://via.placeholder.com/150'} 
                rounded 
                className="item-image" 
              />
            </Col>
            <Col lg={10}>
              <h5 className="item-name">{drugInfo.name || 'N/A'}</h5>
              <p className="item-generic-name text-muted">{drugInfo.generic_name || 'N/A'}</p>
              <p className="item-formulation">{`${formulationInfo.strength || 'N/A'} - ${formulationInfo.form || 'N/A'}`}</p>
              <hr />
              <Row>
                <Col><strong>Quantity:</strong> {item.quantity || 'N/A'}</Col>
                <Col><strong>Total Price:</strong> ₦{item.total_price?.toLocaleString() || 'N/A'}</Col>
              </Row>
              <div className="mt-3">
                <h6>Stock Movements:</h6>
                {loading ? <Spinner animation="border" size="sm" /> : (
                  stockMovements[item.id] && stockMovements[item.id].length > 0 ? (
                    stockMovements[item.id].map((move, index) => (
                      <div key={index} className="stock-movement-detail">
                        <p>Deducted: {move.quantity_deducted} from Batch #{move.batch?.batch_number || 'N/A'} (Expires: {move.batch?.expiry_date ? new Date(move.batch.expiry_date).toLocaleDateString() : 'N/A'})</p>
                      </div>
                    ))
                  ) : <p className="text-muted">No stock movements recorded.</p>
                )}
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Order #{order.platform_order?.order_number || 'N/A'}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="item-details-modal-body">
        {order.order_items.map(renderItem)}
      </Modal.Body>
    </Modal>
  );
};

export default OrderDetailsModal;
