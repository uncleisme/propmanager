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
  assignedTo?: string;
  technicianId?: string;
  createdAt: string;
  resolvedAt?: string;
  comment?: string;
  photoUrl?: string;
}

const Complaints: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [technicians, setTechnicians] = useState<{ id: string; full_name: string | null; email: string; type: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Work order title options based on enum title.txt
  const workOrderTitles = [
    // Facilities / Maintenance
    { value: 'Plumbing Issue', label: 'Plumbing Issue', category: 'Facilities / Maintenance' },
    { value: 'Electrical Issue', label: 'Electrical Issue', category: 'Facilities / Maintenance' },
    { value: 'Air Conditioning', label: 'Air Conditioning', category: 'Facilities / Maintenance' },
    { value: 'Lighting Problem', label: 'Lighting Problem', category: 'Facilities / Maintenance' },
    { value: 'Door or Lock Repair', label: 'Door or Lock Repair', category: 'Facilities / Maintenance' },
    { value: 'Furniture Repair', label: 'Furniture Repair', category: 'Facilities / Maintenance' },
    { value: 'Cleaning Request', label: 'Cleaning Request', category: 'Facilities / Maintenance' },
    { value: 'Pest Control', label: 'Pest Control', category: 'Facilities / Maintenance' },
    { value: 'Painting Request', label: 'Painting Request', category: 'Facilities / Maintenance' },
    // IT / Technical
    { value: 'Computer Issue', label: 'Computer Issue', category: 'IT / Technical' },
    { value: 'Internet Problem', label: 'Internet Problem', category: 'IT / Technical' },
    { value: 'Software Support', label: 'Software Support', category: 'IT / Technical' },
    { value: 'Printer Issue', label: 'Printer Issue', category: 'IT / Technical' },
    { value: 'Email or Account', label: 'Email or Account', category: 'IT / Technical' },
    { value: 'Network Problem', label: 'Network Problem', category: 'IT / Technical' },
    // Administrative / General Office
    { value: 'Supply Request', label: 'Supply Request', category: 'Administrative / General Office' },
    { value: 'Meeting Room Setup', label: 'Meeting Room Setup', category: 'Administrative / General Office' },
    { value: 'Keycard Access', label: 'Keycard Access', category: 'Administrative / General Office' },
    { value: 'Moving Assistance', label: 'Moving Assistance', category: 'Administrative / General Office' },
    { value: 'Other', label: 'Other', category: 'Administrative / General Office' },
  ];
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
    assignedTo: '',
    technicianId: '',
    comment: '',
    photoUrl: '',
  });
  const [search, setSearch] = useState('');
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view'>("add");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'ready-for-review' | 'completed'>('active');
  const pageSize = 10;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: woData, error: woError } = await supabase
        .from('work_order')
        .select('id,type,title,description,status,priority,propertyUnit,scheduledDate,scheduledStart,scheduledEnd,assignedTo,technicianId,createdAt,resolvedAt,comment,photoUrl')
        .order('createdAt', { ascending: false });
      
      if (woError) {
        setLoading(false);
        return;
      }
      setWorkOrders(woData || []);
      
      const { data: techniciansData, error: techniciansError } = await supabase
        .from('profiles')
        .select('id, full_name, email, type')
        .eq('type', 'technician');
      
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('id, name, type');
      
      setTechnicians(techniciansData || []);
      setContacts(contactsData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const getTechnicianName = (id?: string, orderType?: string) => {
    if (!id) return '';
    
    if (orderType === 'complaint') {
      const technician = technicians.find(t => t.id === id);
      return technician ? technician.full_name || technician.email : '';
    } else {
      const contact = contacts.find(c => c.id === id);
      return contact ? contact.name : '';
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newForm = { ...form, [name]: value === null ? '' : value };
    setForm(newForm);
  };

  const getStatusBadge = (status: string) => {
    let label = status || 'No Status';
    let color = 'bg-gray-100 text-gray-800';
    switch ((status || '').toLowerCase()) {
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
      case 'ready-for-review':
      case 'pending-confirmation':
        label = 'Ready for Review';
        color = 'bg-orange-100 text-orange-800';
        break;
      case 'completed':
      case 'complete':
      case 'resolved':
      case 'closed':
        label = 'Completed';
        color = 'bg-green-100 text-green-800';
        break;
      default:
        label = status || 'No Status';
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
      assignedTo: '',
      technicianId: '',
      comment: '',
      photoUrl: '',
    });
    setErrorMsg('');
    setModalType('add');
    setSelectedOrder(null);
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
      assignedTo: (order.assignedTo ?? '') || '',
      technicianId: (order.technicianId ?? '') || '',
      comment: order.comment || '',
      photoUrl: order.photoUrl || '',
    });
    setSelectedOrder(order);
    setModalType('edit');
    setShowModal(true);
  };

  const handleView = (order: WorkOrder) => {
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
      assignedTo: (order.assignedTo ?? '') || '',
      technicianId: (order.technicianId ?? '') || '',
      comment: order.comment || '',
      photoUrl: order.photoUrl || '',
    });
    setSelectedOrder(order);
    setModalType('view');
    setShowModal(true);
  };

  const handleDelete = async (order: WorkOrder) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      const { error } = await supabase.from('work_order').delete().eq('id', order.id);
      if (!error) {
        setWorkOrders(prev => prev.filter(wo => wo.id !== order.id));
        if (selectedOrder?.id === order.id) {
          setSelectedOrder(null);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const insertData = {
        type: form.type,
        title: form.title,
        description: form.description,
        status: form.status || 'open',
        priority: form.priority || null,
        propertyUnit: form.propertyUnit || null,
        scheduledDate: form.scheduledDate || null,
        scheduledStart: form.scheduledStart || null,
        scheduledEnd: form.scheduledEnd || null,
        assignedTo: form.assignedTo || null,
        technicianId: form.technicianId || null,
        comment: form.comment || null,
        photoUrl: form.photoUrl || null,
      };

      if (modalType === 'add') {
        const { data, error } = await supabase.from('work_order').insert([insertData]).select();
        if (error) {
          setErrorMsg(error.message);
        } else {
          setWorkOrders(prev => [data[0] as WorkOrder, ...prev]);
          setShowModal(false);
        }
      } else if (modalType === 'edit') {
        const { error } = await supabase.from('work_order').update(insertData).eq('id', selectedOrder?.id);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setWorkOrders(prev => prev.map(wo => wo.id === selectedOrder?.id ? { ...wo, ...insertData } as WorkOrder : wo));
          setSelectedOrder(prev => prev ? { ...prev, ...insertData } as WorkOrder : prev);
          setShowModal(false);
        }
      }
    } catch (error) {
      setErrorMsg('An error occurred while saving the work order.');
    }

    setLoading(false);
  };

  // Handle photo upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    console.log('Uploading photo for work order:', selectedOrder?.id);
    console.log('File name:', file.name);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const { data, error } = await supabase.storage.from('work-order').upload(fileName, file);
    
    if (error) {
      console.error('Error uploading file:', error);
      return;
    }
    
    if (data) {
      const { publicUrl } = supabase.storage.from('work-order').getPublicUrl(data.path).data;
      console.log('File uploaded successfully, public URL:', publicUrl);
      
      // Update the database with the new photo URL
      if (selectedOrder) {
        const { error: updateError } = await supabase
          .from('work_order')
          .update({ photoUrl: publicUrl })
          .eq('id', selectedOrder.id);
        
        if (updateError) {
          console.error('Error updating work order with photo URL:', updateError);
        } else {
          console.log('Photo URL updated in database successfully');
          setSelectedOrder(prev => prev ? { ...prev, photoUrl: publicUrl } : prev);
          setWorkOrders(prev => prev.map(wo => wo.id === selectedOrder.id ? { ...wo, photoUrl: publicUrl } : wo));
        }
      }
    }
  };

  // Handle comment update
  const handleCommentChange = async (comment: string) => {
    if (!selectedOrder) return;
    
    console.log('Updating comment for work order:', selectedOrder.id);
    console.log('New comment:', comment);
    
    const { error } = await supabase.from('work_order').update({ comment }).eq('id', selectedOrder.id);
    
    if (error) {
      console.error('Error updating comment:', error);
    } else {
      console.log('Comment updated successfully');
      setSelectedOrder(prev => prev ? { ...prev, comment } : prev);
      setWorkOrders(prev => prev.map(wo => wo.id === selectedOrder.id ? { ...wo, comment } : wo));
    }
  };

  // Handle photo update
  const handlePhotoUpdate = async (photoUrl: string) => {
    if (!selectedOrder) return;
    const { error } = await supabase.from('work_order').update({ photoUrl }).eq('id', selectedOrder.id);
    if (!error) {
      setSelectedOrder(prev => prev ? { ...prev, photoUrl } : prev);
      setWorkOrders(prev => prev.map(wo => wo.id === selectedOrder.id ? { ...wo, photoUrl } : wo));
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedOrder) return;
    
    // Smart prompt for marking as done
    if (status === 'ready-for-review') {
      const hasPhoto = selectedOrder.photoUrl;
      const hasComment = selectedOrder.comment && selectedOrder.comment.trim() !== '';
      
      if (!hasPhoto && !hasComment) {
        const confirmed = window.confirm('No photo and comment attached. Are you sure you want to mark this job done?');
        if (!confirmed) return;
      } else if (!hasPhoto) {
        const confirmed = window.confirm('No photo attached. Are you sure you want to mark this job done?');
        if (!confirmed) return;
      } else if (!hasComment) {
        const confirmed = window.confirm('No comment attached. Are you sure you want to mark this job done?');
        if (!confirmed) return;
      }
      
      // For now, use 'completed' as the database status since 'ready-for-review' is not supported yet
      // This will move the work order directly to completed status
      status = 'completed';
    }
    
    setLoading(true);
    let updateFields: any = { status };
    let resolvedAt: string | undefined = undefined;
    
    if (status === 'completed') {
      resolvedAt = new Date().toISOString();
      updateFields.resolvedAt = resolvedAt;
    } else if (selectedOrder.status === 'completed') {
      updateFields.resolvedAt = null;
    }
    
    console.log('Updating work order with fields:', updateFields);
    console.log('Work order ID:', selectedOrder.id);
    
    const { error } = await supabase.from('work_order').update(updateFields).eq('id', selectedOrder.id);
    
    if (error) {
      console.error('Error updating work order:', error);
      alert('Error updating work order: ' + error.message);
    } else {
      console.log('Work order updated successfully');
      setWorkOrders(prev => prev.map(wo => wo.id === selectedOrder.id ? { ...wo, status, resolvedAt: updateFields.resolvedAt } : wo));
      setSelectedOrder(prev => prev ? { ...prev, status, resolvedAt: updateFields.resolvedAt } : prev);
      
      if (status === 'completed') {
        setActiveTab('completed');
      }
    }
    setLoading(false);
  };

  const filteredWorkOrders = workOrders.filter(order => {
    const techName = getTechnicianName(order.assignedTo, order.type).toLowerCase();
    const orderStatus = order.status?.toLowerCase() || '';
    const orderTitle = order.title?.toLowerCase() || '';
    const orderDescription = order.description?.toLowerCase() || '';
    const orderPropertyUnit = order.propertyUnit?.toLowerCase() || '';
    
    const matchesSearch = (
      orderTitle.includes(search.toLowerCase()) ||
      orderDescription.includes(search.toLowerCase()) ||
      orderPropertyUnit.includes(search.toLowerCase()) ||
      orderStatus.includes(search.toLowerCase()) ||
      techName.includes(search.toLowerCase())
    );
    
    const isCompleted = ['completed', 'complete', 'resolved', 'closed'].includes(orderStatus);
    const isReadyForReview = ['ready-for-review', 'pending-confirmation'].includes(orderStatus);
    const isActive = !isCompleted && !isReadyForReview;
    
    let matchesTab = false;
    if (activeTab === 'active') {
      matchesTab = isActive;
    } else if (activeTab === 'ready-for-review') {
      matchesTab = isReadyForReview;
    } else if (activeTab === 'completed') {
      matchesTab = isCompleted;
    }
    
    return matchesSearch && matchesTab;
  });

  return (
    <>
      <div className="flex items-center justify-between md:flex-row flex-col">
        <div>
          <h1 className="text-3xl text-center font-bold text-gray-900 md:text-left">Work Orders</h1>
          <p className="text-gray-600 text-center md:text-left mb-2">Monitor and manage all jobs and complaints</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-2 py-1 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Work Order</span>
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors duration-200 ${
            activeTab === 'active'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Active Work Orders
        </button>
        <button
          onClick={() => setActiveTab('ready-for-review')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors duration-200 ${
            activeTab === 'ready-for-review'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Ready for Review
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors duration-200 ${
            activeTab === 'completed'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Completed Orders
        </button>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 min-h-0 h-[80vh] inset-shadow-2xs bg-blue-100 rounded-lg flex-col md:flex-row mt-2 mb-6">
        {/* Left: Work Order List */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-50 overflow-y-auto p-2 bg-gray-50">
          <div className="mb-2 flex flex-col gap-2">
            <input
              type="text"
              placeholder="Search work orders..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="mb-2 px-2 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:px-3"
            />
          </div>
          <div>
            {filteredWorkOrders.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                {activeTab === 'active' ? 'No current jobs or complaints' : 
                 activeTab === 'ready-for-review' ? 'No work orders ready for review' : 
                 'No completed work orders'}
              </div>
            ) : (
              filteredWorkOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className={`relative p-3 md:p-4 mb-3 rounded-lg cursor-pointer border transition-colors duration-150 shadow-sm bg-white overflow-hidden
                    ${selectedOrder?.id === order.id ? 'ring-2 ring-blue-400 border-blue-200 bg-blue-50' : 'border-gray-300 hover:bg-blue-50 hover:border-gray-400'}`}
                  style={{ minHeight: '56px' }}
                >
                  {order.priority && (
                    <span className={`absolute top-3 right-4 px-2 py-1 rounded-full text-xs font-medium z-10
                      ${order.priority === 'high' ? 'bg-red-100 text-red-700' : order.priority === 'critical' ? 'bg-red-100 text-red-700' : order.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : order.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{order.priority}</span>
                  )}
                  
                  {order.status && (order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'complete' || order.status.toLowerCase() === 'resolved' || order.status.toLowerCase() === 'closed') && (
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-full text-xs font-medium bg-green-600 text-white z-10">Done</span>
                  )}
                  {order.status && (order.status.toLowerCase() === 'in-progress' || order.status.toLowerCase() === 'in_progress') && (
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-full text-xs font-medium bg-orange-500 text-white z-10">In Progress</span>
                  )}
                  {order.status && order.status.toLowerCase() === 'open' && (
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-full text-xs font-medium bg-blue-600 text-white z-10">Open</span>
                  )}
                  {order.status && (order.status.toLowerCase() === 'ready-for-review' || order.status.toLowerCase() === 'pending-confirmation') && (
                    <span className="absolute bottom-3 right-4 px-2 py-1 rounded-full text-xs font-medium bg-orange-600 text-white z-10">Review</span>
                  )}
                  
                  <div className="flex flex-col">
                    <div className="font-semibold text-gray-900 text-sm truncate pr-10 md:pr-16">{order.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize
                        ${order.type === 'job' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{order.type}</span>
                      {order.propertyUnit && (
                        <span className="text-xs text-gray-500">{order.propertyUnit}</span>
                      )}
                    </div>
                    
                    {order.assignedTo && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-400">
                          {order.type === 'complaint' ? 'Technician:' : 'Contact:'}
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          {getTechnicianName(order.assignedTo, 'complaint')}
                        </span>
                      </div>
                    )}
                    
                    {order.technicianId && order.type === 'job' && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-400">Service Provider:</span>
                        <span className="text-xs text-blue-600 font-medium">
                          {getTechnicianName(order.technicianId, 'job')}
                        </span>
                      </div>
                    )}
                    
                    {activeTab === 'completed' && order.resolvedAt && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-gray-400">Completed:</span>
                        <span className="text-xs text-green-600 font-medium">
                          {new Date(order.resolvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Right: Work Order Details */}
        <div className="flex-1 p-2 md:p-6 overflow-y-auto">
          {!selectedOrder ? (
            <div className="text-gray-400 text-center mt-24">
              <div className="text-lg font-medium mb-2">Select a work order</div>
              <div className="text-sm text-gray-500">Choose a work order from the list to view and manage its details</div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
                             {/* Status Buttons */}
               {activeTab === 'active' && (
                 <div className="flex space-x-3 mb-6">
                                   <button
                  onClick={() => handleStatusChange('open')}
                  className={`flex-1 py-2 rounded-lg font-semibold transition-colors duration-150 ${(selectedOrder.status || '') === 'open' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-gray-300 hover:bg-blue-50'}`}
                >Open</button>
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  className={`flex-1 py-2 rounded-lg font-semibold border transition-colors duration-150 ${(selectedOrder.status || '') === 'in-progress' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-700 border-gray-300 hover:bg-orange-50'}`}
                >In Progress</button>
                   <button
                     onClick={() => handleStatusChange('ready-for-review')}
                     className={`flex-1 py-2 rounded-lg font-semibold border transition-colors duration-150 ${(selectedOrder.status || '') === 'ready-for-review' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-700 border-gray-300 hover:bg-orange-50'}`}
                   >Mark as Completed</button>
                 </div>
               )}
              
              {activeTab === 'ready-for-review' && (
                <div className="flex space-x-3 mb-6">
                  <button
                    onClick={() => handleStatusChange('in-progress')}
                    className="flex-1 py-2 rounded-lg font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >Back to In Progress</button>
                  <button
                    onClick={() => handleStatusChange('completed')}
                    className="flex-1 py-2 rounded-lg font-semibold border transition-colors duration-150 bg-green-600 text-white border-green-600 hover:bg-green-700"
                  >Confirm Completion</button>
                  <button
                    onClick={() => handleEdit(selectedOrder)}
                    className="flex-1 py-2 rounded-lg font-semibold border border-gray-400 bg-white text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >Edit</button>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-bold text-gray-900">{selectedOrder.title}</div>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
              
              <div className="mb-2 text-sm text-gray-500 capitalize">{selectedOrder.type} {selectedOrder.propertyUnit ? `| ${selectedOrder.propertyUnit}` : ''}</div>
              
              {selectedOrder.priority && (
                <div className="mb-2"><span className={`px-2 py-1 rounded-full text-xs font-medium ${selectedOrder.priority === 'high' ? 'bg-red-100 text-red-700' : selectedOrder.priority === 'critical' ? 'bg-red-100 text-red-700' : selectedOrder.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : selectedOrder.priority === 'low' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{selectedOrder.priority}</span></div>
              )}
              
              <div className="mb-4">
                <div className="font-medium text-gray-700 mb-1">Description</div>
                <div className="text-gray-900 text-sm">{selectedOrder.description || '-'}</div>
              </div>
              
                             <div className="mb-4">
                 <div className="font-medium text-gray-700 mb-1">Comment</div>
                 {activeTab === 'active' ? (
                   <div className="space-y-2">
                     <textarea
                       value={selectedOrder.comment || ''}
                       onChange={(e) => handleCommentChange(e.target.value)}
                       placeholder="Add a comment about this work order..."
                       className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[80px]"
                     />
                     <div className="text-xs text-gray-500">
                       Add a comment before marking as done
                     </div>
                   </div>
                 ) : (
                   <div className="bg-gray-50 rounded p-3 text-gray-900 text-sm min-h-[48px] whitespace-pre-line">
                     {selectedOrder.comment ? selectedOrder.comment : <span className="text-gray-400">No comment</span>}
                   </div>
                 )}
               </div>
               
               <div className="mb-4">
                 <div className="font-medium text-gray-700 mb-1">Photo</div>
                 {activeTab === 'active' ? (
                   <div className="space-y-2">
                     <input
                       type="file"
                       accept="image/*"
                       onChange={handlePhotoChange}
                       className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                     />
                     <div className="text-xs text-gray-500">
                       Upload a photo before marking as done
                     </div>
                     {selectedOrder?.photoUrl && (
                       <div className="flex justify-center items-center bg-gray-100 rounded-lg p-2">
                         <img src={selectedOrder.photoUrl} alt="Work Order Photo" className="max-h-32 rounded shadow" />
                       </div>
                     )}
                   </div>
                 ) : (
                   selectedOrder?.photoUrl ? (
                     <div className="flex justify-center items-center bg-gray-100 rounded-lg p-2">
                       <img src={selectedOrder.photoUrl} alt="Work Order Photo" className="max-h-64 rounded shadow" />
                     </div>
                   ) : (
                     <div className="text-gray-400 text-sm italic text-center bg-gray-50 rounded p-4">No photo uploaded</div>
                   )
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
                  <div className="font-medium text-gray-700 mb-1">
                    {selectedOrder.type === 'complaint' ? 'Technician' : 'Contact'}
                  </div>
                  <div className="text-gray-900 text-sm">
                    {getTechnicianName(selectedOrder?.assignedTo, 'complaint') || '-'}
                  </div>
                </div>
                {selectedOrder.type === 'job' && (
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Service Provider</div>
                    <div className="text-gray-900 text-sm">
                      {getTechnicianName(selectedOrder?.technicianId, 'job') || '-'}
                    </div>
                  </div>
                )}
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

               {/* Modal for Add/Edit/View Work Order */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold">
                 {modalType === 'add' ? 'Add Work Order' : 
                  modalType === 'edit' ? 'Edit Work Order' : 'View Work Order'}
               </h2>
               <button
                 onClick={() => setShowModal(false)}
                 className="text-gray-500 hover:text-gray-700"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>

             {errorMsg && (
               <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                 {errorMsg}
               </div>
             )}

                           <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Work Order Type</label>
                      <select
                        name="type"
                        value={form.type}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="job">Job</option>
                        <option value="complaint">Complaint</option>
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                      <select
                        name="title"
                        value={form.title}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        required
                      >
                        <option value="">Select Issue Type</option>
                        {workOrderTitles.map((title, index) => (
                          <option key={index} value={title.value}>
                            {title.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="Provide detailed description of the issue..."
                      />
                    </div>
                  </div>
                </div>

                {/* Status & Priority Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                    Status & Priority
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select Status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority Level</label>
                      <select
                        name="priority"
                        value={form.priority}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select Priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Location & Scheduling Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Location & Scheduling
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Property Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Unit</label>
                      <input
                        type="text"
                        name="propertyUnit"
                        value={form.propertyUnit}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="e.g., Unit 101, Floor 2"
                      />
                    </div>

                    {/* Scheduled Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                      <input
                        type="date"
                        name="scheduledDate"
                        value={form.scheduledDate}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        name="scheduledStart"
                        value={form.scheduledStart}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="time"
                        name="scheduledEnd"
                        value={form.scheduledEnd}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Assignment Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    Assignment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Assigned To (Technicians) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assign Contact</label>
                      <select
                        name="assignedTo"
                        value={form.assignedTo}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="">Select Technician</option>
                        {technicians.map(tech => (
                          <option key={tech.id} value={tech.id}>
                            {tech.full_name || tech.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Service Provider (Contacts) - Only for Jobs */}
                    {form.type === 'job' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Provider</label>
                        <select
                          name="technicianId"
                          value={form.technicianId}
                          onChange={handleFormChange}
                          disabled={modalType === 'view'}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select Service Provider</option>
                          {contacts.map(contact => (
                            <option key={contact.id} value={contact.id}>
                              {contact.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    Additional Information
                  </h3>
                  <div>
                    {/* Comment */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                      <textarea
                        name="comment"
                        value={form.comment}
                        onChange={handleFormChange}
                        disabled={modalType === 'view'}
                        rows={4}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="Add any additional comments, notes, or special instructions..."
                      />
                    </div>
                  </div>
                </div>

                             {/* Action Buttons */}
               {modalType !== 'view' && (
                 <div className="flex justify-center space-x-4 mt-8">
                   <button
                     type="button"
                     onClick={() => setShowModal(false)}
                     className="px-6 py-3 border-2 border-red-300 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200 font-medium"
                   >
                     Cancel
                   </button>
                   <button
                     type="submit"
                     disabled={loading}
                     className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200 font-medium shadow-sm"
                   >
                     {loading ? 'Saving...' : (modalType === 'add' ? 'Add Work Order' : 'Update Work Order')}
                   </button>
                 </div>
               )}

               {modalType === 'view' && (
                 <div className="flex justify-center mt-8">
                   <button
                     type="button"
                     onClick={() => setShowModal(false)}
                     className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium shadow-sm"
                   >
                     Close
                   </button>
                 </div>
               )}
            </form>
           </div>
         </div>
       )}
     </>
   );
 };
 
 export default Complaints; 