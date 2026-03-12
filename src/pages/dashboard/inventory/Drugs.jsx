import React, { useEffect, useState, useMemo } from 'react';
import { Container, Card, Button, Form, Modal, Row, Col, Table, Badge, Image, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import { FaPlus, FaSearch, FaPills, FaEdit, FaArrowRight, FaArrowLeft, FaTimes, FaUpload, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useUi } from '../../../context/uiContextBase';
import { addDrug, updateDrugDetails, toggleFormulationVisibility } from '../../../features/inventory/inventorySlice';
import DrugFormulationsModal from './DrugFormulationsModal';
import ConfirmModal from '../../../components/common/ConfirmModal';

const Drugs = () => {
  const { drugs, manufacturers } = useSelector((state) => state.inventory);
  const { profile } = useSelector((state) => state.userProfile);
  const dispatch = useDispatch();
  const { showAlert, startLoading, stopLoading } = useUi();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditDrugModal, setShowEditDrugModal] = useState(false);
  const [showFormulationsModal, setShowFormulationsModal] = useState(false);
  
  // Confirm Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmTitle, setConfirmTitle] = useState('');

  const [selectedDrug, setSelectedDrug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState(1);

  // --- Add Drug Logic (Wizard) ---
  const addDrugFormik = useFormik({
    initialValues: {
      name: '',
      generic_name: '',
      description: '',
      manufacturer_id: '',
      formulations: [{ strength: '', form: '', images: [], selling_price: '' }],
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Drug Name is required'),
      generic_name: Yup.string(),
      description: Yup.string(),
      manufacturer_id: Yup.string().required('Manufacturer is required'),
      formulations: Yup.array().of(
        Yup.object().shape({
          strength: Yup.string().required('Strength is required'),
          form: Yup.string().required('Form is required'),
          images: Yup.array().min(1, 'At least 1 image is required').max(4, 'Max 4 images'),
          selling_price: Yup.number().required('Selling price is required').positive('Price must be positive')
        })
      ).min(1, 'At least one formulation is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      startLoading();
      try {
        const { formulations, ...drugData } = values;
        await dispatch(addDrug({ 
          pharmacyId: profile.id, 
          drug: drugData,
          formulations: formulations
        })).unwrap();
        showAlert('success', 'Drug added successfully!');
        resetForm();
        setShowAddModal(false);
        setStep(1);
      } catch (error) {
        console.error('Save drug error:', error);
        showAlert('error', error.message || 'Failed to save drug');
      } finally {
        stopLoading();
      }
    },
  });

  // --- Edit Drug Details Logic ---
  const editDrugFormik = useFormik({
    initialValues: {
      name: '',
      generic_name: '',
      description: '',
      manufacturer_id: ''
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Drug Name is required'),
      generic_name: Yup.string(),
      description: Yup.string(),
      manufacturer_id: Yup.string().required('Manufacturer is required'),
    }),
    onSubmit: async (values) => {
      if (!selectedDrug) return;
      startLoading();
      try {
        await dispatch(updateDrugDetails({ 
          id: selectedDrug.id,
          drug: values
        })).unwrap();
        showAlert('success', 'Drug details updated');
        setShowEditDrugModal(false);
      } catch (error) {
        showAlert('error', error.message || 'Failed to update drug');
      } finally {
        stopLoading();
      }
    }
  });

  const handleOpenEditDrug = (drug) => {
    setSelectedDrug(drug);
    editDrugFormik.setValues({
      name: drug.name,
      generic_name: drug.generic_name || '',
      description: drug.description || '',
      manufacturer_id: drug.manufacturer_id
    });
    setShowEditDrugModal(true);
  };

  const handleOpenFormulations = (drug) => {
    setSelectedDrug(drug);
    setShowFormulationsModal(true);
  };

  const handleImageUpload = (e, index, setFieldValue, values) => {
    const files = Array.from(e.target.files);
    const currentImages = values.formulations[index].images;
    
    if (currentImages.length + files.length > 4) {
      showAlert('error', 'Max 4 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
        if (file.size > 5 * 1024 * 1024) {
            showAlert('error', `File ${file.name} is too large (max 5MB)`);
            return false;
        }
        return true;
    });

    setFieldValue(`formulations.${index}.images`, [...currentImages, ...validFiles]);
  };

  const handleToggleVisibility = (formulation) => {
    setConfirmTitle(formulation.is_visible ? 'Hide Formulation' : 'Show Formulation');
    setConfirmMessage(`Are you sure you want to ${formulation.is_visible ? 'hide' : 'show'} this formulation? It will ${formulation.is_visible ? 'no longer' : 'now'} be visible to other users.`);
    setConfirmAction(() => async () => {
      startLoading();
      try {
        await dispatch(toggleFormulationVisibility({ 
          id: formulation.id, 
          is_visible: !formulation.is_visible 
        })).unwrap();
        showAlert('success', `Formulation is now ${!formulation.is_visible ? 'visible' : 'hidden'}`);
        setShowConfirmModal(false);
      } catch (error) {
        showAlert('error', error.message || 'Failed to update visibility');
      } finally {
        stopLoading();
      }
    });
    setShowConfirmModal(true);
  };

  const filteredDrugs = useMemo(() => {
    return drugs.filter(drug => 
      drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drug.generic_name && drug.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [drugs, searchTerm]);

  return (
    <Container fluid className="" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <Button 
          variant="primary" 
          className="d-flex align-items-center gap-2 px-4 py-2 shadow-sm"
          style={{ backgroundColor: '#7B3FE4', border: 'none', borderRadius: '8px' }}
          onClick={() => {
              setStep(1);
              addDrugFormik.resetForm();
              setShowAddModal(true);
          }}
        >
          <FaPlus /> Add New Drug
        </Button>
      </div>

      <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
        <Card.Body className="p-3">
            <InputGroup className="mb-3">
                <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted"/></InputGroup.Text>
                <Form.Control 
                    placeholder="Search drugs..." 
                    className="border-start-0 ps-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </InputGroup>

            <div className="table-responsive">
                <Table hover className="align-middle">
                    <thead className="bg-light">
                        <tr>
                            <th className="border-0" style={{ minWidth: '80px' }}>Image</th>
                            <th className="border-0" style={{ minWidth: '150px' }}>Drug Name</th>
                            <th className="border-0" style={{ minWidth: '120px' }}>Generic</th>
                            <th className="border-0" style={{ minWidth: '150px' }}>Manufacturer</th>
                            <th className="border-0" style={{ minWidth: '200px' }}>Description</th>
                            <th className="border-0 text-end" style={{ minWidth: '150px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDrugs.length > 0 ? (
                            filteredDrugs.map(drug => {
                                // Get first visible formulation image or placeholder
                                const firstFormulation = drug.drug_formulations?.[0];
                                const firstImage = firstFormulation?.images?.[0]?.image_url;

                                return (
                                <tr key={drug.id}>
                                    <td>
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
                                    <td className="fw-bold text-break">{drug.name}</td>
                                    <td className="text-muted text-break">{drug.generic_name || '-'}</td>
                                    <td>
                                        <Badge bg="light" text="dark" className="border text-wrap text-start">
                                            {drug.manufacturers?.name || 'Unknown'}
                                        </Badge>
                                    </td>
                                    <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
                                        {drug.description || '-'}
                                    </td>
                                    <td className="text-end">
                                        <div className="d-flex justify-content-end gap-2">
                                            <Button 
                                                variant="outline-primary" 
                                                size="sm" 
                                                onClick={() => handleOpenFormulations(drug)}
                                                title="View/Edit Formulations"
                                                className="d-flex align-items-center gap-1"
                                            >
                                                <FaPills size={12} /> <span className="d-none d-md-inline">Formulations</span>
                                            </Button>
                                            <Button 
                                                variant="light" 
                                                size="sm" 
                                                className="text-primary"
                                                onClick={() => handleOpenEditDrug(drug)}
                                                title="Edit Details"
                                            >
                                                <FaEdit />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )})
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-5 text-muted">
                                    No drugs found. Add one to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </Card.Body>
      </Card>

      {/* Add Drug Modal (Wizard) */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Add New Drug</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <FormikProvider value={addDrugFormik}>
               <Form onSubmit={addDrugFormik.handleSubmit}>
                   {step === 1 ? (
                       <div className="step-1">
                           <h6 className="fw-bold mb-3">Step 1: Basic Information</h6>
                           <Row className="g-3">
                               <Col md={6}>
                                   <Form.Group>
                                       <Form.Label>Drug Name</Form.Label>
                                       <Form.Control {...addDrugFormik.getFieldProps('name')} isInvalid={addDrugFormik.touched.name && addDrugFormik.errors.name} />
                                       <Form.Control.Feedback type="invalid">{addDrugFormik.errors.name}</Form.Control.Feedback>
                                   </Form.Group>
                               </Col>
                               <Col md={6}>
                                   <Form.Group>
                                       <Form.Label>Generic Name</Form.Label>
                                       <Form.Control {...addDrugFormik.getFieldProps('generic_name')} />
                                   </Form.Group>
                               </Col>
                               <Col md={6}>
                                   <Form.Group>
                                       <Form.Label>Manufacturer</Form.Label>
                                       <Form.Select {...addDrugFormik.getFieldProps('manufacturer_id')} isInvalid={addDrugFormik.touched.manufacturer_id && addDrugFormik.errors.manufacturer_id}>
                                           <option value="">Select Manufacturer</option>
                                           {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                       </Form.Select>
                                       <Form.Control.Feedback type="invalid">{addDrugFormik.errors.manufacturer_id}</Form.Control.Feedback>
                                   </Form.Group>
                               </Col>
                               <Col md={12}>
                                   <Form.Group>
                                       <Form.Label>Description</Form.Label>
                                       <Form.Control as="textarea" rows={3} {...addDrugFormik.getFieldProps('description')} />
                                   </Form.Group>
                               </Col>
                           </Row>
                           <div className="d-flex justify-content-end mt-4">
                               <Button onClick={() => addDrugFormik?.values?.manufacturer_id && addDrugFormik?.values?.name && setStep(2)}>Next: Formulations <FaArrowRight /></Button>
                           </div>
                       </div>
                   ) : (
                       <div className="step-2">
                           <h6 className="fw-bold mb-3">Step 2: Formulations & Images</h6>
                           <FieldArray name="formulations">
                               {({ push, remove }) => (
                                   <div>
                                       {addDrugFormik.values.formulations.map((f, index) => (
                                           <Card key={index} className="mb-3 bg-light border-0">
                                               <Card.Body>
                                                   <div className="d-flex justify-content-between mb-2">
                                                       <strong>Formulation #{index + 1}</strong>
                                                       {index > 0 && <Button variant="link" className="text-danger p-0" onClick={() => remove(index)}><FaTrash /></Button>}
                                                   </div>
                                                   <Row className="g-3">
                                                       <Col md={6}>
                                                           <Form.Control placeholder="Strength (e.g. 500mg)" {...addDrugFormik.getFieldProps(`formulations.${index}.strength`)} isInvalid={addDrugFormik.touched.formulations?.[index]?.strength && addDrugFormik.errors.formulations?.[index]?.strength} />
                                                       </Col>
                                                       <Col md={6}>
                                                           <Form.Control placeholder="Form (e.g. Tablet)" {...addDrugFormik.getFieldProps(`formulations.${index}.form`)} isInvalid={addDrugFormik.touched.formulations?.[index]?.form && addDrugFormik.errors.formulations?.[index]?.form} />
                                                       </Col>
                                                       <Col md={12}>
                                                            <Form.Group>
                                                                <Form.Label>Selling Price</Form.Label>
                                                                <InputGroup>
                                                                    <InputGroup.Text>NGN</InputGroup.Text>
                                                                    <Form.Control type="number" placeholder="Enter selling price" {...addDrugFormik.getFieldProps(`formulations.${index}.selling_price`)} isInvalid={addDrugFormik.touched.formulations?.[index]?.selling_price && addDrugFormik.errors.formulations?.[index]?.selling_price} />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{addDrugFormik.errors.formulations?.[index]?.selling_price}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Col>
                                                       <Col md={12}>
                                                            <Form.Label className="small text-muted">Images (Min 1, Max 4)</Form.Label>
                                                            <div className="d-flex gap-2 flex-wrap">
                                                                {f.images.map((img, imgIdx) => (
                                                                    <div key={imgIdx} className="position-relative">
                                                                        <Image src={URL.createObjectURL(img)} thumbnail width={60} height={60} style={{ objectFit: 'cover' }} />
                                                                    </div>
                                                                ))}
                                                                {f.images.length < 4 && (
                                                                    <div className="border rounded d-flex align-items-center justify-content-center bg-white" style={{ width: 60, height: 60 }}>
                                                                        <label className="w-100 h-100 d-flex align-items-center justify-content-center cursor-pointer mb-0">
                                                                            <FaPlus className="text-muted" />
                                                                            <input type="file" className="d-none" accept="image/*" multiple onChange={(e) => handleImageUpload(e, index, addDrugFormik.setFieldValue, addDrugFormik.values)} />
                                                                        </label>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {addDrugFormik.touched.formulations?.[index]?.images && typeof addDrugFormik.errors.formulations?.[index]?.images === 'string' && (
                                                                <div className="text-danger small">{addDrugFormik.errors.formulations?.[index]?.images}</div>
                                                            )}
                                                       </Col>
                                                   </Row>
                                               </Card.Body>
                                           </Card>
                                       ))}
                                       <Button variant="outline-primary" size="sm" onClick={() => push({ strength: '', form: '', images: [], selling_price: '' })}><FaPlus /> Add Another</Button>
                                   </div>
                               )}
                           </FieldArray>
                           <div className="d-flex justify-content-between mt-4">
                               <Button variant="secondary" onClick={() => setStep(1)}><FaArrowLeft /> Back</Button>
                               <Button type="submit" style={{ backgroundColor: '#7B3FE4', border: 'none' }} disabled={addDrugFormik.isSubmitting}>Save Drug</Button>
                           </div>
                       </div>
                   )}
               </Form>
           </FormikProvider>
        </Modal.Body>
      </Modal>

      {/* Edit Drug Details Modal */}
      <Modal show={showEditDrugModal} onHide={() => setShowEditDrugModal(false)} centered>
          <Modal.Header closeButton><Modal.Title>Edit Drug Details</Modal.Title></Modal.Header>
          <Modal.Body>
              <Form onSubmit={editDrugFormik.handleSubmit}>
                   <Form.Group className="mb-3">
                       <Form.Label>Drug Name</Form.Label>
                       <Form.Control {...editDrugFormik.getFieldProps('name')} isInvalid={editDrugFormik.touched.name && editDrugFormik.errors.name} />
                       <Form.Control.Feedback type="invalid">{editDrugFormik.errors.name}</Form.Control.Feedback>
                   </Form.Group>
                   <Form.Group className="mb-3">
                       <Form.Label>Generic Name</Form.Label>
                       <Form.Control {...editDrugFormik.getFieldProps('generic_name')} />
                   </Form.Group>
                   <Form.Group className="mb-3">
                       <Form.Label>Manufacturer</Form.Label>
                       <Form.Select {...editDrugFormik.getFieldProps('manufacturer_id')} isInvalid={editDrugFormik.touched.manufacturer_id && editDrugFormik.errors.manufacturer_id}>
                           <option value="">Select Manufacturer</option>
                           {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </Form.Select>
                       <Form.Control.Feedback type="invalid">{editDrugFormik.errors.manufacturer_id}</Form.Control.Feedback>
                   </Form.Group>
                   <Form.Group className="mb-3">
                       <Form.Label>Description</Form.Label>
                       <Form.Control as="textarea" rows={3} {...editDrugFormik.getFieldProps('description')} />
                   </Form.Group>
                   <div className="d-flex justify-content-end gap-2">
                       <Button variant="secondary" onClick={() => setShowEditDrugModal(false)}>Cancel</Button>
                       <Button type="submit" variant="primary">Save Changes</Button>
                   </div>
              </Form>
          </Modal.Body>
      </Modal>

      {/* Formulations Modal (View/Edit) */}
      {selectedDrug && (
        <DrugFormulationsModal 
            show={showFormulationsModal} 
            onHide={() => setShowFormulationsModal(false)} 
            drug={selectedDrug} 
            onToggleVisibility={handleToggleVisibility}
        />
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal 
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={confirmAction}
        title={confirmTitle}
        message={confirmMessage}
      />
    </Container>
  );
};

export default Drugs;
