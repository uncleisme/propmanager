import React, { useState, useEffect } from 'react';
import { Building2, Edit, Save, X, Plus, Trash2, MapPin, Users, Shield, Car, Calendar, DollarSign } from 'lucide-react';
import { BuildingInfo } from '../types';
import { supabase } from '../utils/supabaseClient';

const BuildingInfoComponent: React.FC = () => {
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newFacility, setNewFacility] = useState('');
  const [newSecurityFeature, setNewSecurityFeature] = useState('');

  const [formData, setFormData] = useState<Omit<BuildingInfo, 'id' | 'created_at' | 'updated_at'>>({
    building_name: '',
    building_address: '',
    building_type: 'condominium',
    total_units: 0,
    total_floors: 0,
    year_built: new Date().getFullYear(),
    property_manager_name: '',
    property_manager_company: '',
    property_manager_phone: '',
    property_manager_email: '',
    jmb_name: '',
    jmbMembers: [],
    jmb_phone: '',
    jmb_email: '',
    maintenance_fee: 0,
    sinking_fund: 0,
    insurance_company: '',
    insurance_policy_number: '',
    insurance_expiry: '',
    facilities: [],
    parking_spaces: 0,
    security_features: [],
    notes: ''
  });

  const fetchBuildingInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('building_info')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      if (data) {
        setBuildingInfo(data);
        setFormData({
          building_name: data.building_name || '',
          building_address: data.building_address || '',
          building_type: data.building_type || 'condominium',
          total_units: data.total_units || 0,
          total_floors: data.total_floors || 0,
          year_built: data.year_built || new Date().getFullYear(),
          property_manager_name: data.property_manager_name || '',
          property_manager_company: data.property_manager_company || '',
          property_manager_phone: data.property_manager_phone || '',
          property_manager_email: data.property_manager_email || '',
          jmb_name: data.jmb_name || '',
          jmbMembers: data.jmbMembers || [],
          jmb_phone: data.jmb_phone || '',
          jmb_email: data.jmb_email || '',
          maintenance_fee: data.maintenance_fee || 0,
          sinking_fund: data.sinking_fund || 0,
          insurance_company: data.insurance_company || '',
          insurance_policy_number: data.insurance_policy_number || '',
          insurance_expiry: data.insurance_expiry || '',
          facilities: data.facilities || [],
          parking_spaces: data.parking_spaces || 0,
          security_features: data.security_features || [],
          notes: data.notes || ''
        });
      } else {
        // No building info exists, start in editing mode
        setEditing(true);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setSubmitError('Failed to load building information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildingInfo();
  }, []);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setSubmitError(null);

  try {
    if (!formData.building_name.trim() || !formData.building_address.trim()) {
      throw new Error('Building name and address are required');
    }

    const dataToSave = {
      ...formData,
      updated_at: new Date().toISOString(), // Add this line
      jmb_name: formData.jmb_name || null,
      jmb_phone: formData.jmb_phone || null,
      jmb_email: formData.jmb_email || null,
      jmbMembers: formData.jmbMembers || null,
      insurance_company: formData.insurance_company || null,
      insurance_policy_number: formData.insurance_policy_number || null,
      insurance_expiry: formData.insurance_expiry || null,
      notes: formData.notes || null
    };

    if (buildingInfo) {
      const { error } = await supabase
        .from('building_info')
        .update(dataToSave)
        .eq('id', buildingInfo.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('building_info')
        .insert([{ ...dataToSave, created_at: new Date().toISOString() }]);

      if (error) throw error;
    }

    await fetchBuildingInfo();
    setEditing(false);
  } catch (error) {
    console.error('Error saving building info:', error);
    setSubmitError(error instanceof Error ? error.message : 'Failed to save building information');
  } finally {
    setIsSubmitting(false);
  }
};

const handleMemberChange = (index: number, updatedMember: { name: string; phone: string; email: string }) => {
  const updatedMembers = [...formData.jmbMembers];
  updatedMembers[index] = updatedMember;
  setFormData({ ...formData, jmbMembers: updatedMembers });
};

const removeMember = (index: number) => {
  const updatedMembers = formData.jmbMembers.filter((_, i) => i !== index);
  setFormData({ ...formData, jmbMembers: updatedMembers });
};

const addNewMember = () => {
  setFormData({ 
    ...formData,
    jmbMembers: [...formData.jmbMembers, { name: '', phone: '', email: '' }]
  });
};



  const addFacility = () => {
    if (newFacility.trim() && !formData.facilities.includes(newFacility.trim())) {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, newFacility.trim()]
      });
      setNewFacility('');
    }
  };

  const removeFacility = (facility: string) => {
    setFormData({
      ...formData,
      facilities: formData.facilities.filter(f => f !== facility)
    });
  };

  const addSecurityFeature = () => {
    if (newSecurityFeature.trim() && !formData.security_features.includes(newSecurityFeature.trim())) {
      setFormData({
        ...formData,
        security_features: [...formData.security_features, newSecurityFeature.trim()]
      });
      setNewSecurityFeature('');
    }
  };

  const removeSecurityFeature = (feature: string) => {
    setFormData({
      ...formData,
      security_features: formData.security_features.filter(f => f !== feature)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 text-lg">Loading building information...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Building Information</h1>
          <p className="text-gray-600">Manage comprehensive building and property details</p>
        </div>
        {!editing && buildingInfo && (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Information</span>
          </button>
        )}
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">
            <span className="font-semibold">Error:</span> {submitError}
          </p>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Building Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  value={formData.building_name}
                  onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Type</label>
                <select
                  value={formData.building_type}
                  onChange={(e) => setFormData({ ...formData, building_type: e.target.value as BuildingInfo['building_type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="condominium">Condominium</option>
                  <option value="apartment">Apartment</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="commercial">Commercial</option>
                  <option value="mixed_use">Mixed Use</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Address *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.building_address}
                  onChange={(e) => setFormData({ ...formData, building_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_units}
                  onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Floors</label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_floors}
                  onChange={(e) => setFormData({ ...formData, total_floors: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Built</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.year_built}
                  onChange={(e) => setFormData({ ...formData, year_built: parseInt(e.target.value) || new Date().getFullYear() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parking Spaces</label>
                <input
                  type="number"
                  min="0"
                  value={formData.parking_spaces}
                  onChange={(e) => setFormData({ ...formData, parking_spaces: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Property Management Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Property Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                <input
                  type="text"
                  value={formData.property_manager_name}
                  onChange={(e) => setFormData({ ...formData, property_manager_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Management Company</label>
                <input
                  type="text"
                  value={formData.property_manager_company}
                  onChange={(e) => setFormData({ ...formData, property_manager_company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Phone</label>
                <input
                  type="tel"
                  value={formData.property_manager_phone}
                  onChange={(e) => setFormData({ ...formData, property_manager_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Email</label>
                <input
                  type="email"
                  value={formData.property_manager_email}
                  onChange={(e) => setFormData({ ...formData, property_manager_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* JMB Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Joint Management Body (JMB)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">JMB Name</label>
                <input
                  type="text"
                  value={formData.jmb_name}
                  onChange={(e) => setFormData({ ...formData, jmb_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
                     {/* JMB Members Section */}
// JMB Members Section - Updated to include phone and email for each member
<div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    JMB Members
  </label>
  
  <div className="space-y-4">
    {/* Current Members List */}
    {formData.jmbMembers.map((member, index) => (
      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
          <input
            type="text"
            value={member.name || ''}
            onChange={(e) => handleMemberChange(index, { ...member, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Member name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
          <input
            type="tel"
            value={member.phone || ''}
            onChange={(e) => handleMemberChange(index, { ...member, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Phone number"
          />
        </div>
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={member.email || ''}
              onChange={(e) => handleMemberChange(index, { ...member, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Email address"
            />
          </div>
          <button
            type="button"
            onClick={() => removeMember(index)}
            className="p-2 text-red-600 hover:text-red-800 transition-colors mb-[9px]"
            aria-label="Remove member"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    ))}

    {/* Add Member Button */}
    <button
      type="button"
      onClick={addNewMember}
      className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
    >
      <Plus className="w-4 h-4 mr-1" />
      Add Member
    </button>
  </div>
</div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">JMB Phone</label>
                <input
                  type="tel"
                  value={formData.jmb_phone}
                  onChange={(e) => setFormData({ ...formData, jmb_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">JMB Email</label>
                <input
                  type="email"
                  value={formData.jmb_email}
                  onChange={(e) => setFormData({ ...formData, jmb_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Maintenance Fee (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maintenance_fee}
                  onChange={(e) => setFormData({ ...formData, maintenance_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sinking Fund (RM)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sinking_fund}
                  onChange={(e) => setFormData({ ...formData, sinking_fund: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Insurance Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Company</label>
                <input
                  type="text"
                  value={formData.insurance_company}
                  onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                <input
                  type="text"
                  value={formData.insurance_policy_number}
                  onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry Date</label>
                <input
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Facilities</h2>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  placeholder="Add a facility (e.g., Swimming Pool, Gym, BBQ Area)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                />
                <button
                  type="button"
                  onClick={addFacility}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.facilities.map((facility, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {facility}
                    <button
                      type="button"
                      onClick={() => removeFacility(facility)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Features</h2>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSecurityFeature}
                  onChange={(e) => setNewSecurityFeature(e.target.value)}
                  placeholder="Add a security feature (e.g., 24/7 Security, CCTV, Access Card)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecurityFeature())}
                />
                <button
                  type="button"
                  onClick={addSecurityFeature}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.security_features.map((feature, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeSecurityFeature(feature)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional information about the building..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Information'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setSubmitError(null);
                if (buildingInfo) {
                  // Reset form data to original values
                  fetchBuildingInfo();
                }
              }}
              disabled={isSubmitting}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      ) : (
        // View Mode
        buildingInfo ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Building Name</p>
                  <p className="text-lg font-semibold text-gray-900">{buildingInfo.building_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Building Type</p>
                  <p className="text-lg text-gray-900 capitalize">{buildingInfo.building_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Year Built</p>
                  <p className="text-lg text-gray-900">{buildingInfo.year_built}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Units</p>
                  <p className="text-lg text-gray-900">{buildingInfo.total_units}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Floors</p>
                  <p className="text-lg text-gray-900">{buildingInfo.total_floors}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Parking Spaces</p>
                  <p className="text-lg text-gray-900">{buildingInfo.parking_spaces}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-gray-900">{buildingInfo.building_address}</p>
                </div>
              </div>
            </div>

            {/* Property Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Property Management
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Manager Name</p>
                  <p className="text-lg text-gray-900">{buildingInfo.property_manager_name || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Management Company</p>
                  <p className="text-lg text-gray-900">{buildingInfo.property_manager_company || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-lg text-gray-900">{buildingInfo.property_manager_phone || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg text-gray-900">{buildingInfo.property_manager_email || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* JMB Information */}
{(buildingInfo.jmb_name || buildingInfo.jmbMembers?.length > 0) && (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">Joint Management Body (JMB)</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {buildingInfo.jmb_name && (
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-500">JMB Name</p>
          <p className="text-lg text-gray-900">{buildingInfo.jmb_name}</p>
        </div>
      )}
      {buildingInfo.jmb_phone && (
        <div>
          <p className="text-sm font-medium text-gray-500">Phone</p>
          <p className="text-lg text-gray-900">{buildingInfo.jmb_phone}</p>
        </div>
      )}
      {buildingInfo.jmb_email && (
        <div>
          <p className="text-sm font-medium text-gray-500">Email</p>
          <p className="text-lg text-gray-900">{buildingInfo.jmb_email}</p>
        </div>
      )}
      {buildingInfo?.jmbMembers?.length > 0 && (
  <div className="md:col-span-2">
    <p className="text-sm font-medium text-gray-500 mb-2">JMB Members</p>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
              Phone
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
              Email
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {buildingInfo.jmbMembers.map((member, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {member.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.phone || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {member.email || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
    </div>
  </div>
)}

            {/* Financial Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Financial Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Maintenance Fee</p>
                  <p className="text-lg text-gray-900">RM {buildingInfo.maintenance_fee.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Sinking Fund</p>
                  <p className="text-lg text-gray-900">RM {buildingInfo.sinking_fund.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Insurance Information */}
            {(buildingInfo.insurance_company || buildingInfo.insurance_policy_number) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Insurance Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {buildingInfo.insurance_company && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Insurance Company</p>
                      <p className="text-lg text-gray-900">{buildingInfo.insurance_company}</p>
                    </div>
                  )}
                  {buildingInfo.insurance_policy_number && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Policy Number</p>
                      <p className="text-lg text-gray-900">{buildingInfo.insurance_policy_number}</p>
                    </div>
                  )}
                  {buildingInfo.insurance_expiry && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                      <p className="text-lg text-gray-900">{new Date(buildingInfo.insurance_expiry).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Facilities */}
            {buildingInfo.facilities && buildingInfo.facilities.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Facilities</h2>
                <div className="flex flex-wrap gap-2">
                  {buildingInfo.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Security Features */}
            {buildingInfo.security_features && buildingInfo.security_features.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Features</h2>
                <div className="flex flex-wrap gap-2">
                  {buildingInfo.security_features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {buildingInfo.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
                <p className="text-gray-700 whitespace-pre-line">{buildingInfo.notes}</p>
              </div>
            )}

            {/* Last Updated */}
            {buildingInfo && (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-600">
      Last updated: {new Date(buildingInfo.updated_at).toLocaleString()}
    </p>
  </div>
)}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Building Information</h3>
            <p className="text-gray-500 mb-4">Get started by adding your building information</p>
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Add Building Information
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default BuildingInfoComponent;