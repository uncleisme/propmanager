import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { Eye, Edit, Trash2, Plus, X, Search, Upload, MoreVertical } from "lucide-react";
import Papa from 'papaparse';
import { User } from '@supabase/supabase-js';

interface DashboardProps {
  user: User | null;
}

interface Contact {
  id: number;
  name: string;
  address?: string;
  phone: string;
  type?: string;
  company?: string;
  email: string;
  notes?: string;
}

const Contacts: React.FC<DashboardProps> = ({ user }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalContacts, setTotalContacts] = useState(0);
  const [importing, setImporting] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("contacts")
      .select("*", { count: "exact" })
      .range(from, to);

    if (!error && data) {
      setContacts(data);
      setTotalContacts(count ?? 0);
    } else {
      setErrorMsg(error?.message || "Failed to load contacts.");
    }
    setLoading(false);
  }, [currentPage, pageSize]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAdd = () => {
    setModalType("add");
    setSelectedContact(null);
    setShowModal(true);
  };

  const handleView = (contact: Contact) => {
    setModalType("view");
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleEdit = (contact: Contact) => {
    setModalType("edit");
    setSelectedContact(contact);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    setErrorMsg("");
    if (window.confirm("Delete this contact?")) {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) {
        setErrorMsg(error.message);
      } else {
        fetchContacts();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const phone = formData.get("phone") as string;
    const type = formData.get("type") as string;
    const company = formData.get("company") as string;
    const email = formData.get("email") as string;
    const notes = formData.get("notes") as string;

    const contactData = { name, address, phone, type, company, email, notes };

    if (modalType === "add") {
      const { error } = await supabase.from("contacts").insert([contactData]);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
    } else if (modalType === "edit" && selectedContact) {
      const { error } = await supabase
        .from("contacts")
        .update(contactData)
        .eq("id", selectedContact.id);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
    }
    setShowModal(false);
    fetchContacts();
  };

  const handleActionMenuToggle = (contactId: number) => {
    setOpenActionMenu(openActionMenu === contactId ? null : contactId);
  };

  const handleActionClick = (action: string, contact: Contact) => {
    setOpenActionMenu(null);
    switch (action) {
      case 'view':
        handleView(contact);
        break;
      case 'edit':
        handleEdit(contact);
        break;
      case 'delete':
        handleDelete(contact.id);
        break;
    }
  };

  // Filter contacts by search
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      (c.type?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600">Manage all contacts</p>
        </div>
        <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-4 md:space-y-0 md:space-x-4">
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
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
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Contact Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Company
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 whitespace-nowrap text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-500">Loading contacts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 whitespace-nowrap text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">No contacts found</div>
                      <div className="text-sm">Try adjusting your search or add a new contact</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors duration-150">
                    {/* Contact Name & Avatar */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {contact.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                          <div className="text-sm text-gray-500">{contact.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">{contact.phone}</div>
                      {contact.address && (
                        <div className="text-sm text-gray-500 truncate max-w-xs" title={contact.address}>
                          {contact.address}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      {contact.type ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize
                          ${contact.type === 'contractor' ? 'bg-blue-100 text-blue-800' :
                            contact.type === 'supplier' ? 'bg-green-100 text-green-800' :
                            contact.type === 'serviceProvider' ? 'bg-purple-100 text-purple-800' :
                            contact.type === 'resident' ? 'bg-orange-100 text-orange-800' :
                            contact.type === 'government' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {contact.type}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>

                    {/* Company */}
                    <td className="px-6 py-4 whitespace-nowrap hidden xl:table-cell">
                      <div className="text-sm text-gray-900">
                        {contact.company || '-'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => handleActionMenuToggle(contact.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-150"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openActionMenu === contact.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                            <div className="py-1">
                              <button
                                onClick={() => handleActionClick('view', contact)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150"
                              >
                                <Eye className="w-4 h-4 mr-3" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleActionClick('edit', contact)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors duration-150"
                              >
                                <Edit className="w-4 h-4 mr-3" />
                                Edit Contact
                              </button>
                              <button
                                onClick={() => handleActionClick('delete', contact)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete Contact
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {openActionMenu !== null && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenActionMenu(null)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === "view" ? "Contact Details" : modalType === "add" ? "Add Contact" : "Edit Contact"}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {modalType === "view" && selectedContact && (
                <div className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedContact.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedContact.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-sm text-gray-900 font-medium">{selectedContact.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</p>
                        <p className="text-sm text-gray-900 font-medium capitalize">{selectedContact.type || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Company & Address Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Company & Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Company</p>
                        <p className="text-sm text-gray-900">{selectedContact.company || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                        <p className="text-sm text-gray-900">{selectedContact.address || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  {selectedContact.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        Additional Information
                      </h3>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{selectedContact.notes}</p>
                      </div>
                    </div>
                  )}
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          name="name"
                          defaultValue={modalType === "edit" && selectedContact ? selectedContact.name : ""}
                          required
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          name="email"
                          type="email"
                          defaultValue={modalType === "edit" && selectedContact ? selectedContact.email : ""}
                          required
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          name="phone"
                          defaultValue={modalType === "edit" && selectedContact ? selectedContact.phone : ""}
                          required
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          name="type"
                          defaultValue={modalType === "edit" && selectedContact ? selectedContact.type || "" : ""}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                          <option value="">Select type</option>
                          <option value="contractor">Contractor</option>
                          <option value="supplier">Supplier</option>
                          <option value="serviceProvider">Service Provider</option>
                          <option value="resident">Resident</option>
                          <option value="government">Government</option>
                          <option value="others">Others</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Company & Address Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Company & Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                        <input
                          name="company"
                          defaultValue={modalType === "edit" && selectedContact ? selectedContact.company || "" : ""}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Enter company name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <input
                          name="address"
                          defaultValue={modalType === "edit" && selectedContact ? selectedContact.address || "" : ""}
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder="Enter address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Additional Information
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        name="notes"
                        rows={4}
                        defaultValue={modalType === "edit" && selectedContact ? selectedContact.notes || "" : ""}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        placeholder="Add any additional notes or comments about this contact..."
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 border-2 border-red-300 rounded-lg text-red-600 hover:bg-red-50 hover:border-red-400 transition-colors duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium shadow-sm"
                    >
                      {modalType === "add" ? "Add Contact" : "Update Contact"}
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

export default Contacts; 