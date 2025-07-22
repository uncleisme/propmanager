import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Plus, X, Eye, Edit, Trash2, Search } from 'lucide-react';

interface WorkOrder {
  id: string;
  type: 'job' | 'complaint';
  title: string;
  description: string;
  status: string;
  priority?: string;
  propertyUnit?: string;
  scheduledDate?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  technicianId?: string;
  createdAt: string;
  resolvedAt?: string;
}

const Complaints: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    type: 'job',
    title: '',
    description: '',
    status: '',
    priority: '',
    propertyUnit: '',
    scheduledDate: '',
    scheduledStart: '',
    scheduledEnd: '',
    technicianId: '',
  });
  const [search, setSearch] = useState('');
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>("add");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
      // Fetch work orders
      const { data: woData, error: woError } = await supabase
        .from('work_order')
        .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,technicianId,createdAt,resolvedAt')
        .order('createdAt', { ascending: false });
      if (woError) {
      setLoading(false);
        return;
      }
      setWorkOrders(woData || []);
      // Fetch contacts for technician name resolution
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, name');
      setContacts(contactsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getTechnicianName = (id?: string) => {
    if (!id) return '';
    const contact = contacts.find(c => c.id === id);
    return contact ? contact.name : '';
  };

  // Status badge mapping
  const getStatusBadge = (status: string) => {
    let label = status;
    let color = 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'open':
        label = 'Open';
        color = 'bg-blue-100 text-blue-800';
        break;
      case 'in-progress':
      case 'work in progress':
      case 'in_progress':
        label = 'Work In Progress';
        color = 'bg-yellow-100 text-yellow-800';
        break;
      case 'completed':
      case 'complete':
      case 'resolved':
      case 'closed':
        label = 'Completed';
        color = 'bg-green-100 text-green-800';
        break;
      default:
        label = status;
        color = 'bg-gray-100 text-gray-800';
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
  };

  const handleAdd = () => {
    setForm({
      type: 'job',
        title: '',
        description: '',
      status: '',
      priority: '',
      propertyUnit: '',
      scheduledDate: '',
      scheduledStart: '',
      scheduledEnd: '',
      technicianId: '',
    });
    setErrorMsg('');
    setModalType('add');
    setSelectedOrder(null);
    setShowModal(true);
  };

  const handleView = (order: WorkOrder) => {
    setSelectedOrder(order);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (order: WorkOrder) => {
    setForm({
      type: order.type,
      title: order.title,
      description: order.description,
      status: order.status,
      priority: order.priority || '',
      propertyUnit: order.propertyUnit || '',
      scheduledDate: order.scheduledDate || '',
      scheduledStart: order.scheduledStart || '',
      scheduledEnd: order.scheduledEnd || '',
      technicianId: order.technicianId || '',
    });
    setSelectedOrder(order);
    setModalType('edit');
    setShowModal(true);
  };

  const handleDelete = async (order: WorkOrder) => {
    if (!window.confirm('Delete this work order?')) return;
    setLoading(true);
    await supabase.from('work_order').delete().eq('id', order.id);
    // Refresh table
    const { data: woData } = await supabase
      .from('work_order')
      .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,technicianId,createdAt,resolvedAt')
      .order('createdAt', { ascending: false });
    setWorkOrders(woData || []);
    setLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.title.trim() || !form.status.trim()) {
      setErrorMsg('Title and status are required.');
      return;
    }
    const insertData: Partial<WorkOrder> = {
      ...form,
      priority: form.type === 'complaint' ? form.priority : null,
      propertyUnit: form.type === 'complaint' ? form.propertyUnit : null,
      scheduledDate: form.scheduledDate || null,
      scheduledStart: form.scheduledStart || null,
      scheduledEnd: form.scheduledEnd || null,
      technicianId: form.technicianId || null,
      createdAt: modalType === 'add' ? new Date().toISOString() : undefined,
    };
    if (modalType === 'add') {
      const { error } = await supabase.from('work_order').insert([insertData]);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
    } else if (modalType === 'edit' && selectedOrder) {
      // If status is changed to completed and was not previously completed, set resolvedAt
      let resolvedAt: string | null = selectedOrder.resolvedAt || null;
      const prevStatus = (selectedOrder.status || '').toLowerCase();
      const newStatus = (form.status || '').toLowerCase();
      if ((newStatus === 'completed' || newStatus === 'complete' || newStatus === 'resolved' || newStatus === 'closed') &&
          !(prevStatus === 'completed' || prevStatus === 'complete' || prevStatus === 'resolved' || prevStatus === 'closed')) {
        resolvedAt = new Date().toISOString();
      } else if (!(newStatus === 'completed' || newStatus === 'complete' || newStatus === 'resolved' || newStatus === 'closed')) {
        resolvedAt = null;
      }
      const updateData = { ...insertData, resolvedAt };
      const { error } = await supabase.from('work_order').update(updateData).eq('id', selectedOrder.id);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
    }
    setShowModal(false);
    // Refresh table
    setLoading(true);
    const { data: woData } = await supabase
      .from('work_order')
      .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,technicianId,createdAt,resolvedAt')
      .order('createdAt', { ascending: false });
    setWorkOrders(woData || []);
    setLoading(false);
  };

  // Filter work orders by search
  const filteredWorkOrders = workOrders.filter(order => {
    const techName = getTechnicianName(order.technicianId).toLowerCase();
    return (
      order.title.toLowerCase().includes(search.toLowerCase()) ||
      (order.propertyUnit || '').toLowerCase().includes(search.toLowerCase()) ||
      techName.includes(search.toLowerCase()) ||
      order.status.toLowerCase().includes(search.toLowerCase())
    );
  });
  const totalEntries = filteredWorkOrders.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedWorkOrders = filteredWorkOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Enum titles for work order (Normal Case)
  const WORK_ORDER_TITLES = [
    'Plumbing Issue',
    'Electrical Issue',
    'Air Conditioning',
    'Lighting Problem',
    'Door Or Lock Repair',
    'Furniture Repair',
    'Cleaning Request',
    'Pest Control',
    'Painting Request',
    'Computer Issue',
    'Internet Problem',
    'Software Support',
    'Printer Issue',
    'Email Or Account',
    'Network Problem',
    'Supply Request',
    'Meeting Room Setup',
    'Keycard Access',
    'Moving Assistance',
    'Other',
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-600">Monitor and manage all jobs and complaints</p>
        </div>
        <div className="flex items-center space-x-3">
        <button
            onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
            <span>Add Work Order</span>
        </button>
        </div>
      </div>
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 font-medium">
            <span className="font-semibold">Error:</span> {errorMsg}
          </p>
          </div>
      )}
      {/* Search Bar */}
      <div className="relative w-full max-w-md mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by title, unit, technician, or status..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="flex-1 overflow-auto w-full bg-white rounded-lg shadow-sm border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No work order found
                  </td>
                </tr>
              ) : (
                paginatedWorkOrders.map((order, idx) => (
                  <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{(currentPage - 1) * pageSize + idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{order.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{order.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{order.propertyUnit || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{order.scheduledDate || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getTechnicianName(order.technicianId) || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button onClick={() => handleView(order)} className="text-blue-600 hover:text-blue-900" title="View"><Eye className="w-5 h-5" /></button>
                        <button onClick={() => handleEdit(order)} className="text-yellow-600 hover:text-yellow-900" title="Edit"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDelete(order)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination Controls and Total Count */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-4 gap-2">
        <div>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          <span className="mx-2">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage((p) => (p < totalPages ? p + 1 : p))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="text-sm text-gray-600">Total: {totalEntries} entries</div>
      </div>
      {/* Add Work Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'add' && 'Add Work Order'}
                  {modalType === 'edit' && 'Edit Work Order'}
                  {modalType === 'view' && 'Work Order Details'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {modalType === 'view' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <div className="text-gray-900 text-sm font-semibold capitalize">{selectedOrder?.type}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <div className="text-gray-900 text-sm">{selectedOrder?.title}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <div className="text-gray-900 text-sm">{selectedOrder?.description || '-'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div>{getStatusBadge(selectedOrder?.status || '')}</div>
                  </div>
                  {selectedOrder?.type === 'complaint' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <div className="text-gray-900 text-sm">{selectedOrder?.priority || '-'}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Unit</label>
                        <div className="text-gray-900 text-sm">{selectedOrder?.propertyUnit || '-'}</div>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                      <div className="text-gray-900 text-sm">{selectedOrder?.scheduledDate || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <div className="text-gray-900 text-sm">{selectedOrder?.scheduledStart || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <div className="text-gray-900 text-sm">{selectedOrder?.scheduledEnd || '-'}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                    <div className="text-gray-900 text-sm">{getTechnicianName(selectedOrder?.technicianId) || '-'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                    <div className="text-gray-900 text-sm">{selectedOrder?.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolved At</label>
                    <div className="text-gray-900 text-sm">{selectedOrder?.resolvedAt ? new Date(selectedOrder.resolvedAt).toLocaleString() : '-'}</div>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="job">Job</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <select
                    name="title"
                    value={form.title ?? ''}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select title</option>
                    {WORK_ORDER_TITLES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    value={form.description ?? ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                  <select
                    name="status"
                    value={form.status ?? ''}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select status</option>
                    <option value="open">Open</option>
                    <option value="in-progress">Work In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                {form.type === 'complaint' && (
                  <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                        name="priority"
                        value={form.priority}
                        onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Property Unit</label>
                      <input
                        name="propertyUnit"
                        value={form.propertyUnit ?? ''}
                        onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                      type="date"
                      name="scheduledDate"
                      value={form.scheduledDate ?? ''}
                      onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      name="scheduledStart"
                      value={form.scheduledStart ?? ''}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      name="scheduledEnd"
                      value={form.scheduledEnd ?? ''}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician (optional)</label>
                  <select
                    name="technicianId"
                    value={form.technicianId ?? ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {contacts.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    {modalType === 'edit' ? 'Save Changes' : 'Add Work Order'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;