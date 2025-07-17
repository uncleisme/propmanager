import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Award, Eye, Edit, Trash2, Plus, X, Search, } from "lucide-react";
import { formatDate, getDaysUntilExpiration, getStatusColor, getStatusText } from "../utils/dateUtils";

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

const Licenses: React.FC = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchLicenses = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("licenses").select("*").order("expirationDate", { ascending: true });
    if (!error && data) setLicenses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

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
      setErrorMsg(error.message);
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
    <div className="space-y-6">
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
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add License</span>
        </button>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issuer</th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{license.issuer}</td>
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
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
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Issuer</p>
                      <p className="text-sm text-gray-900">{selectedLicense.issuer}</p>
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