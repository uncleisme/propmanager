import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Award, Eye, Edit, Trash2, Plus, X, Search, Upload } from "lucide-react";
import Papa from 'papaparse';
import { formatDate, getDaysUntilExpiration, getStatusColor, getStatusText } from "../utils/dateUtils";
import { User } from '@supabase/supabase-js';

interface DashboardProps {
  user: User | null; // ✅ Declare the prop
}

interface License {
  id?: number;
  name: string;
  type: string;
  issuer: string;
  issueDate: string;
  expirationDate: string;
  licenseNumber: string;
  status: string;
  contactId?: string;
  notes?: string;
}

const Licenses: React.FC<DashboardProps> = ({ user }) => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(8);
  const [totalLicenses, setTotalLicenses] = useState(0);
  const [importing, setImporting] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);

  const fetchLicenses = async () => {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase.from("licenses").select("*", { count: "exact" }).order("expirationDate", { ascending: true }).range(from, to);
    if (!error && data) {
      setLicenses(data);
      setTotalLicenses(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLicenses();
  }, [currentPage, pageSize]);

  const handleAdd = () => {
    setModalType("add");
    setSelectedLicense({
      name: '',
      type: '',
      issuer: '',
      issueDate: '',
      expirationDate: '',
      licenseNumber: '',
      status: 'active',
      contactId: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleView = (license: License) => {
    setModalType("view");
    setSelectedLicense(license);
    setShowModal(true);
  };

  const handleEdit = (license: License) => {
    setModalType("edit");
    setSelectedLicense(license);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    setErrorMsg("");
    if (window.confirm("Delete this license?")) {
      const { error } = await supabase.from("licenses").delete().eq("id", id);
      if (error) {
        setErrorMsg(error.message);
      } else {
        fetchLicenses();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const licenseData = {
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      issuer: formData.get("issuer") as string,
      issueDate: formData.get("issueDate") as string,
      expirationDate: formData.get("expirationDate") as string,
      licenseNumber: formData.get("licenseNumber") as string,
      status: formData.get("status") as string,
      contactId: formData.get("contactId") as string,
      notes: formData.get("notes") as string,
    };

    try {
      if (modalType === "add") {
        const { data, error } = await supabase.from("licenses").insert([licenseData]).select();
        if (error) throw error;
        if (data) setLicenses(prev => [data[0], ...prev]);
      } else if (modalType === "edit" && selectedLicense) {
        const { error } = await supabase
          .from("licenses")
          .update(licenseData)
          .eq("id", selectedLicense.id);
        if (error) throw error;
      }
      setShowModal(false);
      fetchLicenses();
    } catch (error) {
      setErrorMsg((error instanceof Error ? error.message : String(error)));
    }
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please select a CSV file');
      return;
    }

    setImporting(true);
    setErrorMsg('');

    try {
      const text = await file.text();
      const parseResult = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
      });
      if (parseResult.errors.length > 0) {
        throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
      }
      const data = parseResult.data as any[];
      if (data.length === 0) {
        throw new Error('CSV file is empty or contains no valid data');
      }
      const requiredHeaders = ['name', 'type', 'issuer', 'issuedate', 'expirationdate', 'licensenumber', 'status'];
      const headers = Object.keys(data[0]);
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }
      const licensesToImport: any[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const licenseData: any = {
          name: row.name?.trim() || '',
          type: row.type?.trim() || '',
          issuer: row.issuer?.trim() || '',
          issueDate: row.issuedate?.trim() || '',
          expirationDate: row.expirationdate?.trim() || '',
          licenseNumber: row.licensenumber?.trim() || '',
          status: row.status?.trim() || '',
          contactId: row.contactid?.trim() || null,
          notes: row.notes?.trim() || null,
        };
        if (!licenseData.name || !licenseData.type || !licenseData.issuer || !licenseData.issueDate || !licenseData.expirationDate || !licenseData.licenseNumber || !licenseData.status) {
          throw new Error(`Row ${i + 2}: Missing required fields`);
        }
        licensesToImport.push(licenseData);
      }
      if (licensesToImport.length === 0) {
        throw new Error('No valid licenses found in CSV');
      }
      const { data: insertedData, error } = await supabase
        .from('licenses')
        .insert(licensesToImport)
        .select();
      if (error) throw error;
      if (insertedData) {
        setLicenses(prev => [...insertedData, ...prev]);
      }
      alert(`Successfully imported ${licensesToImport.length} licenses`);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const getStatusBadge = (license: License) => {
    const days = getDaysUntilExpiration(license.expirationDate);
    const statusText = getStatusText(days);
    const colorClass = getStatusColor(days);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {statusText}
      </span>
    );
  };

  // Filter licenses by search
  const filteredLicenses = licenses.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      l.type.toLowerCase().includes(search.toLowerCase()) ||
      l.issuer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-screen-lg mx-auto min-h-screen flex flex-col pb-8">
      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">
            <span className="font-semibold">Error:</span> {errorMsg}
          </p>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Licenses</h1>
          <p className="text-gray-600">Manage all licenses and permits</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* CSV Import Button */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              disabled={importing}
              className="absolute inset-0 opacity-0 cursor-pointer"
              id="csv-import-licenses"
            />
            <label
              htmlFor="csv-import-licenses"
              className={`bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors duration-200 cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-4 h-4" />
              <span>{importing ? 'Importing...' : 'Import CSV'}</span>
            </label>
          </div>
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add License</span>
          </button>
        </div>
      </div>
      {/* CSV Import Instructions (collapsible, like Contacts) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
        <button
          onClick={() => setShowImportInstructions(!showImportInstructions)}
          className="flex items-center justify-between w-full text-left"
          type="button"
        >
          <h3 className="text-sm font-medium text-blue-800">
            CSV Import Instructions (click to {showImportInstructions ? 'hide' : 'show'})
          </h3>
          <svg className={`w-4 h-4 transition-transform ${showImportInstructions ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.584l3.71-3.354a.75.75 0 111.02 1.1l-4.25 3.846a.75.75 0 01-1.02 0l-4.25-3.846a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
        </button>
        <div className={`transition-all duration-200 ease-in-out overflow-hidden ${showImportInstructions ? 'max-h-96 mt-2' : 'max-h-0'}`}>
          <div className="pt-2">
            <p className="text-sm text-blue-700 mb-2">
              Your CSV file should contain the following columns (in any order):
            </p>
            <div className="text-xs text-blue-600 font-mono bg-blue-100 p-2 rounded">
              name,type,issuer,issueDate,expirationDate,licenseNumber,status,contactId,notes
            </div>
            <p className="text-xs text-blue-600 mt-2">
              • <strong>Required:</strong> name, type, issuer, issueDate, expirationDate, licenseNumber, status<br/>
              • <strong>Optional:</strong> contactId, notes<br/>
              • <strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-12-31)<br/>
              • <strong>Example:</strong> Fire Safety,Fire,City Council,2023-01-01,2024-01-01,FS-123,active,123,Annual inspection
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, number, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Licenses Table */}
      <div className="flex-1 overflow-auto w-full bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : filteredLicenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No licenses found
                </td>
              </tr>
            ) : (
              filteredLicenses.map((license, idx) => {
                return (
                  <tr key={license.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Award className="w-5 h-5 text-purple-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{license.name}</div>
                          <div className="text-xs text-gray-500">#{license.licenseNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{license.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(license.expirationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(license)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(license)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(license)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(license.id!)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
          <span className="mx-2">Page {currentPage} of {Math.ceil(totalLicenses / pageSize) || 1}</span>
          <button
            onClick={() => setCurrentPage((p) => (p * pageSize < totalLicenses ? p + 1 : p))}
            disabled={currentPage * pageSize >= totalLicenses}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="text-sm text-gray-600">Total: {totalLicenses} entries</div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === "view" ? "License Details" : modalType === "add" ? "Add License" : "Edit License"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {modalType === "view" && selectedLicense && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                      <p className="text-sm text-gray-900">{selectedLicense.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">License Number</p>
                      <p className="text-sm text-gray-900">{selectedLicense.licenseNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                      <p className="text-sm text-gray-900">{selectedLicense.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Issue Date</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedLicense.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Expiration Date</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedLicense.expirationDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                      <p className="text-sm text-gray-900">{getStatusText(getDaysUntilExpiration(selectedLicense.expirationDate))}</p>
                    </div>
                    {selectedLicense.contactId && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Contact ID</p>
                        <p className="text-sm text-gray-900">{selectedLicense.contactId}</p>
                      </div>
                    )}
                  </div>
                  {selectedLicense.notes && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                      <p className="text-sm text-gray-600">{selectedLicense.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {(modalType === "add" || modalType === "edit") && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                    <input
                      name="name"
                      defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.name : ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type*</label>
                      <input
                        name="type"
                        defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.type : ""}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number*</label>
                      <input
                        name="licenseNumber"
                        defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.licenseNumber : ""}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuer*</label>
                    <input
                      name="issuer"
                      defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.issuer : ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date*</label>
                      <input
                        type="date"
                        name="issueDate"
                        defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.issueDate : ""}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date*</label>
                      <input
                        type="date"
                        name="expirationDate"
                        defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.expirationDate : ""}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
                    <select
                      name="status"
                      defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.status : "active"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact ID</label>
                    <input
                      name="contactId"
                      defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.contactId || "" : ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      rows={3}
                      defaultValue={modalType === "edit" && selectedLicense ? selectedLicense.notes || "" : ""}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {modalType === "add" ? "Add License" : "Save Changes"}
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

export default Licenses;