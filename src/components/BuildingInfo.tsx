import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  MapPin, 
  Users, 
  Shield, 
  DollarSign,
  Calendar,
  Phone,
  Mail,
  Home,
  Car,
  Settings,
  Info,
  FileText,
  Star
} from 'lucide-react';
import { BuildingInfo } from '../types';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';

interface DashboardProps {
  user: User | null;
}

const BuildingInfoComponent: React.FC<DashboardProps> = ({user}) => {
  const [buildingInfo, setBuildingInfo] = useState<BuildingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [newFacility, setNewFacility] = useState('');
  const [newSecurityFeature, setNewSecurityFeature] = useState('');

  const [formData, setFormData] = useState<Omit<BuildingInfo, 'id' | 'createdAt' | 'updatedAt'>>({
    buildingName: '',
    buildingAddress: '',
    buildingType: 'condominium',
    totalUnits: 0,
    totalFloors: 0,
    yearBuilt: new Date().getFullYear(),
    propertyManagerName: '',
    propertyManagerCompany: '',
    propertyManagerPhone: '',
    propertyManagerEmail: '',
    jmbName: '',
    jmbMembers: [],
    jmbPhone: '',
    jmbEmail: '',
    maintenanceFee: 0,
    sinkingFund: 0,
    insuranceCompany: '',
    insurancePolicyNumber: '',
    insuranceExpiry: '',
    facilities: [],
    parkingSpaces: 0,
    securityFeatures: [],
    notes: ''
  });

  const fetchBuildingInfo = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('buildingInfo')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setBuildingInfo(data);
        setFormData({
          buildingName: data.buildingName || '',
          buildingAddress: data.buildingAddress || '',
          buildingType: data.buildingType || 'condominium',
          totalUnits: data.totalUnits || 0,
          totalFloors: data.totalFloors || 0,
          yearBuilt: data.yearBuilt || new Date().getFullYear(),
          propertyManagerName: data.propertyManagerName || '',
          propertyManagerCompany: data.propertyManagerCompany || '',
          propertyManagerPhone: data.propertyManagerPhone || '',
          propertyManagerEmail: data.propertyManagerEmail || '',
          jmbName: data.jmbName || '',
          jmbMembers: data.jmbMembers || [],
          jmbPhone: data.jmbPhone || '',
          jmbEmail: data.jmbEmail || '',
          maintenanceFee: data.maintenanceFee || 0,
          sinkingFund: data.sinkingFund || 0,
          insuranceCompany: data.insuranceCompany || '',
          insurancePolicyNumber: data.insurancePolicyNumber || '',
          insuranceExpiry: data.insuranceExpiry || '',
          facilities: data.facilities || [],
          parkingSpaces: data.parkingSpaces || 0,
          securityFeatures: data.securityFeatures || [],
          notes: data.notes || ''
        });
      } else {
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
      if (!formData.buildingName.trim() || !formData.buildingAddress.trim()) {
        throw new Error('Building name and address are required');
      }

      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
        jmbName: formData.jmbName || null,
        jmbPhone: formData.jmbPhone || null,
        jmbEmail: formData.jmbEmail || null,
        jmbMembers: formData.jmbMembers || null,
        insuranceCompany: formData.insuranceCompany || null,
        insurancePolicyNumber: formData.insurancePolicyNumber || null,
        insuranceExpiry: formData.insuranceExpiry || null,
        notes: formData.notes || null
      };

      if (buildingInfo) {
        const { error } = await supabase
          .from('buildingInfo')
          .update(dataToSave)
          .eq('id', buildingInfo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('buildingInfo')
          .insert([{ ...dataToSave, createdAt: new Date().toISOString() }]);

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

  const handleMemberChange = (index: number, updatedMember: { name: string; phone: string; email: string; position: string }) => {
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
      jmbMembers: [...formData.jmbMembers, { name: '', phone: '', email: '', position: '' }]
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
    if (newSecurityFeature.trim() && !formData.securityFeatures.includes(newSecurityFeature.trim())) {
      setFormData({
        ...formData,
        securityFeatures: [...formData.securityFeatures, newSecurityFeature.trim()]
      });
      setNewSecurityFeature('');
    }
  };

  const removeSecurityFeature = (feature: string) => {
    setFormData({
      ...formData,
      securityFeatures: formData.securityFeatures.filter(f => f !== feature)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <span className="text-gray-600 text-lg">Loading building information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {buildingInfo?.buildingName || 'Building Information'}
                </h1>
                <p className="text-blue-100 mt-1">
                  {buildingInfo ? 'Comprehensive building and property details' : 'Set up your building information'}
                </p>
              </div>
            </div>
            {!editing && buildingInfo && (
              <button
                onClick={() => setEditing(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 border border-white/20"
              >
                <Edit className="w-5 h-5" />
                <span>Edit Information</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submitError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-red-700 font-medium">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Home className="w-6 h-6 mr-3" />
                  Basic Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Building Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.buildingName}
                      onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter building name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Building Type</label>
                    <select
                      value={formData.buildingType}
                      onChange={(e) => setFormData({ ...formData, buildingType: e.target.value as BuildingInfo['buildingType'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="condominium">Condominium</option>
                      <option value="apartment">Apartment</option>
                      <option value="townhouse">Townhouse</option>
                      <option value="commercial">Commercial</option>
                      <option value="mixed_use">Mixed Use</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Building Address *</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.buildingAddress}
                      onChange={(e) => setFormData({ ...formData, buildingAddress: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter complete building address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Units</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalUnits}
                      onChange={(e) => setFormData({ ...formData, totalUnits: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Floors</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.totalFloors}
                      onChange={(e) => setFormData({ ...formData, totalFloors: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year Built</label>
                    <input
                      type="number"
                      min="1900"
                      max={new Date().getFullYear()}
                      value={formData.yearBuilt}
                      onChange={(e) => setFormData({ ...formData, yearBuilt: parseInt(e.target.value) || new Date().getFullYear() })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Parking Spaces</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.parkingSpaces}
                      onChange={(e) => setFormData({ ...formData, parkingSpaces: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Property Management Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Users className="w-6 h-6 mr-3" />
                  Property Management
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Name</label>
                    <input
                      type="text"
                      value={formData.propertyManagerName}
                      onChange={(e) => setFormData({ ...formData, propertyManagerName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Management Company</label>
                    <input
                      type="text"
                      value={formData.propertyManagerCompany}
                      onChange={(e) => setFormData({ ...formData, propertyManagerCompany: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Phone</label>
                    <input
                      type="tel"
                      value={formData.propertyManagerPhone}
                      onChange={(e) => setFormData({ ...formData, propertyManagerPhone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Email</label>
                    <input
                      type="email"
                      value={formData.propertyManagerEmail}
                      onChange={(e) => setFormData({ ...formData, propertyManagerEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* JMB Information Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white">Joint Management Body (JMB)</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">JMB Name</label>
                    <input
                      type="text"
                      value={formData.jmbName}
                      onChange={(e) => setFormData({ ...formData, jmbName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">JMB Phone</label>
                    <input
                      type="tel"
                      value={formData.jmbPhone}
                      onChange={(e) => setFormData({ ...formData, jmbPhone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">JMB Email</label>
                    <input
                      type="email"
                      value={formData.jmbEmail}
                      onChange={(e) => setFormData({ ...formData, jmbEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* JMB Members */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-gray-700">JMB Members</label>
                    <button
                      type="button"
                      onClick={addNewMember}
                      className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Member</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.jmbMembers.map((member, index) => (
                      <div key={index} className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                            <input
                              type="text"
                              value={member.name || ''}
                              onChange={(e) => handleMemberChange(index, { ...member, name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                              placeholder="Member name"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={member.phone || ''}
                              onChange={(e) => handleMemberChange(index, { ...member, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="Email address"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMember(index)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Layout for smaller cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Financial Information Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <DollarSign className="w-6 h-6 mr-3" />
                    Financial Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Maintenance Fee (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maintenanceFee}
                        onChange={(e) => setFormData({ ...formData, maintenanceFee: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Sinking Fund (RM)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.sinkingFund}
                        onChange={(e) => setFormData({ ...formData, sinkingFund: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Insurance Information Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Shield className="w-6 h-6 mr-3" />
                    Insurance Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Company</label>
                      <input
                        type="text"
                        value={formData.insuranceCompany}
                        onChange={(e) => setFormData({ ...formData, insuranceCompany: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Policy Number</label>
                      <input
                        type="text"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Expiry Date</label>
                      <input
                        type="date"
                        value={formData.insuranceExpiry}
                        onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Facilities Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Star className="w-6 h-6 mr-3" />
                  Facilities
                </h2>
              </div>
              <div className="p-6">
                <div className="flex space-x-3 mb-6">
                  <input
                    type="text"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    placeholder="Add a facility (e.g., Swimming Pool, Gym, BBQ Area)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFacility())}
                  />
                  <button
                    type="button"
                    onClick={addFacility}
                    className="px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.facilities.map((facility, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-teal-100 text-teal-800 border border-teal-200"
                    >
                      {facility}
                      <button
                        type="button"
                        onClick={() => removeFacility(facility)}
                        className="ml-2 text-teal-600 hover:text-teal-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Features Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Shield className="w-6 h-6 mr-3" />
                  Security Features
                </h2>
              </div>
              <div className="p-6">
                <div className="flex space-x-3 mb-6">
                  <input
                    type="text"
                    value={newSecurityFeature}
                    onChange={(e) => setNewSecurityFeature(e.target.value)}
                    placeholder="Add a security feature (e.g., 24/7 Security, CCTV, Access Card)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSecurityFeature())}
                  />
                  <button
                    type="button"
                    onClick={addSecurityFeature}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.securityFeatures.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-indigo-100 text-indigo-800 border border-indigo-200"
                    >
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeSecurityFeature(feature)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FileText className="w-6 h-6 mr-3" />
                  Additional Notes
                </h2>
              </div>
              <div className="p-6">
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200"
                  placeholder="Any additional information about the building..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : 'transform hover:scale-105'
                }`}
              >
                <Save className="w-5 h-5" />
                <span>{isSubmitting ? 'Saving...' : 'Save Information'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setSubmitError(null);
                  if (buildingInfo) {
                    fetchBuildingInfo();
                  }
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-500 text-white py-4 px-8 rounded-xl font-semibold hover:bg-gray-600 transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg transform hover:scale-105"
              >
                <X className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        ) : (
          // View Mode with new layout
          buildingInfo ? (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <Home className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Units</p>
                      <p className="text-2xl font-bold text-gray-900">{buildingInfo.totalUnits}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-100">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Floors</p>
                      <p className="text-2xl font-bold text-gray-900">{buildingInfo.totalFloors}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-purple-100">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <Car className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Parking Spaces</p>
                      <p className="text-2xl font-bold text-gray-900">{buildingInfo.parkingSpaces}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-orange-100">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Year Built</p>
                      <p className="text-2xl font-bold text-gray-900">{buildingInfo.yearBuilt}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Home className="w-6 h-6 mr-3" />
                    Basic Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Building Name</p>
                        <p className="text-xl font-bold text-gray-900">{buildingInfo.buildingName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Building Type</p>
                        <p className="text-lg text-gray-900 capitalize">{buildingInfo.buildingType.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
                      <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-xl">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-900">{buildingInfo.buildingAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Property Management */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <Users className="w-6 h-6 mr-3" />
                      Property Management
                    </h2>
                  </div>
                  <div className="p-6 space-y-4">
                    {buildingInfo.propertyManagerName && (
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Users className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Manager</p>
                          <p className="font-semibold text-gray-900">{buildingInfo.propertyManagerName}</p>
                        </div>
                      </div>
                    )}
                    {buildingInfo.propertyManagerCompany && (
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Building2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Company</p>
                          <p className="font-semibold text-gray-900">{buildingInfo.propertyManagerCompany}</p>
                        </div>
                      </div>
                    )}
                    {buildingInfo.propertyManagerPhone && (
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-semibold text-gray-900">{buildingInfo.propertyManagerPhone}</p>
                        </div>
                      </div>
                    )}
                    {buildingInfo.propertyManagerEmail && (
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Mail className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-semibold text-gray-900">{buildingInfo.propertyManagerEmail}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* JMB Information */}
                {(buildingInfo.jmbName || buildingInfo.jmbMembers?.length > 0) && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                      <h2 className="text-xl font-semibold text-white">Joint Management Body (JMB)</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      {buildingInfo.jmbName && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Building2 className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">JMB Name</p>
                            <p className="font-semibold text-gray-900">{buildingInfo.jmbName}</p>
                          </div>
                        </div>
                      )}
                      {buildingInfo.jmbPhone && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Phone className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-semibold text-gray-900">{buildingInfo.jmbPhone}</p>
                          </div>
                        </div>
                      )}
                      {buildingInfo.jmbEmail && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Mail className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-semibold text-gray-900">{buildingInfo.jmbEmail}</p>
                          </div>
                        </div>
                      )}
                      {buildingInfo.jmbMembers?.length > 0 && (
                        <div className="mt-6">
                          <p className="text-sm font-medium text-gray-500 mb-3">JMB Members</p>
                          <div className="space-y-3">
                            {buildingInfo.jmbMembers.map((member, index) => (
                              <div key={index} className="bg-purple-50 p-3 rounded-lg">
                                <p className="font-semibold text-gray-900">{member.name}</p>
                                <div className="text-sm text-gray-600 space-y-1">
                                  {member.phone && <p>📞 {member.phone}</p>}
                                  {member.email && <p>✉️ {member.email}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial & Insurance Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Financial Information */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <DollarSign className="w-6 h-6 mr-3" />
                      Financial Information
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-500">Monthly Maintenance Fee</p>
                        <p className="text-2xl font-bold text-gray-900">RM {buildingInfo.maintenanceFee.toFixed(2)}</p>
                      </div>
                      <div className="bg-yellow-100 p-3 rounded-xl">
                        <DollarSign className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-500">Sinking Fund</p>
                        <p className="text-2xl font-bold text-gray-900">RM {buildingInfo.sinkingFund.toFixed(2)}</p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-xl">
                        <DollarSign className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance Information */}
                {(buildingInfo.insuranceCompany || buildingInfo.insurancePolicyNumber) && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4">
                      <h2 className="text-xl font-semibold text-white flex items-center">
                        <Shield className="w-6 h-6 mr-3" />
                        Insurance Information
                      </h2>
                    </div>
                    <div className="p-6 space-y-4">
                      {buildingInfo.insuranceCompany && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <Shield className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Insurance Company</p>
                            <p className="font-semibold text-gray-900">{buildingInfo.insuranceCompany}</p>
                          </div>
                        </div>
                      )}
                      {buildingInfo.insurancePolicyNumber && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <FileText className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Policy Number</p>
                            <p className="font-semibold text-gray-900">{buildingInfo.insurancePolicyNumber}</p>
                          </div>
                        </div>
                      )}
                      {buildingInfo.insuranceExpiry && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <Calendar className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Expiry Date</p>
                            <p className="font-semibold text-gray-900">{new Date(buildingInfo.insuranceExpiry).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Facilities */}
                {buildingInfo.facilities && buildingInfo.facilities.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-4">
                      <h2 className="text-xl font-semibold text-white flex items-center">
                        <Star className="w-6 h-6 mr-3" />
                        Facilities
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {buildingInfo.facilities.map((facility, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-3 bg-teal-50 rounded-xl border border-teal-100"
                          >
                            <div className="bg-teal-100 p-2 rounded-lg">
                              <Star className="w-4 h-4 text-teal-600" />
                            </div>
                            <span className="text-gray-900 font-medium">{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Features */}
                {buildingInfo.securityFeatures && buildingInfo.securityFeatures.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                      <h2 className="text-xl font-semibold text-white flex items-center">
                        <Shield className="w-6 h-6 mr-3" />
                        Security Features
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {buildingInfo.securityFeatures.map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100"
                          >
                            <div className="bg-indigo-100 p-2 rounded-lg">
                              <Shield className="w-4 h-4 text-indigo-600" />
                            </div>
                            <span className="text-gray-900 font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {buildingInfo.notes && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <FileText className="w-6 h-6 mr-3" />
                      Additional Notes
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-gray-700 whitespace-pre-line leading-relaxed">{buildingInfo.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Last Updated */}
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-600">
                  <Info className="w-4 h-4 inline mr-2" />
                  Last updated: {new Date(buildingInfo.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-100">
              <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Building Information</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">Get started by adding your building information to manage your property effectively</p>
              <button
                onClick={() => setEditing(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
              >
                Add Building Information
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default BuildingInfoComponent;