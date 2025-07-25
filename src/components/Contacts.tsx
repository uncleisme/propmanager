import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { Eye, Edit, Trash2, Plus, X, Search, Upload } from "lucide-react";
import Papa from 'papaparse';
import { User } from '@supabase/supabase-js';


interface DashboardProps {
  user: User | null; // ✅ Declare the prop
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
  const [pageSize] = useState(10); // You can change this to any number
  const [totalContacts, setTotalContacts] = useState(0);
  const [importing, setImporting] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);


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
      const requiredHeaders = ['name', 'email', 'phone'];
      const headers = Object.keys(data[0]);
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }
      const allowedTypes = ['contractor', 'supplier', 'serviceProvider', 'resident', 'government', 'others'];
      const typeMap: Record<string, string> = {
        'contractor': 'contractor',
        'supplier': 'supplier',
        'service provider': 'service provider',
        'serviceprovider': 'service provider',
        'resident': 'resident',
        'residents': 'resident',
        'government': 'government',
        'others': 'others',
      };
      const contactsToImport: any[] = [];
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        let typeValue = row.type?.trim().toLowerCase() || '';
        typeValue = typeMap[typeValue] || null;
        if (typeValue && !allowedTypes.includes(typeValue)) typeValue = null;
        const contactData: any = {
          name: row.name?.trim() || '',
          email: row.email?.trim() || '',
          phone: row.phone?.trim() || '',
          address: row.address?.trim() || null,
          type: typeValue,
          company: row.company?.trim() || null,
          notes: row.notes?.trim() || null,
        };
        if (!contactData.name || !contactData.email || !contactData.phone) {
          throw new Error(`Row ${i + 2}: Missing required fields (name, email, phone)`);
        }
        contactsToImport.push(contactData);
      }
      if (contactsToImport.length === 0) {
        throw new Error('No valid contacts found in CSV');
      }
      const { data: insertedData, error } = await supabase
        .from('contacts')
        .insert(contactsToImport)
        .select();
      if (error) throw error;
      if (insertedData) {
        setContacts(prev => [...insertedData, ...prev]);
      }
      alert(`Successfully imported ${contactsToImport.length} contacts`);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
      event.target.value = '';
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
  <div className="flex flex-col md:flex-row items-center justify-between">
  <div className="text-center md:text-left">
    <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
    <p className="text-gray-600">Manage all contacts</p>
  </div>
  <div className="flex flex-col md:flex-row mt-4 md:mt-0 space-y-4 md:space-y-0 md:space-x-4">
    {/* CSV Import Button */}
    <div className="relative">
      <input
        type="file"
        accept=".csv"
        onChange={handleCSVImport}
        disabled={importing}
        className="absolute inset-0 opacity-0 cursor-pointer"
        id="csv-import-contacts"
      />
      <label
        htmlFor="csv-import-contacts"
        className={`bg-green-600 text-white px-2 py-1 rounded-lg flex items-center hover:bg-green-700 transition-colors duration-200 cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Upload className="w-4 h-4" />
        <span>{importing ? 'Importing...' : 'Import CSV'}</span>
      </label>
    </div>
    <button
      onClick={handleAdd}
      className="bg-blue-600 text-white px-2 py-1 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
    >
      <Plus className="w-4 h-4" />
      <span>Add Contact</span>
    </button>
  </div>
</div>

  {/* CSV Import Instructions */}
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
        name,email,phone,address,type,company,notes
      </div>
      <p className="text-xs text-blue-600 mt-2">
        • <strong>Required:</strong> name, email, phone<br/>
        • <strong>Optional:</strong> address, type, company, notes<br/>
        • <strong>Example:</strong> John Doe,john@example.com,1234567890,123 Main St,contractor,Acme Corp,VIP client
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
      placeholder="Search by name, email, or phone..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>

  {/* Contacts Table (MUI Table, all screen sizes) */}
  <div className="overflow-y-auto">
  <table className="min-w-full table-auto">
    <thead className="bg-yellow-500 text-gray-700 uppercase">
      <tr>
        <th className="px-4 py-3 border-b">Name</th>
        <th className="px-4 py-3 border-b hidden md:table-cell">Email</th>
        <th className="px-4 py-3 border-b">Phone</th>
        <th className="px-4 py-3 border-b hidden md:table-cell">Type</th>
        <th className="px-4 py-3 border-b hidden md:table-cell">Actions</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {loading ? (
        <tr>
          <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </td>
        </tr>
      ) : filteredContacts.length === 0 ? (
        <tr>
          <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
            No contacts found
          </td>
        </tr>
      ) : (
        filteredContacts.map((contact) => (
          <tr key={contact.id} className="hover:bg-gray-100">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{contact.email}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{contact.phone}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden md:table-cell">{contact.type}</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium hidden md:table-cell">
              <div className="flex gap-2 md:gap-8 flex-col md:flex-row">
                <button
                  onClick={() => handleView(contact)}
                  className="text-blue-500 hover:text-blue-700"
                  title="View"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(contact)}
                  className="text-yellow-500 hover:text-yellow-700"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="text-red-600 hover:text-red-800"
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
    <span className="mx-2">Page {currentPage} of {Math.ceil(totalContacts / pageSize) || 1}</span>
    <button
      onClick={() => setCurrentPage((p) => (p * pageSize < totalContacts ? p + 1 : p))}
      disabled={currentPage * pageSize >= totalContacts}
      className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50"
    >
      Next
    </button>
  </div>
  <div className="text-sm text-gray-600">Total: {totalContacts} entries</div>
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
                  <option value="serviceProvider">Service Provider</option>
                  <option value="technician">Technician</option>
                  <option value="resident">Resident</option>
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
