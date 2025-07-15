import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import {
  FileText,
  AlertCircle,
  Plus,
  Mail,
  Phone,
  Building,
  X,
  Search,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Contract, Contact } from "../types";
import { formatDate, getDaysUntilExpiration, getStatusColor, getStatusText } from "../utils/dateUtils";

const Contracts: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchContracts = async () => {
    setLoading(true);
    const { data: contractsData, error: contractsError } = await supabase
      .from("contracts")
      .select("*")
      .order("end_date", { ascending: true });

    const { data: contactsData, error: contactsError } = await supabase
      .from("contacts")
      .select("*");

    if (contractsError) {
      setErrorMsg(contractsError.message);
    } else {
      setContracts(contractsData || []);
    }

    if (contactsError) {
      setErrorMsg(contactsError.message);
    } else {
      setContacts(contactsData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleAdd = () => {
    setModalType("add");
    setSelectedContract({
      title: "",
      contact_id: "",
      start_date: "",
      end_date: "",
      value: 0,
      status: "active",
      description: "",
      renewal_notice: 30,
      //expiration_date: "", // This will be calculated from end_date
    });
    setShowModal(true);
  };

  const handleView = (contract: Contract) => {
    setModalType("view");
    setSelectedContract(contract);
    setShowModal(true);
  };

  const handleEdit = (contract: Contract) => {
    setModalType("edit");
    setSelectedContract(contract);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    setErrorMsg("");
    if (window.confirm("Delete this contract?")) {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) {
        setErrorMsg(error.message);
      } else {
        fetchContracts(); // Re-fetch to update the list
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const form = e.currentTarget;
    const formData = new FormData(form);

    const contractData: Omit<Contract, "id"> = {
      title: formData.get("title") as string,
      contact_id: formData.get("contact_id") as string,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
      value: parseFloat(formData.get("value") as string) || 0,
      status: formData.get("status") as Contract["status"],
      description: formData.get("description") as string,
      renewal_notice: parseInt(formData.get("renewal_notice") as string) || 30,
      expiration_date: formData.get("end_date") as string, // expiration_date is the same as end_date for contracts
    };

    try {
      if (modalType === "add") {
        const { data, error } = await supabase.from("contracts").insert([contractData]).select();
        if (error) throw error;
        if (data) setContracts((prev) => [data[0], ...prev]);
      } else if (modalType === "edit" && selectedContract) {
        const { error } = await supabase
          .from("contracts")
          .update(contractData)
          .eq("id", selectedContract.id);
        if (error) throw error;
      }
      setShowModal(false);
      fetchContracts(); // Re-fetch to ensure data is up-to-date and sorted
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  const getContactName = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? contact.name : "Unknown Contact";
  };

  const getContact = (contactId: string) => {
    return contacts.find((c) => c.id === contactId);
  };

  const handleVendorClick = (contactId: string) => {
    const contact = getContact(contactId);
    if (contact) {
      setSelectedContract(null); // Close contract modal if open
      setModalType("view"); // Set modal type to view for contact
      setSelectedVendor(contact);
      setShowModal(true); // Open modal for vendor details
    }
  };

  const getTypeColor = (type: Contact["type"]) => {
    const colors = {
      contractor: "bg-blue-100 text-blue-800",
      supplier: "bg-green-100 text-green-800",
      serviceProvider: "bg-green-100 text-green-800",
      maintenance: "bg-yellow-100 text-yellow-800",
      resident: "bg-purple-100 text-purple-800",
      government: "bg-yellow-100 text-black-800", // Assuming black text for contrast
      others: "bg-gray-100 text-gray-800",
    };
    return colors[type];
  };

  const getStatusBadge = (contract: Contract) => {
    const days = getDaysUntilExpiration(contract.end_date);
    const statusText = getStatusText(days);
    const colorClass = getStatusColor(days);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {statusText}
      </span>
    );
  };

  // Filter contracts by search
  const filteredContracts = contracts.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      getContactName(c.contact_id).toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const [selectedVendor, setSelectedVendor] = useState<Contact | null>(null);

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
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600">Monitor and manage service provider contracts</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contract</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by title, vendor, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
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
            ) : filteredContracts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No contracts found
                </td>
              </tr>
            ) : (
              filteredContracts.map((contract, idx) => {
                const days = getDaysUntilExpiration(contract.end_date);
                return (
                  <tr
                    key={contract.id}
                    className={
                      idx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50 hover:bg-gray-100"
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contract.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleVendorClick(contract.contact_id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                      >
                        {getContactName(contract.contact_id)}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${contract.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(contract.end_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(contract)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(contract)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(contract.id!)}
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

      {/* Modal for Add/Edit/View Contract or View Vendor Details */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedVendor
                    ? "Vendor Details"
                    : modalType === "view"
                    ? "Contract Details"
                    : modalType === "add"
                    ? "Add New Contract"
                    : "Edit Contract"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedVendor(null); // Clear selected vendor when closing modal
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Vendor Details View (if selectedVendor is not null) */}
              {selectedVendor && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedVendor.name}
                      </h3>
                      <p className="text-sm text-gray-600">{selectedVendor.company}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        selectedVendor.type
                      )}`}
                    >
                      {selectedVendor.type}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                        <a
                          href={`mailto:${selectedVendor.email}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedVendor.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-3 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                        <a
                          href={`tel:${selectedVendor.phone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {selectedVendor.phone}
                        </a>
                      </div>
                    </div>
                    {selectedVendor.address && (
                      <div className="flex items-start text-sm text-gray-600">
                        <Building className="w-4 h-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                          <p className="text-gray-900">{selectedVendor.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedVendor.notes && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                      <p className="text-sm text-gray-600">{selectedVendor.notes}</p>
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                      Member Since
                    </p>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedVendor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Contract Details View (if modalType is "view" and selectedContract is not null and no vendor selected) */}
              {modalType === "view" && selectedContract && !selectedVendor && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Title</p>
                      <p className="text-sm text-gray-900">{selectedContract.title}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Service Provider
                      </p>
                      <button
                        onClick={() => handleVendorClick(selectedContract.contact_id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors duration-200"
                      >
                        {getContactName(selectedContract.contact_id)}
                      </button>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedContract.start_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedContract.end_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Value</p>
                      <p className="text-sm text-gray-900">
                        ${selectedContract.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                      <p className="text-sm text-gray-900">
                        {getStatusText(getDaysUntilExpiration(selectedContract.end_date))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Renewal Notice
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedContract.renewal_notice} days
                      </p>
                    </div>
                  </div>
                  {selectedContract.description && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
                      <p className="text-sm text-gray-600">{selectedContract.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Add/Edit Contract Form */}
              {(modalType === "add" || modalType === "edit") && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Title*
                    </label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={selectedContract?.title || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Annual HVAC Maintenance"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Provider*
                    </label>
                    <select
                      name="contact_id"
                      defaultValue={selectedContract?.contact_id || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a contact</option>
                      {contacts.map((contact: Contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} - {contact.company}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date*
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        defaultValue={selectedContract?.start_date || ""}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date*
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        defaultValue={selectedContract?.end_date || ""}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contract Value ($)*
                    </label>
                    <input
                      type="number"
                      name="value"
                      defaultValue={selectedContract?.value || 0}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
                    <select
                      name="status"
                      defaultValue={selectedContract?.status || "active"}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Renewal Notice (days)*
                    </label>
                    <input
                      type="number"
                      name="renewal_notice"
                      defaultValue={selectedContract?.renewal_notice || 30}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description*
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={selectedContract?.description || ""}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the services covered by this contract..."
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {modalType === "add" ? "Add Contract" : "Save Changes"}
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

export default Contracts;