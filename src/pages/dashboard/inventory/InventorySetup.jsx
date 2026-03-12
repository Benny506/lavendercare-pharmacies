import React, { useState } from 'react';
import { Container, Nav, Card } from 'react-bootstrap';
import { FaIndustry, FaTruck } from 'react-icons/fa';
import Manufacturers from './Manufacturers';
import Suppliers from './Suppliers';

const InventorySetup = () => {
  const [activeTab, setActiveTab] = useState('manufacturers');

  return (
    <Container fluid className="" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>      
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden" style={{ minHeight: '70vh' }}>
        <Card.Header className="bg-white border-bottom p-0">
          <Nav 
            variant="tabs" 
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="px-3 pt-3 border-bottom-0 gap-2 flex-nowrap overflow-auto"
          >
            <Nav.Item>
              <Nav.Link 
                eventKey="manufacturers" 
                className={`d-flex align-items-center gap-2 px-4 py-3 border-0 rounded-top-3 text-nowrap ${activeTab === 'manufacturers' ? 'fw-bold text-primary bg-light-primary' : 'text-muted'}`}
                style={activeTab === 'manufacturers' ? { borderBottom: '3px solid #7B3FE4', color: '#7B3FE4' } : {}}
              >
                <FaIndustry /> Manufacturers
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                eventKey="suppliers"
                className={`d-flex align-items-center gap-2 px-4 py-3 border-0 rounded-top-3 text-nowrap ${activeTab === 'suppliers' ? 'fw-bold text-primary bg-light-primary' : 'text-muted'}`}
                style={activeTab === 'suppliers' ? { borderBottom: '3px solid #7B3FE4', color: '#7B3FE4' } : {}}
              >
                <FaTruck /> Suppliers
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Header>
        <Card.Body className="">
          {activeTab === 'manufacturers' ? <Manufacturers /> : <Suppliers />}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default InventorySetup;
