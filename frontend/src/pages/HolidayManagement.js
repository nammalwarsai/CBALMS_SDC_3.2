import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Card, Table, Button, Form, Modal, Badge, Spinner } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import useToast from '../hooks/useToast';
import holidayService from '../services/holidayService';

const HolidayManagement = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const toast = useToast();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [formData, setFormData] = useState({ name: '', date: '', type: 'public' });
  const [seeding, setSeeding] = useState(false);

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const response = await holidayService.getHolidays(selectedYear);
      setHolidays(response.data || []);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      toast.error('Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  }, [selectedYear, toast]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await holidayService.createHoliday(formData.name, formData.date, formData.type);
      toast.success('Holiday added successfully');
      setShowAddModal(false);
      setFormData({ name: '', date: '', type: 'public' });
      fetchHolidays();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add holiday');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await holidayService.updateHoliday(editingHoliday.id, formData);
      toast.success('Holiday updated successfully');
      setShowEditModal(false);
      setEditingHoliday(null);
      setFormData({ name: '', date: '', type: 'public' });
      fetchHolidays();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update holiday');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await holidayService.deleteHoliday(id);
      toast.success('Holiday deleted');
      fetchHolidays();
    } catch (error) {
      toast.error('Failed to delete holiday');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      const response = await holidayService.seedHolidays(selectedYear);
      toast.success(response.message || 'Default holidays seeded');
      fetchHolidays();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to seed holidays');
    } finally {
      setSeeding(false);
    }
  };

  const openEditModal = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({ name: holiday.name, date: holiday.date, type: holiday.type || 'public' });
    setShowEditModal(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  return (
    <div className="d-flex">
      <Sidebar user={user} onLogout={handleLogout} isAdmin={true} collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      <div className="main-content flex-grow-1" style={{ marginLeft: '0' }}>
        <Container fluid className={`mt-4 px-4 pb-4 dashboard-main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <div>
              <h2><i className="bi bi-calendar-heart me-2"></i>Holiday Management</h2>
              <p className="text-muted mb-0">Manage public holidays for the organization</p>
            </div>
            <div className="d-flex gap-2 align-items-center mt-2 mt-md-0">
              <Button variant="outline-secondary" onClick={() => navigate('/admin-dashboard')}>
                <i className="bi bi-arrow-left me-1"></i>Back
              </Button>
            </div>
          </div>

          <Card className="content-card mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex align-items-center gap-3 bg-light p-2 rounded shadow-sm border border-secondary border-opacity-25">
                <strong className="text-primary mb-0 d-flex align-items-center">
                  <i className="bi bi-calendar-check me-2"></i>Holidays for:
                </strong>
                <Form.Select
                  className="fw-bold text-primary shadow-none border-primary"
                  style={{ width: '130px', cursor: 'pointer' }}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" onClick={handleSeedDefaults} disabled={seeding}>
                  {seeding ? <Spinner animation="border" size="sm" /> : <i className="bi bi-magic me-1"></i>}
                  Seed Defaults
                </Button>
                <Button variant="primary" size="sm" onClick={() => { setFormData({ name: '', date: '', type: 'public' }); setShowAddModal(true); }}>
                  <i className="bi bi-plus-lg me-1"></i>Add Holiday
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="text-muted mt-2">Loading holidays...</p>
                </div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i>
                  <p className="text-muted mt-2">No holidays configured for {selectedYear}. Click "Seed Defaults" to add standard holidays.</p>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Holiday Name</th>
                      <th>Date</th>
                      <th>Day</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holidays.map((holiday, index) => {
                      const d = new Date(holiday.date + 'T00:00:00');
                      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
                      return (
                        <tr key={holiday.id}>
                          <td>{index + 1}</td>
                          <td><strong>{holiday.name}</strong></td>
                          <td>{d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                          <td><Badge bg="info">{dayName}</Badge></td>
                          <td><Badge bg={holiday.type === 'bonus' ? 'warning' : 'primary'}>{holiday.type === 'bonus' ? 'Bonus' : 'Public'}</Badge></td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1" onClick={() => openEditModal(holiday)}>
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(holiday.id)}>
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Add Holiday Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Holiday</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAdd}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Holiday Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Republic Day"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="public">Public Holiday</option>
                <option value="bonus">Bonus Holiday</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Add Holiday</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Holiday Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Holiday</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEdit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Holiday Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="public">Public Holiday</option>
                <option value="bonus">Bonus Holiday</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Changes</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default HolidayManagement;
