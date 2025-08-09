import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../utils/supabaseClient";
import { Eye, Edit, Trash2, Plus, X, Search } from "lucide-react";

import { User } from '@supabase/supabase-js';

interface LocationListingProps {
  user: User | null;
}

interface Location {
  id: string;
  location_id: string;  // Generated as {name}-{floor}-{room}
  name: string;
  block: string;
  floor: string;
  room: string;
  type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const LocationListing: React.FC<LocationListingProps> = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: '',
    block: '',
    floor: '',
    room: '',
    type: '',
    description: '',
  });

  // Generate location_id from name, floor, and room
  const generateLocationId = (name: string, floor: string, room: string) => {
    const cleanName = name.trim().replace(/\s+/g, '-');
    const cleanFloor = floor.trim().replace(/\s+/g, '-');
    const cleanRoom = room.trim().replace(/\s+/g, '-');
    return `${cleanName}-${cleanFloor}-${cleanRoom}`.toLowerCase();
  };

  // Fetch locations from the database
  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("locations")
        .select('*')
        .or(`name.ilike.%${search}%,location_id.ilike.%${search}%,type.ilike.%${search}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to load locations.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate the location_id
      const location_id = generateLocationId(formData.name, formData.floor, formData.room);
      
      const submitData = {
        ...formData,
        location_id,
      };

      if (modalType === "add") {
        const { error } = await supabase
          .from("locations")
          .insert([submitData]);
        if (error) throw error;
      } else if (modalType === "edit" && selectedLocation?.id) {
        const { error } = await supabase
          .from("locations")
          .update(submitData)
          .eq("id", selectedLocation.id);
        if (error) throw error;
      }
      
      // Refresh the locations list
      await fetchLocations();
      setShowModal(false);
      setErrorMsg("");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete location
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        const { error } = await supabase
          .from("locations")
          .delete()
          .eq("id", id);
        if (error) throw error;
        fetchLocations();
      } catch (error: any) {
        setErrorMsg(error.message);
      }
    }
  };

  // Open modal for adding/editing/viewing
  const openModal = (type: "add" | "edit" | "view", location: Location | null = null) => {
    setModalType(type);
    setSelectedLocation(location);
    setErrorMsg("");
    
    if (location) {
      setFormData({
        name: location.name,
        block: location.block,
        floor: location.floor,
        room: location.room,
        type: location.type,
        description: location.description || '',
      });
    } else {
      setFormData({
        name: '',
        block: '',
        floor: '',
        room: '',
        type: '',
        description: '',
      });
    }
    setShowModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
        <button
          onClick={() => openModal("add")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={20} />
          Add Location
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMsg}
        </div>
      )}

      {/* Locations Table */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name & Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Block/Floor/Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <tr key={location.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {location.location_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {location.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {location.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="text-sm text-gray-900">Block: {location.block}</div>
                        <div className="text-xs text-gray-500">Floor: {location.floor} | Room: {location.room}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {location.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(location.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal("view", location)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => openModal("edit", location)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No locations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit/View Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {modalType === 'add' ? 'Add New Location' : modalType === 'edit' ? 'Edit Location' : 'Location Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Block *
                  </label>
                  <input
                    type="text"
                    name="block"
                    value={formData.block}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Floor *
                  </label>
                  <input
                    type="text"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room *
                  </label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Type</option>
                    <option value="Office">Office</option>
                    <option value="Meeting Room">Meeting Room</option>
                    <option value="Storage">Storage</option>
                    <option value="Common Area">Common Area</option>
                    <option value="Utility">Utility</option>
                    <option value="Parking">Parking</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    disabled={modalType === 'view'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Preview Generated Location ID */}
                {(modalType === 'add' || modalType === 'edit') && formData.name && formData.floor && formData.room && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Generated Location ID (Preview)
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700">
                      {generateLocationId(formData.name, formData.floor, formData.room)}
                    </div>
                  </div>
                )}
              </div>

              {modalType !== 'view' && (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : modalType === 'add' ? 'Add Location' : 'Update Location'}
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

export default LocationListing;
