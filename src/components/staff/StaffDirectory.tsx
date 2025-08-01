import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { Staff } from '../../types';
import { User } from '@supabase/supabase-js';
import { 
  Plus, Search, Edit, Trash2, Eye, User as UserIcon, Upload, X, 
  ChevronLeft, ChevronRight, AlertCircle
} from 'lucide-react';
import Papa from 'papaparse';

interface StaffDirectoryProps {
  user: User | null;
}

const StaffDirectory: React.FC<StaffDirectoryProps> = ({ user }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Form state
  const [staffForm, setStaffForm] = useState<Partial<Staff>>({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: 'maintenance',
    hireDate: '',
    status: 'active'
  });

  const fetchStaff = async () => {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from('staff')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employeeId.ilike.%${search}%`);
    }
    if (departmentFilter) {
      query = query.eq('department', departmentFilter);
    }
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStaff(data || []);
      setTotalItems(count || 0);
    }
    setLoading(false);
  };

  const handleAddStaff = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.employeeId) {
      setErrorMsg('Please fill in all required fields');
      return;
    }

    const { error } = await supabase
      .from('staff')
      .insert([{
        ...staffForm,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setShowModal(false);
      resetForm();
      fetchStaff();
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;

    const { error } = await supabase
      .from('staff')
      .update({
        ...staffForm,
        updatedAt: new Date().toISOString()
      })
      .eq('id', selectedStaff.id);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setShowModal(false);
      setSelectedStaff(null);
      resetForm();
      fetchStaff();
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        fetchStaff();
      }
    }
  };

  const resetForm = () => {
    setStaffForm({
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      position: '',
      department: 'maintenance',
      hireDate: '',
      status: 'active'
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const staffData = results.data.map((row: any) => ({
            employeeId: row.employeeId || row.employee_id || '',
            name: row.name || '',
            email: row.email || '',
            phone: row.phone || '',
            position: row.position || '',
            department: row.department || 'maintenance',
            hireDate: row.hireDate || row.hire_date || '',
            status: row.status || 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })).filter(item => item.name && item.email && item.employeeId);

          const { error } = await supabase
            .from('staff')
            .insert(staffData);

          if (error) {
            setErrorMsg(error.message);
          } else {
            fetchStaff();
            setShowImportInstructions(false);
          }
        } catch (err) {
          setErrorMsg('Error importing file');
        }
        setImporting(false);
      },
      error: () => {
        setErrorMsg('Error parsing CSV file');
        setImporting(false);
      }
    });
  };

  useEffect(() => {
    fetchStaff();
  }, [currentPage, search, departmentFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {errorMsg}
          </div>
          <button onClick={() => setErrorMsg('')} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Directory</h2>
          <p className="text-gray-600">Manage your staff members and their information</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportInstructions(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => {
              setModalType('add');
              setShowModal(true);
              resetForm();
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Departments</option>
          <option value="maintenance">Maintenance</option>
          <option value="security">Security</option>
          <option value="cleaning">Cleaning</option>
          <option value="administration">Administration</option>
          <option value="management">Management</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Loading...</td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">No staff members found</td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {member.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.position}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' :
                        member.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.hireDate ? new Date(member.hireDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setModalType('view');
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStaff(member);
                            setStaffForm(member);
                            setModalType('edit');
                            setShowModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-red-600 hover:text-red-900"
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

        {/* Pagination */}
        {totalItems > pageSize && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / pageSize), currentPage + 1))}
                disabled={currentPage === Math.ceil(totalItems / pageSize)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(totalItems / pageSize), currentPage + 1))}
                    disabled={currentPage === Math.ceil(totalItems / pageSize)}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit/View Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'add' ? 'Add New Staff Member' :
                 modalType === 'edit' ? 'Edit Staff Member' : 'Staff Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {modalType === 'view' && selectedStaff ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStaff.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStaff.employeeId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStaff.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStaff.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedStaff.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Position</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedStaff.position}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedStaff.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hire Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedStaff.hireDate ? new Date(selectedStaff.hireDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                modalType === 'add' ? handleAddStaff() : handleEditStaff();
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={staffForm.name || ''}
                      onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      value={staffForm.employeeId || ''}
                      onChange={(e) => setStaffForm({...staffForm, employeeId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={staffForm.email || ''}
                      onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={staffForm.phone || ''}
                      onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={staffForm.department || 'maintenance'}
                      onChange={(e) => setStaffForm({...staffForm, department: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="maintenance">Maintenance</option>
                      <option value="security">Security</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="administration">Administration</option>
                      <option value="management">Management</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <input
                      type="text"
                      value={staffForm.position || ''}
                      onChange={(e) => setStaffForm({...staffForm, position: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={staffForm.status || 'active'}
                      onChange={(e) => setStaffForm({...staffForm, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                    <input
                      type="date"
                      value={staffForm.hireDate || ''}
                      onChange={(e) => setStaffForm({...staffForm, hireDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {modalType === 'add' ? 'Add Staff' : 'Update Staff'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Import Instructions Modal */}
      {showImportInstructions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Import Staff from CSV</h3>
              <button
                onClick={() => setShowImportInstructions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">CSV Format Requirements:</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p className="mb-2">Your CSV file should include the following columns:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li><strong>name</strong> (required) - Full name</li>
                    <li><strong>employeeId</strong> (required) - Unique employee ID</li>
                    <li><strong>email</strong> (required) - Email address</li>
                    <li><strong>phone</strong> - Phone number</li>
                    <li><strong>department</strong> - Department name</li>
                    <li><strong>position</strong> - Job position</li>
                    <li><strong>status</strong> - active, inactive, or terminated</li>
                    <li><strong>hireDate</strong> - Date in YYYY-MM-DD format</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  disabled={importing}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {importing && <p className="mt-2 text-sm text-blue-600">Importing...</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDirectory;
