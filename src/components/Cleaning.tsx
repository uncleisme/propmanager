import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { CleaningPerson } from '../types';
import { User } from '@supabase/supabase-js';
import { Sparkles, Plus, Search, Edit, Trash2, Eye, User as UserIcon, Phone, MapPin, Calendar, X, Upload } from 'lucide-react';
import Papa from 'papaparse';

interface CleaningProps {
  user: User | null;
}

const Cleaning: React.FC<CleaningProps> = ({ user }) => {
  const [cleaningPersons, setCleaningPersons] = useState<CleaningPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<CleaningPerson | null>(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchCleaningPersons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cleaning_persons')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      // Map snake_case to camelCase
      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        identificationNumber: row.identificationNumber,
        nationality: row.nationality,
        visaExpiryDate: row.visaExpiryDate ? row.visaExpiryDate : undefined,
        permitExpiryDate: row.permitExpiryDate ? row.permitExpiryDate : undefined,
        phoneNumber: row.phoneNumber,
        address: row.address,
        createdAt: row.createdAt || row.created_at,
        updatedAt: row.updatedAt || row.updated_at,
      }));
      setCleaningPersons(mapped);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCleaningPersons();
  }, []);

  const handleAdd = () => {
    setModalType('add');
    setSelectedPerson({
      id: '',
      name: '',
      identificationNumber: '',
      nationality: '',
      visaExpiryDate: '',
      permitExpiryDate: '',
      phoneNumber: '',
      address: '',
      createdAt: '',
      updatedAt: ''
    });
    setShowModal(true);
  };

  const handleView = (person: CleaningPerson) => {
    setModalType('view');
    setSelectedPerson(person);
    setShowModal(true);
  };

  const handleEdit = (person: CleaningPerson) => {
    setModalType('edit');
    setSelectedPerson(person);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this cleaning person?')) {
      const { error } = await supabase
        .from('cleaning_persons')
        .delete()
        .eq('id', id);

      if (error) {
        setErrorMsg(error.message);
      } else {
        fetchCleaningPersons();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    const form = e.currentTarget;
    const formData = new FormData(form);

    const personData = {
      name: formData.get('name') as string,
      identificationNumber: formData.get('identificationNumber') as string,
      nationality: formData.get('nationality') as string,
      visaExpiryDate: formData.get('visaExpiryDate') as string || null,
      permitExpiryDate: formData.get('permitExpiryDate') as string || null,
      phoneNumber: formData.get('phoneNumber') as string,
      address: formData.get('address') as string,
      updatedAt: new Date().toISOString()
    };

    try {
      if (modalType === 'add') {
        const { error } = await supabase
          .from('cleaning_persons')
          .insert([{ ...personData, createdAt: new Date().toISOString() }]);
        if (error) throw error;
      } else if (modalType === 'edit' && selectedPerson) {
        const { error } = await supabase
          .from('cleaning_persons')
          .update(personData)
          .eq('id', selectedPerson.id);
        if (error) throw error;
      }
      setShowModal(false);
      fetchCleaningPersons();
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred');
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
      
      // Parse CSV using papaparse
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

      const requiredHeaders = ['name', 'identificationnumber', 'nationality', 'phonenumber', 'address'];
      const optionalHeaders = ['visaexpirydate', 'permitexpirydate'];
      const headers = Object.keys(data[0]);
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const personsToImport: any[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        const personData: any = {
          name: row.name?.trim() || '',
          identificationNumber: row.identificationnumber?.trim() || '',
          nationality: row.nationality?.trim() || '',
          phoneNumber: row.phonenumber?.trim() || '',
          address: row.address?.trim() || '',
          visaExpiryDate: row.visaexpirydate?.trim() || undefined,
          permitExpiryDate: row.permitexpirydate?.trim() || undefined,
        };

        // Validate required fields
        if (!personData.name || !personData.identificationNumber || !personData.nationality || !personData.phoneNumber || !personData.address) {
          throw new Error(`Row ${i + 2}: Missing required fields (name, identificationNumber, nationality, phoneNumber, address)`);
        }

        // Validate date format if provided
        if (personData.visaExpiryDate && isNaN(new Date(personData.visaExpiryDate).getTime())) {
          throw new Error(`Row ${i + 2}: Invalid visa expiry date format. Use YYYY-MM-DD format`);
        }

        if (personData.permitExpiryDate && isNaN(new Date(personData.permitExpiryDate).getTime())) {
          throw new Error(`Row ${i + 2}: Invalid permit expiry date format. Use YYYY-MM-DD format`);
        }

        personsToImport.push(personData);
      }

      if (personsToImport.length === 0) {
        throw new Error('No valid cleaning persons found in CSV');
      }

      // Import persons to database
      const { data: insertedData, error } = await supabase
        .from('cleaning_persons')
        .insert(personsToImport)
        .select();

      if (error) throw error;

      // Update local state
      if (insertedData) {
        setCleaningPersons(prev => [...insertedData, ...prev]);
      }

      alert(`Successfully imported ${personsToImport.length} cleaning persons`);
      
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const filteredPersons = cleaningPersons.filter(person =>
    person.name.toLowerCase().includes(search.toLowerCase()) ||
    person.identificationNumber.toLowerCase().includes(search.toLowerCase()) ||
    person.nationality.toLowerCase().includes(search.toLowerCase()) ||
    person.phoneNumber.includes(search)
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getExpiryStatus = (expiryDate: string | undefined) => {
    if (!expiryDate) return { status: 'N/A', class: 'bg-gray-100 text-gray-800' };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'Expired', class: 'bg-red-100 text-red-800' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'Expiring Soon', class: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'Valid', class: 'bg-green-100 text-green-800' };
    }
  };

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cleaning Personnel</h1>
          <p className="text-gray-600">Manage cleaning staff information and documentation</p>
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
              id="csv-import-cleaning"
            />
            <label
              htmlFor="csv-import-cleaning"
              className={`bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors duration-200 cursor-pointer ${
                importing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>{importing ? 'Importing...' : 'Import CSV'}</span>
            </label>
          </div>
          
          {/* Add Cleaning Person Button */}
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Cleaning Person</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by name, ID, nationality, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* CSV Import Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">CSV Import Format</h3>
        <p className="text-sm text-blue-700 mb-2">
          Your CSV file should contain the following columns (in any order):
        </p>
        <div className="text-xs text-blue-600 font-mono bg-blue-100 p-2 rounded">
          name,identificationNumber,nationality,phoneNumber,address,visaExpiryDate,permitExpiryDate
        </div>
        <p className="text-xs text-blue-600 mt-2">
          • <strong>Required:</strong> name, identificationNumber, nationality, phoneNumber, address<br/>
          • <strong>Optional:</strong> visaExpiryDate, permitExpiryDate<br/>
          • <strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-12-31)<br/>
          • <strong>Example:</strong> Jane Smith,ID789012,Indonesian,+62812345678,456 Oak Ave,2025-06-15,2024-12-31
        </p>
      </div>

      {/* Cleaning Personnel Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nationality
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document Status
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
            ) : filteredPersons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No cleaning personnel found
                </td>
              </tr>
            ) : (
              filteredPersons.map((person) => {
                const visaStatus = getExpiryStatus(person.visaExpiryDate);
                const permitStatus = getExpiryStatus(person.permitExpiryDate);
                
                return (
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Sparkles className="w-5 h-5 text-green-500 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{person.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.identificationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.nationality}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {person.visaExpiryDate && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${visaStatus.class}`}>
                            Visa: {visaStatus.status}
                          </span>
                        )}
                        {person.permitExpiryDate && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${permitStatus.class}`}>
                            Permit: {permitStatus.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(person)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(person)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(person.id)}
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalType === 'view' ? 'Cleaning Person Details' : 
                   modalType === 'add' ? 'Add Cleaning Person' : 'Edit Cleaning Person'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {modalType === 'view' && selectedPerson ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Name</p>
                      <p className="text-sm text-gray-900">{selectedPerson.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">ID Number</p>
                      <p className="text-sm text-gray-900">{selectedPerson.identificationNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Nationality</p>
                      <p className="text-sm text-gray-900">{selectedPerson.nationality}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="text-sm text-gray-900">{selectedPerson.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Visa Expiry</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedPerson.visaExpiryDate || '')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Permit Expiry</p>
                      <p className="text-sm text-gray-900">{formatDate(selectedPerson.permitExpiryDate || '')}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Address</p>
                    <p className="text-sm text-gray-900">{selectedPerson.address}</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={selectedPerson?.name || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Identification Number*
                    </label>
                    <input
                      type="text"
                      name="identificationNumber"
                      defaultValue={selectedPerson?.identificationNumber || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality*
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      defaultValue={selectedPerson?.nationality || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number*
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      defaultValue={selectedPerson?.phoneNumber || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visa Expiry Date
                      </label>
                      <input
                        type="date"
                        name="visaExpiryDate"
                        defaultValue={selectedPerson?.visaExpiryDate || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Permit Expiry Date
                      </label>
                      <input
                        type="date"
                        name="permitExpiryDate"
                        defaultValue={selectedPerson?.permitExpiryDate || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address*
                    </label>
                    <textarea
                      name="address"
                      rows={3}
                      defaultValue={selectedPerson?.address || ''}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {modalType === 'add' ? 'Add Cleaning Person' : 'Save Changes'}
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

export default Cleaning;
