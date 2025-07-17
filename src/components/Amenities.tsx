import React, { useState, useEffect } from 'react';
import { Clock, Users, DollarSign, X, AlertCircle } from 'lucide-react';
import { Amenity, Booking } from '../types';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';

interface DashboardProps {
  user: User | null; // ✅ Declare the prop
}

const Amenities: React.FC<DashboardProps> = ({ user }) => {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [newBooking, setNewBooking] = useState<Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'amenityId' | 'totalCost'>>({
    residentName: '',
    residentUnit: '',
    residentEmail: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    guestsCount: 1,
    status: 'pending',
    notes: '',
    createdAt: '',
    updatedAt: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [amenitiesResponse, bookingsResponse] = await Promise.all([
        supabase.from('amenities').select('*').order('name'),
        supabase.from('bookings').select('*').order('bookingDate', { ascending: false })
      ]);

      if (amenitiesResponse.error) throw amenitiesResponse.error;
      if (bookingsResponse.error) throw bookingsResponse.error;

      setAmenities(amenitiesResponse.data || []);
      setBookings(bookingsResponse.data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAmenityIcon = (type: Amenity['type']) => {
    switch (type) {
      case 'gym': return '🏋️';
      case 'pool': return '🏊';
      case 'bbqArea': return '🔥';
      case 'clubhouse': return '🏛️';
      case 'tennisCourt': return '🎾';
      case 'playground': return '🛝';
      case 'parking': return '🚗';
      default: return '🏢';
    }
  };

  const getStatusColor = (status: Amenity['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800'
    };
    return colors[status];
  };

  const getBookingStatusColor = (status: Booking['status']) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status];
  };

  const handleBookAmenity = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setShowBookingModal(true);
    setNewBooking({
      residentName: '',
      residentUnit: '',
      residentEmail: '',
      bookingDate: '',
      startTime: '',
      endTime: '',
      guestsCount: 1,
      status: 'pending',
      notes: ''
    });
  };

  const calculateTotalCost = () => {
    if (!selectedAmenity || !newBooking.startTime || !newBooking.endTime) return 0;
    
    const start = new Date(`2000-01-01T${newBooking.startTime}`);
    const end = new Date(`2000-01-01T${newBooking.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, hours * selectedAmenity.hourlyRate);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenity) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!newBooking.residentName.trim() || !newBooking.residentUnit.trim() || !newBooking.residentEmail.trim()) {
        throw new Error('Please fill in all required fields');
      }

      const totalCost = calculateTotalCost();

      const { error } = await supabase
        .from('bookings')
        .insert([{
          amenityId: selectedAmenity.id,
          residentName: newBooking.residentName,
          residentUnit: newBooking.residentUnit,
          residentEmail: newBooking.residentEmail,
          bookingDate: newBooking.bookingDate,
          startTime: newBooking.startTime,
          endTime: newBooking.endTime,
          guestsCount: newBooking.guestsCount,
          totalCost: totalCost,
          status: 'pending',
          notes: newBooking.notes || null
        }]);

      if (error) throw error;

      await fetchData();
      setShowBookingModal(false);
      setSelectedAmenity(null);
    } catch (error) {
      console.error('Error creating booking:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAmenityName = (amenityId: string) => {
    const amenity = amenities.find(a => a.id === amenityId);
    return amenity ? amenity.name : 'Unknown Amenity';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-gray-500 text-lg">Loading amenities...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Amenities & Booking</h1>
        <p className="text-gray-600">Reserve community facilities and manage bookings</p>
      </div>

      {/* Amenities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {amenities.map(amenity => (
          <div key={amenity.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getAmenityIcon(amenity.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{amenity.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{amenity.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(amenity.status)}`}>
                  {amenity.status}
                </span>
              </div>

              {amenity.description && (
                <p className="text-sm text-gray-600 mb-4">{amenity.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Capacity: {amenity.capacity} people</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Hours: {amenity.availableHours}</span>
                </div>
                {amenity.hourlyRate > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>${amenity.hourlyRate}/hour</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleBookAmenity(amenity)}
                disabled={amenity.status !== 'active'}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
                  amenity.status === 'active'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {amenity.status === 'active' ? 'Book Now' : 'Unavailable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Bookings</h2>
        <div className="space-y-4">
          {bookings.slice(0, 10).map(booking => (
            <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{getAmenityName(booking.amenityId)}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {booking.residentName} • Unit {booking.residentUnit}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(booking.bookingDate).toLocaleDateString()} • {booking.startTime} - {booking.endTime}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  ${booking.totalCost.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {booking.guestsCount} guest{booking.guestsCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedAmenity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Book {selectedAmenity.name}</h2>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedAmenity(null);
                    setSubmitError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Amenity Info */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getAmenityIcon(selectedAmenity.type)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedAmenity.name}</h3>
                    <p className="text-sm text-gray-600">Capacity: {selectedAmenity.capacity} people</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Available: {selectedAmenity.availableHours}</p>
                {selectedAmenity.hourlyRate > 0 && (
                  <p className="text-sm font-medium text-blue-700">${selectedAmenity.hourlyRate}/hour</p>
                )}
              </div>

              {selectedAmenity.rules && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-800 mb-1">Rules & Guidelines</h4>
                      <p className="text-sm text-amber-700">{selectedAmenity.rules}</p>
                    </div>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmitBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resident Name *</label>
                    <input
                      type="text"
                      required
                      value={newBooking.residentName}
                      onChange={(e) => setNewBooking({ ...newBooking, residentName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
                    <input
                      type="text"
                      required
                      value={newBooking.residentUnit}
                      onChange={(e) => setNewBooking({ ...newBooking, residentUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newBooking.residentEmail}
                    onChange={(e) => setNewBooking({ ...newBooking, residentEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Booking Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={newBooking.bookingDate}
                    onChange={(e) => setNewBooking({ ...newBooking, bookingDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      required
                      value={newBooking.startTime}
                      onChange={(e) => setNewBooking({ ...newBooking, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      required
                      value={newBooking.endTime}
                      onChange={(e) => setNewBooking({ ...newBooking, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedAmenity.capacity}
                    value={newBooking.guestsCount}
                    onChange={(e) => setNewBooking({ ...newBooking, guestsCount: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requests or notes..."
                  />
                </div>

                {selectedAmenity.hourlyRate > 0 && newBooking.startTime && newBooking.endTime && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                      <span className="text-lg font-bold text-blue-600">${calculateTotalCost().toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Booking...' : 'Submit Booking'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false);
                      setSelectedAmenity(null);
                      setSubmitError(null);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Amenities;