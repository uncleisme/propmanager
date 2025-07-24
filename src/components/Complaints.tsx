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
  comment?: string;
  photoUrl?: string;
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
    comment: '',
    photoUrl: '',
  });
  const [search, setSearch] = useState('');
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>("add");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  // Remove statusFilter and typeFilter state

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
      // Fetch work orders
      const { data: woData, error: woError } = await supabase
        .from('work_order')
        .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,technicianId,createdAt,resolvedAt,comment,photoUrl')
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
      comment: '',
      photoUrl: '',
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
      priority: (order.priority ?? '') || '',
      propertyUnit: (order.propertyUnit ?? '') || '',
      scheduledDate: (order.scheduledDate ?? '') || '',
      scheduledStart: (order.scheduledStart ?? '') || '',
      scheduledEnd: (order.scheduledEnd ?? '') || '',
      technicianId: (order.technicianId ?? '') || '',
      comment: order.comment || '',
      photoUrl: order.photoUrl || '',
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
      .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,technicianId,createdAt,resolvedAt,comment,photoUrl')
      .order('createdAt', { ascending: false });
    setWorkOrders(woData || []);
    setLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value === null ? '' : value }));
  };

  // Handle photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { data, error } = await supabase.storage.from('work-order').upload(fileName, file);
    if (!error && data) {
      const { publicUrl } = supabase.storage.from('work-order').getPublicUrl(data.path).data;
      setForm(prev => ({ ...prev, photoUrl: publicUrl }));
    }
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
      type: form.type === 'job' || form.type === 'complaint' ? form.type : undefined,
      priority: form.type === 'complaint' ? form.priority : undefined,
      propertyUnit: form.type === 'complaint' ? form.propertyUnit : undefined,
      scheduledDate: form.scheduledDate || undefined,
      scheduledStart: form.scheduledStart || undefined,
      scheduledEnd: form.scheduledEnd || undefined,
      technicianId: form.technicianId || undefined,
      createdAt: modalType === 'add' ? new Date().toISOString() : undefined,
      comment: form.comment || undefined,
      photoUrl: form.photoUrl || undefined,
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
      .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,technicianId,createdAt,resolvedAt,comment,photoUrl')
      .order('createdAt', { ascending: false });
    setWorkOrders(woData || []);
    setLoading(false);
  };

  // Filter work orders by search only
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

  // Add a function to update status
  const handleStatusChange = async (status: string) => {
    if (!selectedOrder) return;
    setLoading(true);
    let updateFields: any = { status };
    let resolvedAt: string | undefined = undefined;
    if (status === 'completed') {
      resolvedAt = new Date().toISOString();
      updateFields.resolvedAt = resolvedAt;
    } else if (selectedOrder.status === 'completed') {
      // If reverting from completed, clear resolvedAt
      updateFields.resolvedAt = null;
    }
    const { error } = await supabase.from('work_order').update(updateFields).eq('id', selectedOrder.id);
    if (!error) {
      setWorkOrders(prev => prev.map(wo => wo.id === selectedOrder.id ? { ...wo, status, resolvedAt: updateFields.resolvedAt } : wo));
      setSelectedOrder(prev => prev ? { ...prev, status, resolvedAt: updateFields.resolvedAt } : prev);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Page Title and Add Button (separate from main container) */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-600">Monitor and manage all jobs and complaints</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Work Order</span>
        </button>
      </div>
      {/* Main Content: Two Columns */}
      <div className="flex flex-1 min-h-0 h-[80vh] bg-white rounded-lg shadow border border-gray-200">
        {/* Left: Work Order List */}
        <div className="w-1/3 border-r overflow-y-auto p-2 bg-gray-50">
          <div className="mb-2 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Search title, unit, technician, or status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            {filteredWorkOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8">No work order found</div>
            ) : (
              filteredWorkOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`relative p-4 mb-3 rounded-lg cursor-pointer border transition-colors duration-150 shadow-sm bg-white overflow-hidden
                    ${selectedOrder?.id === order.id ? 'ring-2 ring-blue-400 border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-blue-50'}`}
                  style={{ minHeight: '72px' }}
                >
                  {/* Priority tag right-aligned at top */}
                  {order.priority && (
                    <span className={`absolute top-3 right-4 px-2 py-1 rounded-full text-xs font-medium z-10
                      ${order.priority === 'high' ? 'bg-red-100 text-red-700' : order.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : order.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{order.priority}</span>
                  )}
                  {/* Status tag for completed, in-progress, or open */}
                  {order.status && order.status.toLowerCase() === 'completed' && (
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white z-10">Done</span>
                  )}
                  {order.status && order.status.toLowerCase() === 'in-progress' && (
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white z-10">In Progress</span>
                  )}
                  {order.status && order.status.toLowerCase() === 'open' && (
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white z-10">Open</span>
                  )}
                  <div className="flex flex-col">
                    <div className="font-semibold text-gray-900 text-sm truncate pr-16">{order.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Type tag */}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize
                        ${order.type === 'job' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{order.type}</span>
                      {order.propertyUnit && (
                        <span className="text-xs text-gray-500">{order.propertyUnit}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Right: Work Order Details */}
        <div className="flex-1 p-6 overflow-y-auto">
          {!selectedOrder ? (
            <div className="text-gray-400 text-center mt-24">Select a work order to view details</div>
          ) : (
            <div className="max-w-xl mx-auto">
              {/* Status Buttons at the top */}
              <div className="flex space-x-3 mb-6">
                <button
                  onClick={() => handleStatusChange('open')}
                  className={`flex-1 py-2 rounded-lg font-semibold border transition-colors duration-150 ${selectedOrder.status === 'open' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
                >Open</button>
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  className={`flex-1 py-2 rounded-lg font-semibold border transition-colors duration-150 ${selectedOrder.status === 'in-progress' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-700 border-orange-300 hover:bg-orange-50'}`}
                >In Progress</button>
                <button
                  onClick={() => handleStatusChange('completed')}
                  className={`flex-1 py-2 rounded-lg font-semibold border transition-colors duration-150 ${selectedOrder.status === 'completed' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-300 hover:bg-green-50'}`}
                >Done</button>
                <button
                  onClick={() => handleEdit(selectedOrder)}
                  className="flex-1 py-2 rounded-lg font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                >Edit</button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold text-gray-900">{selectedOrder.title}</div>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
              <div className="mb-2 text-sm text-gray-500 capitalize">{selectedOrder.type} {selectedOrder.propertyUnit ? `| ${selectedOrder.propertyUnit}` : ''}</div>
              {selectedOrder.priority && (
                <div className="mb-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.priority === 'high' ? 'bg-red-100 text-red-700' : selectedOrder.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : selectedOrder.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{selectedOrder.priority}</span></div>
              )}
              <div className="mb-4">
                <div className="font-medium text-gray-700 mb-1">Description</div>
                <div className="text-gray-900 text-sm">{selectedOrder.description || '-'}</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-gray-700 mb-1">Comment</div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 text-gray-900 text-sm min-h-[48px] whitespace-pre-line">
                  {selectedOrder.comment ? selectedOrder.comment : <span className="text-gray-400">No comment</span>}
                </div>
              </div>
              <div className="mb-6">
                <div className="font-medium text-gray-700 mb-1">Photo</div>
                {selectedOrder?.photoUrl ? (
                  <div className="flex justify-center items-center bg-gray-100 border border-gray-200 rounded-lg p-2">
                    <img src={selectedOrder.photoUrl} alt="Work Order Photo" className="max-h-64 rounded shadow" />
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm italic text-center bg-gray-50 border border-gray-200 rounded p-4">No photo uploaded</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="font-medium text-gray-700 mb-1">Scheduled Date</div>
                  <div className="text-gray-900 text-sm">{selectedOrder.scheduledDate || '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">Start Time</div>
                  <div className="text-gray-900 text-sm">{selectedOrder.scheduledStart || '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">End Time</div>
                  <div className="text-gray-900 text-sm">{selectedOrder.scheduledEnd || '-'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-700 mb-1">Technician</div>
                  <div className="text-gray-900 text-sm">{getTechnicianName(selectedOrder.technicianId) || '-'}</div>
                </div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-gray-700 mb-1">Created At</div>
                <div className="text-gray-900 text-sm">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</div>
              </div>
              <div className="mb-4">
                <div className="font-medium text-gray-700 mb-1">Resolved At</div>
                <div className="text-gray-900 text-sm">{selectedOrder.resolvedAt ? new Date(selectedOrder.resolvedAt).toLocaleString() : '-'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Add Work Order Modal (unchanged) */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                    <div className="text-gray-900 text-sm">{selectedOrder?.comment || '-'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                    {selectedOrder?.photoUrl ? (
                      <img src={selectedOrder.photoUrl} alt="Work Order Photo" className="mt-2 max-h-48 rounded" />
                    ) : (
                      <div className="text-gray-500 text-sm">-</div>
                    )}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea
                    name="comment"
                    value={form.comment ?? ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {form.photoUrl && (
                    <img src={form.photoUrl} alt="Work Order Photo" className="mt-2 max-h-32 rounded" />
                  )}
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
    </>
  );
};

export default Complaints;