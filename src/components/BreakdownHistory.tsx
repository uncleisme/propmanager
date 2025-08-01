import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { BreakdownHistory, LiftMaintenance, Profile } from '../types';
import { 
  Plus, Search, Edit, Trash2, Eye, Calendar, Clock, User as UserIcon, 
  FileText, X, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle,
  ArrowLeft, Upload, Download
} from 'lucide-react';

interface BreakdownHistoryProps {
  user: any;
  onBack: () => void;
}

const BreakdownHistory: React.FC<BreakdownHistoryProps> = ({ user, onBack }) => {
  const [breakdowns, setBreakdowns] = useState<BreakdownHistory[]>([]);
  const [lifts, setLifts] = useState<LiftMaintenance[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<BreakdownHistory | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalBreakdowns, setTotalBreakdowns] = useState(0);


  // Form state
  const [formData, setFormData] = useState({
    liftId: '',
    breakdownDate: '',
    breakdownTime: '',
    attendedDate: '',
    attendedTime: '',
    reason: 'hardware' as 'hardware' | 'system' | 'power-failure' | 'others',
    technicianId: '',
    attachmentFile: null as File | null
  });

  const fetchBreakdowns = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('breakdown_history')
        .select('*')
        .order('createdAt', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        liftId: row.liftId,
        breakdownDate: row.breakdownDate,
        breakdownTime: row.breakdownTime,
        attendedDate: row.attendedDate,
        attendedTime: row.attendedTime,
        reason: row.reason,
        technicianId: row.technicianId,
        attachmentUrl: row.attachmentUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      }));

      setBreakdowns(mapped);

      // Get total count
      const { count } = await supabase
        .from('breakdown_history')
        .select('*', { count: 'exact', head: true });

      setTotalBreakdowns(count || 0);
    } catch (error) {
      console.error('Error fetching breakdowns:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const fetchLifts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('lift_maintenance')
        .select('id, assetName')
        .order('assetName');

      if (error) throw error;
      setLifts((data || []) as LiftMaintenance[]);
    } catch (error) {
      console.error('Error fetching lifts:', error);
    }
  }, []);

  const fetchTechnicians = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('type', 'technician')
        .order('full_name');

      if (error) throw error;
      setTechnicians((data || []) as Profile[]);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  }, []);

  useEffect(() => {
    fetchBreakdowns();
    fetchLifts();
    fetchTechnicians();
  }, [fetchBreakdowns, fetchLifts, fetchTechnicians]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.liftId || !formData.breakdownDate || !formData.breakdownTime || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      let attachmentUrl = null;
      
      // Handle file upload if there's a file
      if (formData.attachmentFile) {
        const fileName = `breakdown_${Date.now()}_${formData.attachmentFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('breakdown-reports')
          .upload(fileName, formData.attachmentFile);

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('breakdown-reports')
          .getPublicUrl(fileName);
        
        attachmentUrl = urlData.publicUrl;
      }

      const breakdownData = {
        liftId: parseInt(formData.liftId),
        breakdownDate: formData.breakdownDate,
        breakdownTime: formData.breakdownTime,
        attendedDate: formData.attendedDate || null,
        attendedTime: formData.attendedTime || null,
        reason: formData.reason,
        technicianId: formData.technicianId || null,
        attachmentUrl
      };

      if (modalType === 'add') {
        const { error } = await supabase
          .from('breakdown_history')
          .insert(breakdownData);

        if (error) throw error;
      } else if (modalType === 'edit' && selectedBreakdown) {
        const { error } = await supabase
          .from('breakdown_history')
          .update(breakdownData)
          .eq('id', selectedBreakdown.id);

        if (error) throw error;
      }

      setShowModal(false);
      setModalType(null);
      setSelectedBreakdown(null);
      resetForm();
      fetchBreakdowns();
    } catch (error) {
      console.error('Error saving breakdown:', error);
      alert('Failed to save breakdown');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this breakdown record?')) return;

    try {
      const { error } = await supabase
        .from('breakdown_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBreakdowns();
    } catch (error) {
      console.error('Error deleting breakdown:', error);
      alert('Failed to delete breakdown');
    }
  };

  const resetForm = () => {
    setFormData({
      liftId: '',
      breakdownDate: '',
      breakdownTime: '',
      attendedDate: '',
      attendedTime: '',
      reason: 'hardware',
      technicianId: '',
      attachmentFile: null
    });
  };

  const openModal = (type: 'add' | 'edit' | 'view', breakdown?: BreakdownHistory) => {
    setModalType(type);
    setSelectedBreakdown(breakdown || null);
    
    if (type === 'add') {
      resetForm();
    } else if (breakdown) {
      setFormData({
        liftId: breakdown.liftId.toString(),
        breakdownDate: breakdown.breakdownDate,
        breakdownTime: breakdown.breakdownTime,
        attendedDate: breakdown.attendedDate || '',
        attendedTime: breakdown.attendedTime || '',
        reason: breakdown.reason,
        technicianId: breakdown.technicianId || '',
        attachmentFile: null
      });
    }
    
    setShowModal(true);
  };

  const filteredBreakdowns = breakdowns.filter(breakdown => {
    const lift = lifts.find(l => l.id === breakdown.liftId.toString());
    const technician = technicians.find(t => t.id === breakdown.technicianId);
    
    return (
      lift?.assetName.toLowerCase().includes(search.toLowerCase()) ||
      breakdown.reason.toLowerCase().includes(search.toLowerCase()) ||
      technician?.full_name.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalPages = Math.ceil(totalBreakdowns / pageSize);

  const getLiftName = (liftId: number) => {
    const lift = lifts.find(l => l.id === liftId.toString());
    return lift?.assetName || `Lift ${liftId}`;
  };

  const getTechnicianName = (technicianId?: string) => {
    if (!technicianId) return 'Not assigned';
    const technician = technicians.find(t => t.id === technicianId);
    return technician?.full_name || 'Unknown';
  };

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'hardware': return 'bg-red-100 text-red-800';
      case 'system': return 'bg-blue-100 text-blue-800';
      case 'power-failure': return 'bg-yellow-100 text-yellow-800';
      case 'others': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="text-center md:text-left">
          <div className="flex items-center mb-2">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Breakdown History</h1>
          </div>
          <p className="text-gray-600">Track lift breakdowns and repairs</p>
        </div>
        <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-4 md:space-y-0 md:space-x-4">
          <button
            onClick={() => openModal('add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Breakdown</span>
          </button>
        </div>
      </div>



      {/* Search Bar */}
      <div className="relative w-full max-w-md mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by lift, reason, or technician..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

            {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Lift
                </th>
                                 <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                   Breakdown Date
                 </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Reason
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Technician
                </th>
                                 <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                   Status
                 </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-12 whitespace-nowrap text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-500">Loading breakdowns...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBreakdowns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-12 whitespace-nowrap text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">No breakdown records found</div>
                      <div className="text-sm">Try adjusting your search or add a new breakdown</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBreakdowns.map((breakdown) => (
                  <tr key={breakdown.id} className="hover:bg-gray-50 transition-colors duration-150">
                    {/* Lift */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap w-1/4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={getLiftName(breakdown.liftId)}>
                        {getLiftName(breakdown.liftId)}
                      </div>
                      {/* Mobile-only status indicator */}
                      <div className="text-xs text-gray-500 mt-1 md:hidden">
                        {breakdown.attendedDate ? (
                          <div className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                            <span className="text-xs text-green-600">Attended</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <AlertTriangle className="w-3 h-3 text-yellow-500 mr-1" />
                            <span className="text-xs text-yellow-600">Pending</span>
                          </div>
                        )}
                      </div>
                    </td>

                                         {/* Breakdown Date */}
                     <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap w-1/6">
                       <div className="text-sm text-gray-900">
                         {new Date(breakdown.breakdownDate).toLocaleDateString()}
                       </div>
                       <div className="text-sm text-gray-500">
                         {breakdown.breakdownTime}
                       </div>
                     </td>

                    {/* Reason */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getReasonColor(breakdown.reason)}`}>
                        {breakdown.reason.replace('-', ' ')}
                      </span>
                    </td>

                    {/* Technician */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={getTechnicianName(breakdown.technicianId)}>
                        {getTechnicianName(breakdown.technicianId)}
                      </div>
                    </td>

                                         {/* Status */}
                     <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                       {breakdown.attendedDate ? (
                         <div className="flex items-center">
                           <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                           <span className="text-sm text-green-600">Attended</span>
                         </div>
                       ) : (
                         <div className="flex items-center">
                           <AlertTriangle className="w-4 h-4 text-yellow-500 mr-1" />
                           <span className="text-sm text-yellow-600">Pending</span>
                         </div>
                       )}
                     </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap text-right text-sm font-medium w-24">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openModal('view', breakdown)}
                          className="p-1 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', breakdown)}
                          className="p-1 sm:p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-md transition-colors duration-150"
                          title="Edit Breakdown"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(breakdown.id)}
                          className="p-1 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-150"
                          title="Delete Breakdown"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalBreakdowns)} of {totalBreakdowns} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {modalType === 'add' ? 'Add Breakdown' : modalType === 'edit' ? 'Edit Breakdown' : 'View Breakdown'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setModalType(null);
                  setSelectedBreakdown(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lift *
                  </label>
                  <select
                    value={formData.liftId}
                    onChange={(e) => setFormData({ ...formData, liftId: e.target.value })}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Lift</option>
                    {lifts.map((lift) => (
                      <option key={lift.id} value={lift.id}>
                        {lift.assetName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason *
                  </label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="hardware">Hardware</option>
                    <option value="system">System</option>
                    <option value="power-failure">Power Failure</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breakdown Date *
                  </label>
                  <input
                    type="date"
                    value={formData.breakdownDate}
                    onChange={(e) => setFormData({ ...formData, breakdownDate: e.target.value })}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Breakdown Time *
                  </label>
                  <input
                    type="time"
                    value={formData.breakdownTime}
                    onChange={(e) => setFormData({ ...formData, breakdownTime: e.target.value })}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attended Date
                  </label>
                  <input
                    type="date"
                    value={formData.attendedDate}
                    onChange={(e) => setFormData({ ...formData, attendedDate: e.target.value })}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attended Time
                  </label>
                  <input
                    type="time"
                    value={formData.attendedTime}
                    onChange={(e) => setFormData({ ...formData, attendedTime: e.target.value })}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Technician
                  </label>
                  <select
                    value={formData.technicianId}
                    onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Technician</option>
                    {technicians.map((technician) => (
                      <option key={technician.id} value={technician.id}>
                        {technician.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Attachment
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFormData({ ...formData, attachmentFile: e.target.files?.[0] || null })}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only PDF files are allowed</p>
                </div>
              </div>

              {modalType !== 'view' && (
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setModalType(null);
                      setSelectedBreakdown(null);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    {modalType === 'add' ? 'Add Breakdown' : 'Update Breakdown'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreakdownHistory; 