import React, { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Clock, CheckCircle, Edit, X, Eye, Wrench } from 'lucide-react';
import { Complaint } from '../types';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useScheduler } from './SchedulerContext';

interface DashboardProps {
  user: User | null; // ✅ Declare the prop
}

const Complaints: React.FC<DashboardProps> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [viewingComplaint, setViewingComplaint] = useState<Complaint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const [technicians, setTechnicians] = useState<{ id: string; name: string }[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [viewingJob, setViewingJob] = useState<any>(null);

  const [newComplaint, setNewComplaint] = useState<Omit<Complaint, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
    propertyUnit: ''
  });
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduledStart, setScheduledStart] = useState('09:00');
  const [scheduledEnd, setScheduledEnd] = useState('10:00');

  const [editForm, setEditForm] = useState<Omit<Complaint, 'id' | 'createdAt' | 'resolvedAt'>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'open',
    propertyUnit: '',
    scheduledDate: '',
    technicianId: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await supabase
        .from('complaints')
        .select('*', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(from, to);
      if (error) throw error;
      setComplaints(data || []);
      setTotalComplaints(count ?? 0);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch technicians from contacts
  useEffect(() => {
    const fetchTechnicians = async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('type', 'technician');
      if (!error && data) setTechnicians(data);
    };
    fetchTechnicians();
  }, []);

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = selectedStatus === 'all' || complaint.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || complaint.priority === selectedPriority;
    return matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: Complaint['priority']) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[priority];
  };

  const getStatusColor = (status: Complaint['status']) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return colors[status];
  };

  const getStatusIcon = (status: Complaint['status']) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!newComplaint.title.trim() || !newComplaint.description.trim()) {
        throw new Error('Title and description are required');
      }

      // Insert complaint and get the new complaint's id
      const { data: insertedComplaints, error } = await supabase
        .from('complaints')
        .insert([{
          title: newComplaint.title,
          description: newComplaint.description,
          priority: newComplaint.priority,
          status: newComplaint.status,
          propertyUnit: newComplaint.propertyUnit || null,
          scheduledDate: scheduledDate,
          scheduledStart: scheduledStart,
          scheduledEnd: scheduledEnd,
          createdAt: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      const newComplaintId = insertedComplaints && insertedComplaints[0]?.id;

      await fetchData();
      setShowAddForm(false);
      setNewComplaint({
        title: '',
        description: '',
        priority: 'medium',
        status: 'open',
        propertyUnit: ''
      });
      setScheduledDate(new Date().toISOString().slice(0, 10));
      setScheduledStart('09:00');
      setScheduledEnd('10:00');
      setSelectedTechnician('');
    } catch (error) {
      console.error('Error adding complaint:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to add complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setEditForm({
      title: complaint.title,
      description: complaint.description,
      priority: complaint.priority,
      status: complaint.status,
      propertyUnit: complaint.propertyUnit || '',
      scheduledDate: complaint.scheduledDate ?? '',
      technicianId: complaint.technicianId ?? ''
    });
  };

  const handleView = async (complaint: Complaint) => {
    setViewingComplaint(complaint);
    // Fetch the job linked to this complaint
    if (complaint.id) {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*, contacts(name)')
        .eq('complaintId', complaint.id)
        .limit(1);
      if (!error && jobs && jobs.length > 0) {
        setViewingJob(jobs[0]);
      } else {
        setViewingJob(null);
      }
    } else {
      setViewingJob(null);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!editForm.title.trim() || !editForm.description.trim()) {
        throw new Error('Title and description are required');
      }

      const updatedComplaint: Partial<Complaint> = {
        ...editForm,
        resolvedAt: (editForm.status === 'resolved' || editForm.status === 'closed')
          ? new Date().toISOString()
          : undefined,
        scheduledDate: editForm.scheduledDate || undefined,
        technicianId: editForm.technicianId || undefined,
      };

      const { error } = await supabase
        .from('complaints')
        .update(updatedComplaint)
        .eq('id', editingComplaint.id);

      if (error) throw error;

      await fetchData();
      setEditingComplaint(null);
    } catch (error) {
      console.error('Error updating complaint:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to update complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingComplaint) return;
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { error } = await supabase.from('complaints').delete().eq('id', editingComplaint.id);
      if (error) throw error;
      setEditingComplaint(null);
      await fetchData();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to delete complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Jobs from scheduler context
  const { jobs, addJob, assignableContacts } = useScheduler();

  // Add form type state
  const [addType, setAddType] = useState<'complaint' | 'job'>('complaint');
  // Job form state (reuse fields for both, but jobs require more fields)
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobScheduledDate, setJobScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [jobScheduledStart, setJobScheduledStart] = useState('09:00');
  const [jobScheduledEnd, setJobScheduledEnd] = useState('10:00');
  const [jobTechnician, setJobTechnician] = useState('');
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobLoading, setJobLoading] = useState(false);

  // Combined list: jobs and complaints, sorted by scheduledDate (or createdAt if missing)
  const combinedList = [
    ...jobs.map(j => ({
      ...j,
      _type: 'job' as const,
      _sort: j.scheduledDate || j.createdAt,
    })),
    ...complaints.map(c => ({
      ...c,
      _type: 'complaint' as const,
      _sort: c.scheduledDate || c.createdAt,
    })),
  ].sort((a, b) => (a._sort > b._sort ? -1 : 1));

  // Add handler for unified form
  const handleAddUnified = async (e: React.FormEvent) => {
    e.preventDefault();
    setJobError(null);
    setJobLoading(true);
    try {
      if (addType === 'job') {
        if (!jobTitle.trim()) throw new Error('Title required');
        await addJob({
          title: jobTitle,
          description: jobDescription,
          scheduledDate: jobScheduledDate,
          scheduledStart: jobScheduledStart,
          scheduledEnd: jobScheduledEnd,
          technicianId: jobTechnician || undefined,
          status: 'pending',
        });
      } else {
        if (!jobTitle.trim()) throw new Error('Title required');
        // Add complaint (reuse job fields for simplicity)
        const { error } = await supabase.from('complaints').insert([
          {
            title: jobTitle,
            description: jobDescription,
            priority: 'medium',
            status: 'open',
            propertyUnit: '',
            scheduledDate: jobScheduledDate,
            scheduledStart: jobScheduledStart,
            scheduledEnd: jobScheduledEnd,
            technicianId: jobTechnician || null,
            createdAt: new Date().toISOString(),
          },
        ]);
        if (error) throw error;
        await fetchData();
      }
      setJobTitle('');
      setJobDescription('');
      setJobScheduledDate(new Date().toISOString().slice(0, 10));
      setJobScheduledStart('09:00');
      setJobScheduledEnd('10:00');
      setJobTechnician('');
    } catch (err: any) {
      setJobError(err.message || 'Failed to add');
    } finally {
      setJobLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complaints</h1>
          <p className="text-gray-600">Manage and track property complaints</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Complaint</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="my-8 border-t border-gray-200" />

      {/* Add Complaint Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Add New Complaint</h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setSubmitError(null);
                    setScheduledDate(new Date().toISOString().slice(0, 10));
                    setScheduledStart('09:00');
                    setScheduledEnd('10:00');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {submitError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={newComplaint.title}
                    onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={newComplaint.description}
                    onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Unit</label>
                    <input
                      type="text"
                      value={newComplaint.propertyUnit}
                      onChange={(e) => setNewComplaint({ ...newComplaint, propertyUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={scheduledStart}
                      onChange={e => setScheduledStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={scheduledEnd}
                      onChange={e => setScheduledEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician (optional)</label>
                  <select
                    value={selectedTechnician}
                    onChange={e => setSelectedTechnician(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newComplaint.priority}
                      onChange={(e) => setNewComplaint({ ...newComplaint, priority: e.target.value as Complaint['priority'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newComplaint.status}
                      onChange={(e) => setNewComplaint({ ...newComplaint, status: e.target.value as Complaint['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Complaint'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setSubmitError(null);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Complaint Modal */}
      {viewingComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Complaint Details</h2>
                <button
                  onClick={() => setViewingComplaint(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{viewingComplaint.title}</h3>
                  <p className="text-sm text-gray-600">{viewingComplaint.propertyUnit}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(viewingComplaint.priority)}`}>
                    {viewingComplaint.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingComplaint.status)}`}>
                    {viewingComplaint.status}
                  </span>
                </div>

                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{viewingComplaint.description}</p>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Job Details</h4>
                  {viewingJob ? (
                    <div className="text-sm text-gray-600 space-y-1">
                      <div><span className="font-medium">Title:</span> {viewingJob.title}</div>
                      <div><span className="font-medium">Job Description:</span> {viewingJob.description}</div>
                      <div><span className="font-medium">Status:</span> {viewingJob.status}</div>
                      <div><span className="font-medium">Scheduled Date:</span> {viewingJob.scheduledDate}</div>
                      <div><span className="font-medium">Scheduled Time:</span> {viewingJob.scheduledStart} - {viewingJob.scheduledEnd}</div>
                      <div><span className="font-medium">Assigned Person:</span> {viewingJob.contacts?.name || (technicians.find(t => t.id === viewingJob.technicianId)?.name) || 'Unassigned'}</div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No job is linked to this complaint.</div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Created:</span> {new Date(viewingComplaint.createdAt).toLocaleString()}
                  </p>
                  {viewingComplaint.resolvedAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Resolved:</span> {new Date(viewingComplaint.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Complaint Modal */}
      {editingComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Complaint</h2>
                <button
                  onClick={() => {
                    setEditingComplaint(null);
                    setSubmitError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {submitError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Unit</label>
                    <input
                      type="text"
                      value={editForm.propertyUnit}
                      onChange={(e) => setEditForm({ ...editForm, propertyUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={editForm.scheduledDate || ''}
                      onChange={e => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Technician (optional)</label>
                  <select
                    value={editForm.technicianId || ''}
                    onChange={e => setEditForm({ ...editForm, technicianId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as Complaint['priority'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Complaint['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Updating...' : 'Update Complaint'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingComplaint(null);
                      setSubmitError(null);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  {editingComplaint && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Unified Add Form */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-xl mx-auto">
        <form onSubmit={handleAddUnified} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <select value={addType} onChange={e => setAddType(e.target.value as 'complaint' | 'job')} className="border rounded px-2 py-1">
              <option value="complaint">Complaint</option>
              <option value="job">Job</option>
            </select>
            <input
              className="border rounded px-2 py-1 flex-1"
              placeholder={addType === 'job' ? 'Job Title' : 'Complaint Title'}
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              required
            />
          </div>
          <textarea
            className="border rounded px-2 py-1 w-full"
            placeholder="Description"
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <input
              type="date"
              className="border rounded px-2 py-1 flex-1"
              value={jobScheduledDate}
              onChange={e => setJobScheduledDate(e.target.value)}
              required
            />
            <input
              type="time"
              className="border rounded px-2 py-1 flex-1"
              value={jobScheduledStart}
              onChange={e => setJobScheduledStart(e.target.value)}
              required
            />
            <input
              type="time"
              className="border rounded px-2 py-1 flex-1"
              value={jobScheduledEnd}
              onChange={e => setJobScheduledEnd(e.target.value)}
              required
            />
          </div>
          <select
            className="border rounded px-2 py-1 w-full"
            value={jobTechnician}
            onChange={e => setJobTechnician(e.target.value)}
          >
            <option value="">Unassigned</option>
            {assignableContacts.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
            ))}
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full" disabled={jobLoading}>
            Add {addType === 'job' ? 'Job' : 'Complaint'}
          </button>
          {jobError && <div className="text-red-500 text-sm">{jobError}</div>}
        </form>
      </div>

      {/* Combined List */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 max-w-2xl mx-auto">
        <h2 className="text-lg font-bold mb-4">Jobs & Complaints</h2>
        <ul className="divide-y unified-list">
          {combinedList.map(item => (
            <li key={item._type + '-' + item.id} className="py-3 px-3 rounded-lg flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {item._type === 'job' ? <Wrench className="w-4 h-4 text-blue-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                <span className={item._type === 'job' ? 'font-semibold text-blue-900' : 'font-semibold text-yellow-900'}>{item.title}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${item._type === 'job' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{item._type === 'job' ? 'Job' : 'Complaint'}</span>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-xs mt-1">
                <span className={item._type === 'job' ? 'bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full' : 'bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full'}>
                  Scheduled: {item.scheduledDate}
                  {'scheduledStart' in item && item.scheduledStart ? ` ${item.scheduledStart}` : ''}
                  {'scheduledEnd' in item && item.scheduledEnd ? `-${item.scheduledEnd}` : ''}
                </span>
                {'technicianId' in item && item.technicianId && (
                  <span className={item._type === 'job' ? 'bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full' : 'bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full'}>
                    Assigned: {assignableContacts.find(c => c.id === item.technicianId)?.name}
                  </span>
                )}
                {'propertyUnit' in item && item._type === 'complaint' && item.propertyUnit && (
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Unit: {item.propertyUnit}</span>
                )}
              </div>
              <div className="text-xs text-gray-400">Created: {new Date(item.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        @media (max-width: 640px) {
          .unified-list li { padding: 0.5rem 0.5rem; }
        }
        .unified-list li {
          transition: box-shadow 0.2s, background 0.2s;
        }
        .unified-list li:hover {
          background: #f3f4f6;
          box-shadow: 0 2px 8px 0 #0001;
        }
      `}</style>
    </div>
  );
};

export default Complaints;