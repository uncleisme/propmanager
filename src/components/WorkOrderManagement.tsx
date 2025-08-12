import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { Edit, Plus, X, Search, Calendar, Clock, User, AlertTriangle, PlusCircle, Upload, Trash2 } from "lucide-react";
import { User as AuthUser } from '@supabase/supabase-js';
import { WorkOrder, WorkOrderHistory, Profile, Contact } from '../types';
import { createNotification } from "../utils/notifications";

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

interface WorkOrderDetailPanelProps {
  workOrder: WorkOrder;
  assets: Asset[];
  locations: Location[];
  profiles: Profile[];
  onEdit: (workOrder: WorkOrder) => void;
  onHistory: (workOrder: WorkOrder) => void;
  onStatusChange: (workOrderId: string, newStatus: string) => void;
  onPhotosChange: (workOrderId: string, files: File[]) => void;
  photos: { url: string; name: string }[];
}

// WorkOrderDetailPanel Component
const WorkOrderDetailPanel: React.FC<WorkOrderDetailPanelProps> = ({
  workOrder,
  assets,
  locations,
  profiles,
  onEdit,
  onHistory,
  onStatusChange,
  onPhotosChange,
  photos = []
}) => {
  const asset = assets.find(a => a.id === workOrder.asset_id);
  const location = locations.find(l => l.id === workOrder.location_id);
  const assignedProfile = profiles.find(p => p.id === workOrder.assigned_to);
  const requestedByProfile = profiles.find(p => p.id === workOrder.requested_by);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      onPhotosChange(workOrder.id, [...selectedFiles, ...filesArray]);
    }
  };

  const removePhoto = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onPhotosChange(workOrder.id, newFiles);
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'Review' && (photos.length === 0 && selectedFiles.length === 0)) {
      alert('Please add at least one photo before marking as Review');
      return;
    }
    onStatusChange(workOrder.id, newStatus);
  };

  const getWorkTypeColor = (workType: string) => {
    switch (workType) {
      case 'Preventive': return 'bg-green-100 text-green-800 border-green-200';
      case 'Complaint': return 'bg-red-100 text-red-800 border-red-200';
      case 'Job': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Repair': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Done': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-8 py-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-xs">
                  {workOrder.work_type.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {workOrder.work_order_id}
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  Created {new Date(workOrder.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getWorkTypeColor(workOrder.work_type)}`}>
                {workOrder.work_type}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getStatusColor(workOrder.status)}`}>
                {workOrder.status}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                workOrder.priority === 'High' ? 'bg-red-100 text-red-800 border border-red-200' :
                workOrder.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {workOrder.priority}
              </span>
            </div>
            {/* Action Buttons Row - Now below tags */}
            <div className="flex gap-2 mb-2">
              {/* Start button - always available */}
              <button
                onClick={() => handleStatusChange('In Progress')}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  workOrder.status === 'In Progress' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                }`}
              >
                Start
              </button>
              
              {/* Review button - disabled for completed tab, enabled for active tab, disabled for review tab */}
              <button
                onClick={() => handleStatusChange('Review')}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  workOrder.status === 'Review' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-purple-100'
                } ${(
                  (photos.length === 0 && selectedFiles.length === 0) || 
                  workOrder.status === 'Done' || 
                  workOrder.status === 'Review'
                ) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={(
                  (photos.length === 0 && selectedFiles.length === 0) || 
                  workOrder.status === 'Done' || 
                  workOrder.status === 'Review'
                )}
              >
                Review
              </button>
              
              {/* Done button - disabled for active tab and completed tab, enabled for review tab */}
              <button
                onClick={() => handleStatusChange('Done')}
                className={`px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                  workOrder.status === 'Done' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                } ${(
                  workOrder.status === 'Active' || 
                  workOrder.status === 'Done'
                ) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={(
                  workOrder.status === 'Active' || 
                  workOrder.status === 'Done'
                )}
              >
                Done
              </button>
              
              {/* Edit button - next to Done button */}
              <button
                onClick={() => onEdit(workOrder)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Edit size={10} />
                Edit
              </button>
              
              {/* History button - next to Edit button */}
              <button
                onClick={() => onHistory(workOrder)}
                className="px-2 py-1 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                <Clock size={10} />
                History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-8 space-y-8">
          {/* Title and Description */}
          <div>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                {workOrder.title}
              </h3>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed text-sm">{workOrder.description}</p>
              </div>
            </div>
          </div>

          {/* Key Information */}
          <div>
            <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Calendar size={12} className="text-indigo-600" />
              </div>
              Work Order Details
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h5 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Asset & Location</h5>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-semibold text-xs">A</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Asset</label>
                      <p className="text-gray-900 font-medium">{asset?.asset_name || 'Unknown Asset'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-semibold text-xs">L</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                      <p className="text-gray-900 font-medium">
                        {location ? `${location.block}-${location.floor}-${location.room}` : 'Unknown Location'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Calendar size={14} className="text-red-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Due Date</label>
                      <p className="text-gray-900 font-medium">{new Date(workOrder.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h5 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">People & Timeline</h5>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-purple-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Requested By</label>
                      <p className="text-gray-900 font-medium">{requestedByProfile?.full_name || 'Unknown User'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User size={14} className="text-orange-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Assigned To</label>
                      <p className="text-gray-900 font-medium">{assignedProfile?.full_name || 'Unassigned'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock size={14} className="text-gray-600" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                      <p className="text-gray-900 font-medium">{new Date(workOrder.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Upload Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Upload size={12} className="text-indigo-600" />
                </div>
                Photos
              </h4>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="-ml-0.5 mr-2 h-4 w-4" />
                Add Photos
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Display existing photos */}
              {photos.map((photo, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Work order photo ${index + 1}`}
                    className="h-24 w-full object-cover rounded-md border border-gray-200"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {/* Display newly selected files */}
              {selectedFiles.map((file, index) => (
                <div key={`new-${index}`} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New photo ${index + 1}`}
                    className="h-24 w-full object-cover rounded-md border border-gray-200"
                  />
                  <button
                    onClick={() => removePhoto(photos.length + index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              
              {/* Show message if no photos */}
              {photos.length === 0 && selectedFiles.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Upload size={48} className="mx-auto mb-2 text-gray-300" />
                  <p>No photos uploaded yet</p>
                  <p className="text-sm">Photos are required before marking as Review</p>
                </div>
              )}
            </div>
          </div>

          {/* Conditional Fields based on Work Type */}
          {workOrder.work_type === 'Preventive' && (
            <div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">P</span>
                  </div>
                  Preventive Maintenance Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {workOrder.recurrence_rule && (
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <label className="block text-sm font-semibold text-green-700 mb-2">Recurrence Pattern</label>
                      <p className="text-gray-900 font-medium">{workOrder.recurrence_rule}</p>
                    </div>
                  )}
                  {workOrder.recurrence_start_date && (
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <label className="block text-sm font-semibold text-green-700 mb-2">Start Date</label>
                      <p className="text-gray-900 font-medium">{new Date(workOrder.recurrence_start_date).toLocaleDateString()}</p>
                    </div>
                  )}
                  {workOrder.recurrence_end_date && (
                    <div className="bg-white rounded-lg p-4 border border-green-100">
                      <label className="block text-sm font-semibold text-green-700 mb-2">End Date</label>
                      <p className="text-gray-900 font-medium">{new Date(workOrder.recurrence_end_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {workOrder.work_type === 'Job' && (
            <div>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">J</span>
                  </div>
                  Job Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {workOrder.job_type && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Job Type</label>
                      <p className="text-gray-900 font-medium">{workOrder.job_type}</p>
                    </div>
                  )}
                  {workOrder.contact_person && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Contact Person</label>
                      <p className="text-gray-900 font-medium">{workOrder.contact_person}</p>
                    </div>
                  )}
                  {workOrder.contact_number && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Contact Number</label>
                      <p className="text-gray-900 font-medium">{workOrder.contact_number}</p>
                    </div>
                  )}
                  {workOrder.contact_email && (
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <label className="block text-sm font-semibold text-blue-700 mb-2">Contact Email</label>
                      <p className="text-gray-900 font-medium">{workOrder.contact_email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {workOrder.work_type === 'Repair' && (
            <div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">R</span>
                  </div>
                  Repair Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {workOrder.unit_number && (
                    <div className="bg-white rounded-lg p-4 border border-orange-100">
                      <label className="block text-sm font-semibold text-orange-700 mb-2">Unit Number</label>
                      <p className="text-gray-900 font-medium">{workOrder.unit_number}</p>
                    </div>
                  )}
                  {workOrder.repair_contact_person && (
                    <div className="bg-white rounded-lg p-4 border border-orange-100">
                      <label className="block text-sm font-semibold text-orange-700 mb-2">Contact Person</label>
                      <p className="text-gray-900 font-medium">{workOrder.repair_contact_person}</p>
                    </div>
                  )}
                  {workOrder.repair_contact_number && (
                    <div className="bg-white rounded-lg p-4 border border-orange-100">
                      <label className="block text-sm font-semibold text-orange-700 mb-2">Contact Number</label>
                      <p className="text-gray-900 font-medium">{workOrder.repair_contact_number}</p>
                    </div>
                  )}
                  {workOrder.repair_contact_email && (
                    <div className="bg-white rounded-lg p-4 border border-orange-100">
                      <label className="block text-sm font-semibold text-orange-700 mb-2">Contact Email</label>
                      <p className="text-gray-900 font-medium">{workOrder.repair_contact_email}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  
  // Panel state for two-column layout
  const [selectedWorkOrderForPanel, setSelectedWorkOrderForPanel] = useState<WorkOrder | null>(null);
  
  // Photo state
  const [workOrderPhotos, setWorkOrderPhotos] = useState<Record<string, { url: string; name: string }[]>>({});
  
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
        
        const { data: insertedData, error } = await supabase
          .from('work_orders')
          .insert([{
            ...workOrderData,
            work_order_id: workOrderIdData
          }])
          .select()
          .single();

        if (error) throw error;

        // Create notification for work order creation
        try {
          await createNotification(
            user.id,
            'Work Orders',
            'created',
            insertedData.id,
            `Work order "${workOrderIdData}" has been created`,
            [user.id]
          );
          console.log('Work order creation notification created successfully');
        } catch (notificationError) {
          console.error('Error creating work order creation notification:', notificationError);
        }

        alert('Work order created successfully!');
      } else if (modalType === 'edit' && selectedWorkOrder) {
        const { error } = await supabase
          .from('work_orders')
          .update({ ...workOrderData, updated_at: new Date().toISOString() })
          .eq('id', selectedWorkOrder.id);

        if (error) throw error;

        // Create notification for work order update
        try {
          await createNotification(
            user.id,
            'Work Orders',
            'updated',
            selectedWorkOrder.id,
            `Work order "${selectedWorkOrder.work_order_id}" has been updated`,
            [user.id]
          );
          console.log('Work order update notification created successfully');
        } catch (notificationError) {
          console.error('Error creating work order update notification:', notificationError);
        }

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
      // Get work order details before deletion for notification
      const { data: workOrderData, error: fetchError } = await supabase
        .from('work_orders')
        .select('work_order_id, title')
        .eq('id', workOrderId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', workOrderId);

      if (error) throw error;

      // Create notification for work order deletion
      if (user) {
        try {
          await createNotification(
            user.id,
            'Work Orders',
            'deleted',
            workOrderId,
            `Work order "${workOrderData.work_order_id}" has been deleted`,
            [user.id]
          );
          console.log('Work order deletion notification created successfully');
        } catch (notificationError) {
          console.error('Error creating work order deletion notification:', notificationError);
        }
      }

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

  // Handle work order selection for right panel
  const handleWorkOrderSelect = (workOrder: WorkOrder) => {
    setSelectedWorkOrderForPanel(workOrder);
  };

  // Handle status change
  const handleStatusChangeMain = async (workOrderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('work_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', workOrderId);

      if (error) throw error;

      // Refresh work orders
      fetchWorkOrders();
      
      // Update selected work order if it's the one being changed
      if (selectedWorkOrderForPanel?.id === workOrderId) {
        setSelectedWorkOrderForPanel({
          ...selectedWorkOrderForPanel,
          status: newStatus
        });
      }
      
      // Show success message
      alert(`Work order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating work order status:', error);
      alert('Failed to update work order status');
    }
  };

  // Handle photo uploads
  const handlePhotosChangeMain = async (workOrderId: string, files: File[]) => {
    // In a real app, you would upload these files to storage
    // For now, we'll just store them in state
    const newPhotos = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));
    
    setWorkOrderPhotos(prev => ({
      ...prev,
      [workOrderId]: newPhotos
    }));
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(workOrderPhotos).forEach(photos => {
        photos.forEach(photo => {
          URL.revokeObjectURL(photo.url);
        });
      });
    };
  }, [workOrderPhotos]);

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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b bg-white">
        <h1 className="text-2xl font-bold">Work Order Management</h1>
        <button
          onClick={() => openModal("add")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700"
        >
          <Plus size={18} className="mr-2" />
          Add Work Order
        </button>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Work Order List */}
        <div className="w-2/5 border-r bg-white flex flex-col overflow-hidden">
          {/* Left Panel Header with Search and Filters */}
          <div className="p-4 border-b flex-shrink-0">
            {/* Due Soon Notifications */}
            {workOrders.filter(wo => isDueSoon(wo.due_date)).length > 0 && (
              <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded-md">
                <div className="flex items-center">
                  <AlertTriangle className="text-yellow-500 mr-2" size={16} />
                  <span className="text-sm font-medium text-yellow-800">
                    {workOrders.filter(wo => isDueSoon(wo.due_date)).length} work order(s) due within 3 days
                  </span>
                </div>
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search work orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={filterWorkType}
                  onChange={(e) => setFilterWorkType(e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1"
                >
                  <option value="">All Types</option>
                  <option value="Preventive">Preventive</option>
                  <option value="Complaint">Complaint</option>
                  <option value="Job">Job</option>
                  <option value="Repair">Repair</option>
                </select>
                
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1"
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="-mb-px flex">
              {[
                { key: 'active', label: 'Active', count: workOrders.filter(wo => wo.status === 'Active' || wo.status === 'In Progress').length },
                { key: 'review', label: 'Review', count: workOrders.filter(wo => wo.status === 'Review').length },
                { key: 'completed', label: 'Completed', count: workOrders.filter(wo => wo.status === 'Done').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-4 text-sm font-medium border-b-2 ${
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

          {/* Work Order List */}
          <div className="flex-1 overflow-y-auto">
            {filteredWorkOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No work orders found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredWorkOrders.map((workOrder) => {
                  const asset = assets.find(a => a.id === workOrder.asset_id);
                  const location = locations.find(l => l.id === workOrder.location_id);
                  const assignedProfile = profiles.find(p => p.id === workOrder.assigned_to);
                  
                  return (
                    <div
                      key={workOrder.id}
                      onClick={() => handleWorkOrderSelect(workOrder)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedWorkOrderForPanel?.id === workOrder.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 truncate">
                              {workOrder.work_order_id}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full border ${
                              workOrder.work_type === 'Preventive' ? 'bg-green-100 text-green-800 border-green-200' :
                              workOrder.work_type === 'Complaint' ? 'bg-red-100 text-red-800 border-red-200' :
                              workOrder.work_type === 'Job' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              'bg-orange-100 text-orange-800 border-orange-200'
                            }`}>
                              {workOrder.work_type}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              workOrder.priority === 'High' ? 'bg-red-100 text-red-800' :
                              workOrder.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {workOrder.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              workOrder.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                              workOrder.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                              workOrder.status === 'Review' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {workOrder.status}
                            </span>
                            {isNewWorkOrder(workOrder.created_at) && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1 truncate">
                            {workOrder.title}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Asset: {asset?.asset_name || 'Unknown'}</span>
                            <span>Due: {new Date(workOrder.due_date).toLocaleDateString()}</span>
                            {isDueSoon(workOrder.due_date) && (
                              <span className="text-red-600 font-medium">Due Soon!</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Work Order Details */}
        <div className="flex-1 bg-gray-50 flex flex-col h-full overflow-hidden">
          {selectedWorkOrderForPanel ? (
            <WorkOrderDetailPanel 
              workOrder={selectedWorkOrderForPanel}
              assets={assets}
              locations={locations}
              profiles={profiles}
              onEdit={(workOrder) => openModal('edit', workOrder)}
              onHistory={(workOrder) => openHistoryModal(workOrder)}
              onStatusChange={handleStatusChangeMain}
              onPhotosChange={handlePhotosChangeMain}
              photos={workOrderPhotos[selectedWorkOrderForPanel.id] || []}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center p-12">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="text-4xl">📋</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a Work Order</h3>
                <p className="text-gray-600 mb-6 max-w-sm">Click on any work order from the list to view its detailed information, including description, timeline, and specific requirements.</p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Review</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span>Completed</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


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
                {modalType === 'edit' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
                        await handleDelete(selectedWorkOrder?.id || '');
                        setShowModal(false);
                      }
                    }}
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
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
      