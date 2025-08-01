import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { LiftMaintenance } from '../types';
import { User } from '@supabase/supabase-js';
import { ArrowUpDown, Plus, Search, Edit, Trash2, Eye, Calendar, MapPin, Settings, X, Upload, FileText, User as UserIcon, Building, Hash, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface LiftMaintenanceProps {
  user: User | null;
  onViewChange?: (view: string) => void;
}

const LiftMaintenance: React.FC<LiftMaintenanceProps> = ({ user, onViewChange }) => {
  const [liftAssets, setLiftAssets] = useState<LiftMaintenance[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<LiftMaintenance | null>(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalAssets, setTotalAssets] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchLiftAssets = async () => {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('lift_maintenance')
      .select('*', { count: 'exact' })
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) {
      setErrorMsg(error.message);
    } else {
      // Map database columns to camelCase
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        assetName: row.assetName,
        assetType: row.assetType,
        makeModel: row.makeModel,
        serialNumber: row.serialNumber,
        capacityKg: row.capacityKg,
        capacityPersons: row.capacityPersons,
        installationDate: row.installationDate,
        locationBuilding: row.locationBuilding,
        locationFloor: row.locationFloor,
        locationBlock: row.locationBlock,
        doshRegistrationNumber: row.doshRegistrationNumber,
        lastCfRenewalDate: row.lastCfRenewalDate,
        nextCfDueDate: row.nextCfDueDate,
        contractorVendorName: row.contractorVendorName,
        competentPersonAssigned: row.competentPersonAssigned,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
      setLiftAssets(mapped);
      setTotalAssets(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLiftAssets();
  }, [currentPage, pageSize]);

  const handleAdd = () => {
    setModalType('add');
    setSelectedAsset({
      id: '',
      assetName: '',
      assetType: 'Lift / Elevator',
      makeModel: '',
      serialNumber: '',
      capacityKg: undefined,
      capacityPersons: undefined,
      installationDate: '',
      locationBuilding: '',
      locationFloor: '',
      locationBlock: '',
      doshRegistrationNumber: '',
      lastCfRenewalDate: '',
      nextCfDueDate: '',
      contractorVendorName: '',
      competentPersonAssigned: '',
      createdAt: '',
      updatedAt: ''
    });
    setShowModal(true);
  };

  const handleView = (asset: LiftMaintenance) => {
    setModalType('view');
    setSelectedAsset(asset);
    setShowModal(true);
  };

  const handleEdit = (asset: LiftMaintenance) => {
    setModalType('edit');
    setSelectedAsset(asset);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lift asset?')) {
      const { error } = await supabase
        .from('lift_maintenance')
        .delete()
        .eq('id', id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        fetchLiftAssets();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAsset) return;

    const assetData = {
      assetName: selectedAsset.assetName,
      assetType: selectedAsset.assetType,
      makeModel: selectedAsset.makeModel || null,
      serialNumber: selectedAsset.serialNumber || null,
      capacityKg: selectedAsset.capacityKg || null,
      capacityPersons: selectedAsset.capacityPersons || null,
      installationDate: selectedAsset.installationDate || null,
      locationBuilding: selectedAsset.locationBuilding || null,
      locationFloor: selectedAsset.locationFloor || null,
      locationBlock: selectedAsset.locationBlock || null,
      doshRegistrationNumber: selectedAsset.doshRegistrationNumber || null,
      lastCfRenewalDate: selectedAsset.lastCfRenewalDate || null,
      nextCfDueDate: selectedAsset.nextCfDueDate || null,
      contractorVendorName: selectedAsset.contractorVendorName || null,
      competentPersonAssigned: selectedAsset.competentPersonAssigned || null,
    };

    if (modalType === 'add') {
      const { error } = await supabase
        .from('lift_maintenance')
        .insert(assetData);

      if (error) {
        setErrorMsg(error.message);
      } else {
        setShowModal(false);
        fetchLiftAssets();
      }
    } else if (modalType === 'edit') {
      const { error } = await supabase
        .from('lift_maintenance')
        .update(assetData)
        .eq('id', selectedAsset.id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        setShowModal(false);
        fetchLiftAssets();
      }
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const assets = results.data as any[];
        const { error } = await supabase
          .from('lift_maintenance')
          .insert(assets.map(asset => ({
            assetName: asset.assetName,
            assetType: asset.assetType || 'Lift / Elevator',
            makeModel: asset.makeModel,
            serialNumber: asset.serialNumber,
            capacityKg: asset.capacityKg,
            capacityPersons: asset.capacityPersons,
            installationDate: asset.installationDate,
            locationBuilding: asset.locationBuilding,
            locationFloor: asset.locationFloor,
            locationBlock: asset.locationBlock,
            doshRegistrationNumber: asset.doshRegistrationNumber,
            lastCfRenewalDate: asset.lastCfRenewalDate,
            nextCfDueDate: asset.nextCfDueDate,
            contractorVendorName: asset.contractorVendorName,
            competentPersonAssigned: asset.competentPersonAssigned,
          })));

        if (error) {
          setErrorMsg(error.message);
        } else {
          fetchLiftAssets();
        }
        setImporting(false);
      },
      error: (error) => {
        setErrorMsg('Error parsing CSV file: ' + error.message);
        setImporting(false);
      }
    });
  };

  const filteredAssets = liftAssets.filter(asset => {
    // First apply search filter
    const matchesSearch = asset.assetName.toLowerCase().includes(search.toLowerCase()) ||
      asset.locationBuilding?.toLowerCase().includes(search.toLowerCase()) ||
      asset.contractorVendorName?.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Then apply metric filter
    switch (activeFilter) {
      case 'overdue-cf':
        if (!asset.nextCfDueDate) return false;
        const overdueDate = new Date(asset.nextCfDueDate);
        const today = new Date();
        return overdueDate < today;
      case 'due-cf':
        if (!asset.nextCfDueDate) return false;
        const dueDate = new Date(asset.nextCfDueDate);
        const currentDate = new Date();
        const diffTime = dueDate.getTime() - currentDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
      case 'breakdowns':
        // This case is no longer used for filtering
        return false;
      default:
        return true; // 'all' filter
    }
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getDueDateStatus = (dueDate: string | undefined) => {
    if (!dueDate) return 'text-gray-500';
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600 font-semibold';
    if (diffDays <= 30) return 'text-orange-600 font-semibold';
    if (diffDays <= 90) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  };

  const totalPages = Math.ceil(totalAssets / pageSize);

  // Calculate metrics
  const activeAssets = liftAssets.length;
  const dueForCFRenewal = liftAssets.filter(asset => {
    if (!asset.nextCfDueDate) return false;
    const dueDate = new Date(asset.nextCfDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  }).length;
  const overdueCFRenewal = liftAssets.filter(asset => {
    if (!asset.nextCfDueDate) return false;
    const dueDate = new Date(asset.nextCfDueDate);
    const today = new Date();
    return dueDate < today;
  }).length;
  const thisMonthBreakdowns = 0; // Placeholder for future breakdown tracking

  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Lift Maintenance</h1>
          <p className="text-gray-600">Manage lift maintenance assets</p>
        </div>
        <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-4 md:space-y-0 md:space-x-4">
          <button
            onClick={() => setShowImportInstructions(!showImportInstructions)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition-colors duration-200"
          >
            <FileText className="w-4 h-4" />
            <span>Import Instructions</span>
          </button>
          <label className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors duration-200 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="hidden"
              disabled={importing}
            />
          </label>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

             {/* Metrics */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
         <div 
           className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
             activeFilter === 'all' 
               ? 'border-blue-300 bg-blue-50' 
               : 'border-gray-200 hover:border-blue-200'
           }`}
           onClick={() => setActiveFilter('all')}
         >
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Active Assets</p>
               <p className="text-2xl font-bold text-blue-600">{activeAssets}</p>
             </div>
             <ArrowUpDown className="w-8 h-8 text-blue-500" />
           </div>
         </div>
         <div 
           className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
             activeFilter === 'due-cf' 
               ? 'border-yellow-300 bg-yellow-50' 
               : 'border-gray-200 hover:border-yellow-200'
           }`}
           onClick={() => setActiveFilter('due-cf')}
         >
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Due for CF Renewal</p>
               <p className="text-2xl font-bold text-yellow-600">{dueForCFRenewal}</p>
             </div>
             <Calendar className="w-8 h-8 text-yellow-500" />
           </div>
         </div>
         <div 
           className={`bg-white rounded-lg shadow-sm border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
             activeFilter === 'overdue-cf' 
               ? 'border-red-300 bg-red-50' 
               : 'border-gray-200 hover:border-red-200'
           }`}
           onClick={() => setActiveFilter('overdue-cf')}
         >
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">Overdue CF</p>
               <p className="text-2xl font-bold text-red-600">{overdueCFRenewal}</p>
             </div>
             <AlertCircle className="w-8 h-8 text-red-500" />
           </div>
         </div>
         <div 
           className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-orange-200"
           onClick={() => onViewChange?.('breakdown-history')}
         >
           <div className="flex items-center justify-between">
             <div>
               <p className="text-sm font-medium text-gray-600">This Month Breakdowns</p>
               <p className="text-2xl font-bold text-orange-600">{thisMonthBreakdowns}</p>
             </div>
             <Settings className="w-8 h-8 text-orange-500" />
           </div>
         </div>
       </div>

      {/* Import Instructions */}
      {showImportInstructions && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">CSV Import Instructions</h3>
          <p className="text-blue-800 text-sm mb-2">
            Your CSV should include these columns: assetName, assetType, makeModel, serialNumber, capacityKg, capacityPersons, installationDate, locationBuilding, locationFloor, locationBlock, doshRegistrationNumber, lastCfRenewalDate, nextCfDueDate, contractorVendorName, competentPersonAssigned
          </p>
          <p className="text-blue-800 text-sm">
            Dates should be in YYYY-MM-DD format. All fields except assetName are optional.
          </p>
        </div>
      )}

             {/* Search and Filter Bar */}
       <div className="flex flex-col md:flex-row gap-4 mb-6">
         <div className="relative flex-1 max-w-md">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="w-5 h-5 text-gray-400" />
           </div>
           <input
             type="text"
             placeholder="Search by asset name, building, or contractor..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
           />
         </div>
         
         {/* Active Filter Indicator */}
         {activeFilter !== 'all' && (
           <div className="flex items-center space-x-2">
             <div className="flex items-center px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
               <span className="mr-2">
                 {activeFilter === 'overdue-cf' && '⚠️ Overdue CF'}
                 {activeFilter === 'due-cf' && '📅 Due for CF Renewal'}
               </span>
               <button
                 onClick={() => setActiveFilter('all')}
                 className="text-blue-600 hover:text-blue-800"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
           </div>
         )}
       </div>

      {/* Error Message Display */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700 whitespace-pre-line">{errorMsg}</div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setErrorMsg("")}
                className="inline-flex text-red-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                  Asset Name
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6 hidden md:table-cell">
                  Location
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Make & Model
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Contractor
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden 2xl:table-cell">
                  CF Due Date
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
                      <span className="ml-3 text-gray-500">Loading assets...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-6 py-12 whitespace-nowrap text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">No assets found</div>
                      <div className="text-sm">Try adjusting your search or add a new asset</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors duration-150">
                    {/* Asset Name */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap w-1/4">
                      <div className="flex items-center">
                        <ArrowUpDown className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={asset.assetName}>
                            {asset.assetName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 md:hidden">
                            {asset.locationBuilding || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap w-1/6 hidden md:table-cell">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={`${asset.locationBuilding || '-'}${asset.locationFloor ? ` - Floor ${asset.locationFloor}` : ''}${asset.locationBlock ? ` - Block ${asset.locationBlock}` : ''}`}>
                        {asset.locationBuilding || '-'}
                        {asset.locationFloor && ` - Floor ${asset.locationFloor}`}
                        {asset.locationBlock && ` - Block ${asset.locationBlock}`}
                      </div>
                    </td>

                    {/* Make & Model */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={asset.makeModel || '-'}>
                        {asset.makeModel || '-'}
                      </div>
                    </td>

                    {/* Contractor */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900 truncate max-w-xs" title={asset.contractorVendorName || '-'}>
                        {asset.contractorVendorName || '-'}
                      </div>
                    </td>

                    {/* CF Due Date */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap hidden 2xl:table-cell">
                      <div className={`text-sm ${getDueDateStatus(asset.nextCfDueDate)}`}>
                        {asset.nextCfDueDate ? formatDate(asset.nextCfDueDate) : '-'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-6 py-1 sm:py-4 whitespace-nowrap text-right text-sm font-medium w-24">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleView(asset)}
                          className="p-1 sm:p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors duration-150"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(asset)}
                          className="p-1 sm:p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-md transition-colors duration-150"
                          title="Edit Asset"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1 sm:p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-150"
                          title="Delete Asset"
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

      {/* Pagination Controls and Total Count */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-6 gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {Math.ceil(totalAssets / pageSize) || 1}
          </span>
          <button
            onClick={() => setCurrentPage((p) => (p * pageSize < totalAssets ? p + 1 : p))}
            disabled={currentPage * pageSize >= totalAssets}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Total: {totalAssets} entries
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === "view" ? "Asset Details" : modalType === "add" ? "Add Asset" : "Edit Asset"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {modalType === "view" && selectedAsset && (
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Asset Name</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedAsset.assetName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Asset Type</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedAsset.assetType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Make & Model</p>
                        <p className="text-sm text-gray-900">{selectedAsset.makeModel || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Serial Number</p>
                        <p className="text-sm text-gray-900">{selectedAsset.serialNumber || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Capacity & Installation Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Capacity & Installation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Capacity (kg)</p>
                        <p className="text-sm text-gray-900">{selectedAsset.capacityKg || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Capacity (persons)</p>
                        <p className="text-sm text-gray-900">{selectedAsset.capacityPersons || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Installation Date</p>
                        <p className="text-sm text-gray-900">{selectedAsset.installationDate ? formatDate(selectedAsset.installationDate) : '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Building</p>
                        <p className="text-sm text-gray-900">{selectedAsset.locationBuilding || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Floor</p>
                        <p className="text-sm text-gray-900">{selectedAsset.locationFloor || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Block</p>
                        <p className="text-sm text-gray-900">{selectedAsset.locationBlock || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      Compliance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">DOSH Registration Number</p>
                        <p className="text-sm text-gray-900">{selectedAsset.doshRegistrationNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last CF Renewal Date</p>
                        <p className="text-sm text-gray-900">{selectedAsset.lastCfRenewalDate ? formatDate(selectedAsset.lastCfRenewalDate) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Next CF Due Date</p>
                        <p className={`text-sm ${getDueDateStatus(selectedAsset.nextCfDueDate)}`}>
                          {selectedAsset.nextCfDueDate ? formatDate(selectedAsset.nextCfDueDate) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contractor Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                      Contractor Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contractor/Vendor Name</p>
                        <p className="text-sm text-gray-900">{selectedAsset.contractorVendorName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Competent Person Assigned</p>
                        <p className="text-sm text-gray-900">{selectedAsset.competentPersonAssigned || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(modalType === "add" || modalType === "edit") && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Asset Name *
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.assetName}
                          onChange={(e) => setSelectedAsset({...selectedAsset, assetName: e.target.value})}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Asset Type
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.assetType}
                          onChange={(e) => setSelectedAsset({...selectedAsset, assetType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Make & Model
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.makeModel || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, makeModel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.serialNumber || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, serialNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Capacity & Installation Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Capacity & Installation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacity (kg)
                        </label>
                        <input
                          type="number"
                          value={selectedAsset.capacityKg || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, capacityKg: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacity (persons)
                        </label>
                        <input
                          type="number"
                          value={selectedAsset.capacityPersons || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, capacityPersons: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Installation Date
                        </label>
                        <input
                          type="date"
                          value={selectedAsset.installationDate || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, installationDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Building
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.locationBuilding || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, locationBuilding: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Floor
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.locationFloor || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, locationFloor: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Block
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.locationBlock || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, locationBlock: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Compliance Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      Compliance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DOSH Registration Number
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.doshRegistrationNumber || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, doshRegistrationNumber: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last CF Renewal Date
                        </label>
                        <input
                          type="date"
                          value={selectedAsset.lastCfRenewalDate || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, lastCfRenewalDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Next CF Due Date
                        </label>
                        <input
                          type="date"
                          value={selectedAsset.nextCfDueDate || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, nextCfDueDate: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contractor Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                      Contractor Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contractor/Vendor Name
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.contractorVendorName || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, contractorVendorName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Competent Person Assigned
                        </label>
                        <input
                          type="text"
                          value={selectedAsset.competentPersonAssigned || ''}
                          onChange={(e) => setSelectedAsset({...selectedAsset, competentPersonAssigned: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {modalType === 'add' ? 'Add Asset' : 'Update Asset'}
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

export default LiftMaintenance; 