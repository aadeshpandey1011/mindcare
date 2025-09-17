// frontend/src/components/BookingCard.jsx
import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Video, 
  MapPin,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatDate, formatTime, canCancelBooking } from '../utils/dateUtils';

const BookingCard = ({ booking, onStatusUpdate, userRole }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'online':
        return <Video className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'in-person':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setIsUpdating(true);
    try {
      await onStatusUpdate(booking._id, 'cancelled', cancellationReason);
      setShowCancelModal(false);
      setCancellationReason('');
    } catch (error) {
      console.error('Cancel booking error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isUpcoming = new Date(booking.date) > new Date();
  const canCancel = canCancelBooking(booking.date, booking.timeSlot) && 
                   ['pending', 'confirmed'].includes(booking.status);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="flex-1">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {booking.counselor?.fullName || 'N/A'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {booking.counselor?.specialization || 'General Counseling'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 text-xs font-medium rounded-full border flex items-center space-x-1 ${getStatusColor(booking.status)}`}>
                  {getStatusIcon(booking.status)}
                  <span className="capitalize">{booking.status}</span>
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(booking.date)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{formatTime(booking.timeSlot)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {getModeIcon(booking.mode)}
                <span className="capitalize">{booking.mode}</span>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Reason: </span>
                {booking.reason}
              </p>
              {booking.notes && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Notes: </span>
                  {booking.notes}
                </p>
              )}
            </div>

            {/* Meeting Link */}
            {booking.meetingLink && booking.status === 'confirmed' && (
              <div className="mb-4">
                <a
                  href={booking.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Join Meeting</span>
                </a>
              </div>
            )}

            {/* Cancellation Reason */}
            {booking.status === 'cancelled' && booking.cancellationReason && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Cancellation Reason: </span>
                  {booking.cancellationReason}
                </p>
              </div>
            )}

            {/* Session Notes */}
            {booking.status === 'completed' && booking.sessionNotes && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Session Notes: </span>
                  {booking.sessionNotes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              >
                Cancel Booking
              </button>
            )}
            
            {booking.status === 'confirmed' && booking.meetingLink && isUpcoming && (
              <a
                href={booking.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 transition-colors"
              >
                <Video className="h-4 w-4 mr-2" />
                Join Session
              </a>
            )}

            <div className="text-xs text-gray-500">
              Booked: {formatDate(booking.createdAt)}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Please provide a reason for cancelling this booking:
            </p>
            
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={3}
              maxLength={200}
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isUpdating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isUpdating || !cancellationReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  'Cancel Booking'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingCard;