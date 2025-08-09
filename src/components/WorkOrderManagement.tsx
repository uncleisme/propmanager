import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { Eye, Edit, Trash2, Plus, X, Search, Calendar, Clock, User, AlertTriangle } from "lucide-react";
import { User as AuthUser } from '@supabase/supabase-js';
import { WorkOrder, WorkOrderHistory, Profile, Contact } from '../types';

interface WorkOrderManagementProps {
  user: AuthUser | null;
}

interface Asset {
  id: string;
  asset_name: string;
  location_id: string;
}

interface Location {
  id: string;
  location_id: string;
  name: string;
  block: string;
  floor: string;
  room: string;
}

const WorkOrderManagement: React.FC<WorkOrderManagementProps> = ({ user }) => {
  // Core state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  
  // UI state
  const [activeTab, setActiveTab] = useState<"active" | "review" | "completed">("active");
  const [search, setSearch] = useState("");
  
  // Filter state
  const [filterWorkType, setFilterWorkType] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  
  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [workOrderHistory, setWorkOrderHistory] = useState<WorkOrderHistory[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<Partial<WorkOrder>>({
    work_type: 'Complaint',
    asset_id: '',
    status: 'Active',
    priority: 'Medium',
    title: '',
    description: '',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assigned_to: '',
    job_type: 'Maintenance',
    unit_number: '',
    recurrence_rule: '',
    recurrence_start_date: '',
    recurrence_end_date: '',
    service_provider_id: '',
    contact_person: '',
    contact_number: '',
    contact_email: '',
    reference_text: '',
    repair_contact_person: '',
    repair_contact_number: '',
    repair_contact_email: '',
  });

  // Fetch functions
  const fetchAssets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('id, asset_name, location_id')
        .order('asset_name');
      
      if (error) throw error;
      setAssets(data || []);
    } catch (error: any) {
      console.error('Failed to load assets:', error);
    }
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, location_id, name, block, floor, room')
        .order('block');
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error('Failed to load locations:', error);
    }
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, type, avatar_url, created_at, updated_at')
        .order('full_name');
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Failed to load profiles:', error);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, company, email, phone, type, address, createdAt')
        .eq('type', 'serviceProvider')
        .order('name');
      
      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Failed to load contacts:', error);
    }
  }, []);

  const fetchWorkOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('work_orders')
        .select('*');

      // Apply search filter
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,work_order_id.ilike.%${search}%`);
      }

      // Apply filters
      if (filterWorkType) {
        query = query.eq('work_type', filterWorkType);
      }
      
      if (filterPriority) {
        query = query.eq('priority', filterPriority);
      }

      const { data, error } = await query.order('created_date', { ascending: false });
      
      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to load work orders.");
    } finally {
      setLoading(false);
    }
  }, [search, filterWorkType, filterPriority]);

  // Initialize data on component mount
  useEffect(() => {
    fetchAssets();
    fetchLocations();
    fetchProfiles();
    fetchContacts();
    fetchWorkOrders();
  }, [fetchAssets, fetchLocations, fetchProfiles, fetchContacts, fetchWorkOrders]);

  // Utility functions
  const isNewWorkOrder = (createdDate: string) => {
    const created = new Date(createdDate);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  const isDueSoon = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffInDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 3 && diffInDays >= 0;
  };

  // Filter work orders by tab
  const getFilteredWorkOrders = () => {
    switch (activeTab) {
      case "active":
        return workOrders.filter(wo => wo.status === 'Active' || wo.status === 'In Progress');
      case "review":
        return workOrders.filter(wo => wo.status === 'Review');
      case "completed":
        return workOrders.filter(wo => wo.status === 'Done');
      default:
        return workOrders;
    }
  };

  // Modal and form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : value
    }));

    // Auto-fill location when asset is selected
    if (name === 'asset_id' && value) {
      const selectedAsset = assets.find(asset => asset.id === value);
      if (selectedAsset) {
        setFormData(prev => ({
          ...prev,
          location_id: selectedAsset.location_id
        }));
      }
    }

    // Auto-fill contact details when service provider is selected
    if (name === 'service_provider_id' && value) {
      const selectedContact = contacts.find(contact => contact.id === value);
      if (selectedContact) {
        setFormData(prev => ({
          ...prev,
          contact_person: selectedContact.name,
          contact_number: selectedContact.phone,
          contact_email: selectedContact.email
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title?.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (!formData.due_date) {
      alert('Please select a due date');
      return;
    }
    
    if (!formData.asset_id) {
      alert('Please select an asset');
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to continue');
        return;
      }

      // Prepare work order data - convert empty strings to null for optional fields
      const workOrderData = {
        ...formData,
        // Convert empty date strings to null
        recurrence_start_date: formData.recurrence_start_date || null,
        recurrence_end_date: formData.recurrence_end_date || null,
        next_scheduled_date: formData.next_scheduled_date || null,
        // Convert empty string fields to null for optional fields
        assigned_to: formData.assigned_to || null,
        service_provider_id: formData.service_provider_id || null,
        recurrence_rule: formData.recurrence_rule || null,
        job_type: formData.job_type || null,
        contact_person: formData.contact_person || null,
        contact_number: formData.contact_number || null,
        contact_email: formData.contact_email || null,
        reference_text: formData.reference_text || null,
        unit_number: formData.unit_number || null,
        repair_contact_person: formData.repair_contact_person || null,
        repair_contact_number: formData.repair_contact_number || null,
        repair_contact_email: formData.repair_contact_email || null,
        requested_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (modalType === 'add') {
        // Generate work order ID using the database function
        const { data: workOrderIdData, error: idError } = await supabase
          .rpc('generate_work_order_id');
        
        if (idError) throw idError;
        
        const { error } = await supabase
          .from('work_orders')
          .insert([{
            ...workOrderData,
            work_order_id: workOrderIdData
          }]);

        if (error) throw error;
        alert('Work order created successfully!');
      } else if (modalType === 'edit' && selectedWorkOrder) {
        const { error } = await supabase
          .from('work_orders')
          .update({ ...workOrderData, updated_at: new Date().toISOString() })
          .eq('id', selectedWorkOrder.id);

        if (error) throw error;
        alert('Work order updated successfully!');
      }

      setShowModal(false);
      setFormData({
        work_type: 'Complaint',
        asset_id: '',
        status: 'Active',
        priority: 'Medium',
        title: '',
        description: '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to 7 days from now
      });
      fetchWorkOrders();
    } catch (error) {
      console.error('Error saving work order:', error);
      alert('Error saving work order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workOrderId: string) => {
    if (!confirm('Are you sure you want to delete this work order?')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', workOrderId);

      if (error) throw error;
      alert('Work order deleted successfully!');
      fetchWorkOrders();
    } catch (error) {
      console.error('Error deleting work order:', error);
      alert('Error deleting work order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkOrderHistory = async (workOrderId: string) => {
    try {
      const { data, error } = await supabase
        .from('work_order_history')
        .select(`
          *,
          changed_by_profile:profiles!performed_by(full_name)
        `)
        .eq('work_order_id', workOrderId)
        .order('performed_at', { ascending: false });

      if (error) throw error;
      setWorkOrderHistory(data || []);
    } catch (error) {
      console.error('Error fetching work order history:', error);
      setWorkOrderHistory([]);
    }
  };

  const openHistoryModal = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setShowHistoryModal(true);
    fetchWorkOrderHistory(workOrder.id);
  };

  // Open modal for adding/editing/viewing
  const openModal = (type: "add" | "edit" | "view", workOrder: WorkOrder | null = null) => {
    setModalType(type);
    setSelectedWorkOrder(workOrder);
    setErrorMsg("");
    
    if (workOrder) {
      setFormData({
        work_type: workOrder.work_type,
        asset_id: workOrder.asset_id,
        location_id: workOrder.location_id,
        status: workOrder.status,
        priority: workOrder.priority,
        title: workOrder.title,
        description: workOrder.description,
        due_date: workOrder.due_date,
        assigned_to: workOrder.assigned_to,
        job_type: workOrder.job_type || 'Maintenance',
        service_provider_id: workOrder.service_provider_id || '',
        contact_person: workOrder.contact_person || '',
        contact_number: workOrder.contact_number || '',
        contact_email: workOrder.contact_email || '',
        reference_text: workOrder.reference_text || '',
        unit_number: workOrder.unit_number || '',
        repair_contact_person: workOrder.repair_contact_person || '',
        repair_contact_number: workOrder.repair_contact_number || '',
        repair_contact_email: workOrder.repair_contact_email || '',
        recurrence_rule: workOrder.recurrence_rule || '',
        recurrence_start_date: workOrder.recurrence_start_date || '',
        recurrence_end_date: workOrder.recurrence_end_date || '',
      });
    } else {
      setFormData({
        work_type: 'Complaint',
        asset_id: '',
        status: 'Active',
        priority: 'Medium',
        title: '',
        description: '',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: '',
        job_type: 'Maintenance',
        unit_number: '',
        recurrence_rule: '',
        recurrence_start_date: '',
        recurrence_end_date: '',
        service_provider_id: '',
        contact_person: '',
        contact_number: '',
        contact_email: '',
        reference_text: '',
        repair_contact_person: '',
        repair_contact_number: '',
        repair_contact_email: '',
      });
    }
    setShowModal(true);
  };

  const filteredWorkOrders = getFilteredWorkOrders();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Work Order Management</h1>
        <button
          onClick={() => openModal("add")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" />
          Add Work Order
        </button>
      </div>

      {/* Due Soon Notifications */}
      {workOrders.filter(wo => isDueSoon(wo.due_date)).length > 0 && (
        <div className="mb-6 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-500 mr-2" size={20} />
            <span className="font-medium text-yellow-800">
              {workOrders.filter(wo => isDueSoon(wo.due_date)).length} work order(s) due within 3 days
            </span>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search work orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterWorkType}
          onChange={(e) => setFilterWorkType(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Work Types</option>
          <option value="Preventive">Preventive</option>
          <option value="Complaint">Complaint</option>
          <option value="Job">Job</option>
          <option value="Repair">Repair</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'active', label: 'Active', count: workOrders.filter(wo => wo.status === 'Active' || wo.status === 'In Progress').length },
              { key: 'review', label: 'For Review', count: workOrders.filter(wo => wo.status === 'Review').length },
              { key: 'completed', label: 'Completed', count: workOrders.filter(wo => wo.status === 'Done').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {errorMsg}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Work Orders Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkOrders.length > 0 ? (
            filteredWorkOrders.map((workOrder) => (
              <div key={workOrder.id} className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{workOrder.title}</h3>
                        {isNewWorkOrder(workOrder.created_date) && (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{workOrder.work_order_id}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      workOrder.priority === 'High' 
                        ? 'bg-red-100 text-red-800'
                        : workOrder.priority === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {workOrder.priority}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar size={16} className="mr-2" />
                      Due: {new Date(workOrder.due_date).toLocaleDateString()}
                      {isDueSoon(workOrder.due_date) && (
                        <AlertTriangle size={16} className="ml-2 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      workOrder.status === 'Active' 
                        ? 'bg-blue-100 text-blue-800'
                        : workOrder.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : workOrder.status === 'Review'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {workOrder.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {workOrder.work_type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {workOrder.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openModal("view", workOrder)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => openModal("edit", workOrder)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900"
                        title="History"
                        onClick={() => openHistoryModal(workOrder)}
                      >
                        <Clock size={18} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                        onClick={() => handleDelete(workOrder.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No work orders found.</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit/View Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {modalType === 'add' ? 'Add New Work Order' : modalType === 'edit' ? 'Edit Work Order' : 'Work Order Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Work Order ID (read-only for edit/view) */}
                {modalType !== 'add' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Order ID
                    </label>
                    <input
                      type="text"
                      value={selectedWorkOrder?.work_order_id || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                )}

                {/* Work Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Type *
                  </label>
                  <select
                    name="work_type"
                    value={formData.work_type || ''}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Job">Job</option>
                    <option value="Repair">Repair</option>
                  </select>
                </div>

                {/* Asset */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset *
                  </label>
                  <select
                    name="asset_id"
                    value={formData.asset_id || ''}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Asset</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.asset_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location (auto-filled) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <select
                    name="location_id"
                    value={formData.location_id || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  >
                    <option value="">Auto-filled from asset</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} - Block {location.block}, Floor {location.floor}, Room {location.room}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status || ''}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority || ''}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {/* Assigned To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <select
                    name="assigned_to"
                    value={formData.assigned_to || ''}
                    onChange={handleInputChange}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Assignee</option>
                    {profiles.map(profile => (
                      <option key={profile.id} value={profile.id}>
                        {profile.full_name} ({profile.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Conditional Fields based on Work Type */}
                {formData.work_type === 'Preventive' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Recurrence Rule (RRULE)
                      </label>
                      <input
                        type="text"
                        name="recurrence_rule"
                        value={formData.recurrence_rule || ''}
                        onChange={handleInputChange}
                        placeholder="e.g., FREQ=MONTHLY;INTERVAL=1"
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date of Recurrence
                      </label>
                      <input
                        type="date"
                        name="recurrence_start_date"
                        value={formData.recurrence_start_date || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date of Recurrence
                      </label>
                      <input
                        type="date"
                        name="recurrence_end_date"
                        value={formData.recurrence_end_date || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                {formData.work_type === 'Job' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Type
                      </label>
                      <select
                        name="job_type"
                        value={formData.job_type || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Cleaning">Cleaning</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Repair">Repair</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Provider
                      </label>
                      <select
                        name="service_provider_id"
                        value={formData.service_provider_id || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Service Provider</option>
                        {contacts.map(contact => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name} - {contact.company}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="contact_person"
                        value={formData.contact_person || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        placeholder="Auto-filled from service provider"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="contact_number"
                        value={formData.contact_number || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        placeholder="Auto-filled from service provider"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        name="contact_email"
                        value={formData.contact_email || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        placeholder="Auto-filled from service provider"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reference
                      </label>
                      <input
                        type="text"
                        name="reference_text"
                        value={formData.reference_text || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Reference information"
                      />
                    </div>
                  </>
                )}

                {formData.work_type === 'Repair' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Number
                      </label>
                      <input
                        type="text"
                        name="unit_number"
                        value={formData.unit_number || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        name="repair_contact_person"
                        value={formData.repair_contact_person || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        name="repair_contact_number"
                        value={formData.repair_contact_number || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        name="repair_contact_email"
                        value={formData.repair_contact_email || ''}
                        onChange={handleInputChange}
                        disabled={modalType === 'view'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                {modalType !== 'view' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : modalType === 'add' ? 'Create Work Order' : 'Update Work Order'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Work Order History - {selectedWorkOrder?.work_order_id}
              </h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {workOrderHistory.length > 0 ? (
                workOrderHistory.map((history) => (
                  <div key={history.id} className="border-l-4 border-blue-500 pl-4 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {history.action}
                        </p>
                        <p className="text-sm text-gray-600">
                          by {history.changed_by_profile?.full_name || 'Unknown User'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(history.performed_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {history.description}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No history found for this work order.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderManagement;
