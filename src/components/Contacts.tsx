import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { Eye, Edit, Trash2, Plus, X, Search } from "lucide-react";

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

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // You can change this to any number
  const [totalContacts, setTotalContacts] = useState(0);

  const fetchContacts = useCallback(async () => {
    setLoading(true);

    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("contacts")
      .select("*", { count: "exact" }) // important: include count
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

  // Filter contacts by search
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.toLowerCase().includes(search.toLowerCase()) ||
      (c.type?.toLowerCase() || "").includes(search.toLowerCase())
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
      <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
      <p className="text-gray-600">Manage all contacts</p>
    </div>
    <button
      onClick={handleAdd}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
    >
      <Plus className="w-4 h-4" />
      <span>Add Contact</span>
    </button>
  </div>

  {/* Search Bar */}
  <div className="relative w-full max-w-md">
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
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            </td>
          </tr>
        ) : filteredContacts.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
              No contacts found
            </td>
          </tr>
        ) : (
          filteredContacts.map((contact, idx) => (
            <tr key={contact.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(contact)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(contact)}
                    className="text-yellow-600 hover:text-yellow-900"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(contact.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
  <div className="flex justify-between items-center mt-4">
  <p className="text-sm text-gray-600">
    Page {currentPage} of {Math.ceil(totalContacts / pageSize)}
  </p>
  <div className="flex gap-2">
    <button
      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
      disabled={currentPage === 1}
      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
    >
      Prev
    </button>
    <button
      onClick={() =>
        setCurrentPage((p) => p < Math.ceil(totalContacts / pageSize) ? p + 1 : p)
      }
      disabled={currentPage === Math.ceil(totalContacts / pageSize)}
      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
    >
      Next
    </button>
  </div>
</div>


  {/* Modal */}
  {showModal && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                  <p className="text-sm text-gray-900">{selectedContact.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-sm text-gray-900">{selectedContact.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                  <p className="text-sm text-gray-900">{selectedContact.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                  <p className="text-sm text-gray-900">{selectedContact.type || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Company</p>
                  <p className="text-sm text-gray-900">{selectedContact.company || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                  <p className="text-sm text-gray-900">{selectedContact.address || '-'}</p>
                </div>
              </div>
              {selectedContact.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                  <p className="text-sm text-gray-600">{selectedContact.notes}</p>
                </div>
              )}
            </div>
          )}

          {(modalType === "add" || modalType === "edit") && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    name="name"
                    defaultValue={modalType === "edit" && selectedContact ? selectedContact.name : ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={modalType === "edit" && selectedContact ? selectedContact.email : ""}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  defaultValue={modalType === "edit" && selectedContact ? selectedContact.phone : ""}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  defaultValue={modalType === "edit" && selectedContact ? selectedContact.type || "" : ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="contractor">Contractor</option>
                  <option value="supplier">Supplier</option>
                  <option value="service provider">Service Provider</option>
                  <option value="residents">Residents</option>
                  <option value="government">Government</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    name="company"
                    defaultValue={modalType === "edit" && selectedContact ? selectedContact.company || "" : ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    name="address"
                    defaultValue={modalType === "edit" && selectedContact ? selectedContact.address || "" : ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={modalType === "edit" && selectedContact ? selectedContact.notes || "" : ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {modalType === "add" ? "Add Contact" : "Save Changes"}
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

export default Contacts;
