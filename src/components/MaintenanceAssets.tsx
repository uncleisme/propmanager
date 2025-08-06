import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { MaintenanceAsset, AssetCategory } from '../types';
import { User } from '@supabase/supabase-js';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  X,
  Save,
  ArrowLeft
} from 'lucide-react';

interface MaintenanceAssetsProps {
  user: User | null;
  onViewChange?: (view: string) => void;
}

const MaintenanceAssets: React.FC<MaintenanceAssetsProps> = ({ user, onViewChange }) => {
  const [assets, setAssets] = useState<MaintenanceAsset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<MaintenanceAsset | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('all');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    assetName: '',
    assetCode: '',
    categoryId: '',
    locationBuilding: '',
    locationFloor: '',
    locationRoom: '',
    makeModel: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    installationDate: '',
    specifications: {} as Record<string, any>,
    status: 'active' as 'active' | 'inactive' | 'retired' | 'maintenance',
    criticality: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: ''
  });

  useEffect(() => {
    fetchAssets();
    fetchCategories();
  }, [currentPage, search, statusFilter, categoryFilter, criticalityFilter]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('maintenance_assets')
        .select(`
          *,
          category:asset_categories(*)
        `, { count: 'exact' });

      // Apply filters
      if (search) {
        query = query.or(`assetName.ilike.%${search}%,assetCode.ilike.%${search}%,locationBuilding.ilike.%${search}%,makeModel.ilike.%${search}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('categoryId', categoryFilter);
      }
      if (criticalityFilter !== 'all') {
        query = query.eq('criticality', criticalityFilter);
      }

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('createdAt', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setAssets(data || []);
      setTotalAssets(count || 0);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const assetData = {
        assetName: formData.assetName,
        assetCode: formData.assetCode || null,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : null,
        locationBuilding: formData.locationBuilding || null,
        locationFloor: formData.locationFloor || null,
        locationRoom: formData.locationRoom || null,
        makeModel: formData.makeModel || null,
        serialNumber: formData.serialNumber || null,
        purchaseDate: formData.purchaseDate || null,
        warrantyExpiry: formData.warrantyExpiry || null,
        installationDate: formData.installationDate || null,
        specifications: formData.specifications,
        status: formData.status,
        criticality: formData.criticality,
        notes: formData.notes || null
      };

      if (modalType === 'add') {
        const { error } = await supabase
          .from('maintenance_assets')
          .insert([assetData]);
        if (error) throw error;
      } else if (modalType === 'edit' && selectedAsset) {
        const { error } = await supabase
          .from('maintenance_assets')
          .update(assetData)
          .eq('id', selectedAsset.id);
        if (error) throw error;
      }

      setShowModal(false);
      setSelectedAsset(null);
      resetForm();
      await fetchAssets();
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      const { error } = await supabase
        .from('maintenance_assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAssets();
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting asset:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      assetName: '',
      assetCode: '',
      categoryId: '',
      locationBuilding: '',
      locationFloor: '',
      locationRoom: '',
      makeModel: '',
      serialNumber: '',
      purchaseDate: '',
      warrantyExpiry: '',
      installationDate: '',
      specifications: {},
      status: 'active',
      criticality: 'medium',
      notes: ''
    });
  };

  const openModal = (type: 'add' | 'edit' | 'view', asset?: MaintenanceAsset) => {
    setModalType(type);
    if (asset) {
      setSelectedAsset(asset);
      setFormData({
        assetName: asset.assetName,
        assetCode: asset.assetCode || '',
        categoryId: asset.categoryId?.toString() || '',
        locationBuilding: asset.locationBuilding || '',
        locationFloor: asset.locationFloor || '',
        locationRoom: asset.locationRoom || '',
        makeModel: asset.makeModel || '',
        serialNumber: asset.serialNumber || '',
        purchaseDate: asset.purchaseDate || '',
        warrantyExpiry: asset.warrantyExpiry || '',
        installationDate: asset.installationDate || '',
        specifications: asset.specifications || {},
        status: asset.status,
        criticality: asset.criticality,
        notes: asset.notes || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'retired': return 'text-red-600 bg-red-50 border-red-200';
      case 'maintenance': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const totalPages = Math.ceil(totalAssets / pageSize);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => onViewChange?.('preventive-maintenance')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Assets</h1>
            <p className="text-gray-600 mt-1">Manage building assets and equipment</p>
          </div>
        </div>
        <button
          onClick={() => openModal('add')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Criticality</label>
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Criticality</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setCategoryFilter('all');
                setCriticalityFilter('all');
                setCurrentPage(1);
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Asset
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                  Category
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                  Location
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Criticality
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-gray-500">
                    No assets found
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900 truncate">{asset.assetName}</div>
                        <div className="text-xs text-gray-500 truncate">{asset.assetCode}</div>
                        {asset.makeModel && (
                          <div className="text-xs text-gray-500 truncate">{asset.makeModel}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {asset.category && (
                        <div className="flex items-center">
                          <div 
                            className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                            style={{ backgroundColor: asset.category.color }}
                          ></div>
                          <span className="text-sm text-gray-900 truncate">{asset.category.name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900 truncate max-w-32" title={`${asset.locationBuilding}${asset.locationFloor ? ` - Floor ${asset.locationFloor}` : ''}${asset.locationRoom ? ` - ${asset.locationRoom}` : ''}`}>
                        {asset.locationBuilding}
                        {asset.locationFloor && ` - F${asset.locationFloor}`}
                        {asset.locationRoom && ` - ${asset.locationRoom}`}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full border ${getCriticalityColor(asset.criticality)}`}>
                        {asset.criticality}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm font-medium">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openModal('view', asset)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => openModal('edit', asset)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
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
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalAssets)} of {totalAssets} assets
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalType === 'add' ? 'Add Asset' : modalType === 'edit' ? 'Edit Asset' : 'Asset Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Asset Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.assetName}
                      onChange={(e) => setFormData({ ...formData, assetName: e.target.value })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Asset Code</label>
                    <input
                      type="text"
                      value={formData.assetCode}
                      onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Criticality</label>
                    <select
                      value={formData.criticality}
                      onChange={(e) => setFormData({ ...formData, criticality: e.target.value as any })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                {/* Location and Technical Details */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Location & Technical Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Building</label>
                    <input
                      type="text"
                      value={formData.locationBuilding}
                      onChange={(e) => setFormData({ ...formData, locationBuilding: e.target.value })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Floor</label>
                      <input
                        type="text"
                        value={formData.locationFloor}
                        onChange={(e) => setFormData({ ...formData, locationFloor: e.target.value })}
                        disabled={modalType === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Room</label>
                      <input
                        type="text"
                        value={formData.locationRoom}
                        onChange={(e) => setFormData({ ...formData, locationRoom: e.target.value })}
                        disabled={modalType === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Make/Model</label>
                    <input
                      type="text"
                      value={formData.makeModel}
                      onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                      <input
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                        disabled={modalType === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />   />
                      </div>
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Make/Model</label>
                      <input
                        type="text"
                        value={formData.makeModel}
                        onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                        disabled={modalType === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
  
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                      <input
                        type="text"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        disabled={modalType === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Warranty Expiry</label>
                      <input
                        type="date"
                        value={formData.warrantyExpiry}
                        onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                        disabled={modalType === 'view'}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Installation Date</label>
                    <input
                      type="date"
                      value={formData.installationDate}
                      onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
                      disabled={modalType === 'view'}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={modalType === 'view'}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              {modalType !== 'view' && (
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {modalType === 'add' ? 'Add Asset' : 'Update Asset'}
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

export default MaintenanceAssets;