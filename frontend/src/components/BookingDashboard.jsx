// frontend/src/components/BookingDashboard.jsx
import React, { useState, useEffect } from 'react';
import bookingAPI from '../api/bookingApi';

const BookingDashboard = ({ userRole }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, [filter, page]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        ...(filter !== 'all' && { status: filter })
      };
      
      const response = await bookingAPI.getUserBookings(params);
      setBookings(response.data.bookings || []);
      setPagination(response.data.pagination || {});
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status, additionalData = {}) => {
    try {
      setActionLoading(true);
      const response = await bookingAPI.updateBookingStatus(bookingId, {
        status,
        ...additionalData
      });
      
      if (response.success) {
        // Update the booking in the list
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId ? { ...booking, ...response.data } : booking
        ));
        setShowModal(false);
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error('Error updating booking:', err);
      alert(err.message || 'Failed to update booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickApprove = async (bookingId, meetingLink = '') => {
    try {
      setActionLoading(true);
      const response = await bookingAPI.approveBooking(bookingId, meetingLink);
      
      if (response.success) {
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId ? { ...booking, ...response.data } : booking
        ));
      }
    } catch (err) {
      console.error('Error approving booking:', err);
      alert(err.message || 'Failed to approve booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickCancel = async (bookingId, reason) => {
    try {
      setActionLoading(true);
      const response = await bookingAPI.cancelBooking(bookingId, reason);
      
      if (response.success) {
        setBookings(prev => prev.map(booking => 
          booking._id === bookingId ? { ...booking, ...response.data } : booking
        ));
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeSlot) => {
    return timeSlot.replace('-', ' - ');
  };

  const getModeIcon = (mode) => {
    const icons = {
      online: '💻',
      'in-person': '🏢',
      phone: '📞'
    };
    return icons[mode] || '📅';
  };

  const canApprove = (booking) => {
    return userRole === 'counsellor' && booking.status === 'pending';
  };
// Also add this check to ensure userRole is properly detected
useEffect(() => {
  console.log('User role in BookingDashboard:', userRole);
  console.log('Bookings:', bookings);
}, [userRole, bookings]);

  const canCancel = (booking) => {
    return ['pending', 'confirmed'].includes(booking.status);
  };

  const canComplete = (booking) => {
    return userRole === 'counsellor' && booking.status === 'confirmed';
  };

  const BookingCard = ({ booking }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-xl">{getModeIcon(booking.mode)}</span>
            <div>
              <h3 className="font-semibold text-gray-900">
                {userRole === 'student' ? booking.counselor?.fullName : booking.student?.fullName}
              </h3>
              <p className="text-sm text-gray-600">
                {userRole === 'student' ? 'Counselor' : 'Student'}
              </p>
            </div>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Date:</strong> {formatDate(booking.date)}</p>
            <p><strong>Time:</strong> {formatTime(booking.timeSlot)}</p>
            <p><strong>Mode:</strong> <span className="capitalize">{booking.mode}</span></p>
            {booking.reason && (
              <p><strong>Reason:</strong> {booking.reason}</p>
            )}
          </div>
        </div>
        
        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      {booking.meetingLink && booking.status === 'confirmed' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800 mb-2"><strong>Meeting Link:</strong></p>
          <a 
            href={booking.meetingLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm break-all"
          >
            {booking.meetingLink}
          </a>
        </div>
      )}

      {booking.cancellationReason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800"><strong>Cancellation Reason:</strong> {booking.cancellationReason}</p>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => {
            setSelectedBooking(booking);
            setShowModal(true);
          }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View Details
        </button>

        {canApprove(booking) && (
          <button
            onClick={() => {
              const meetingLink = booking.mode === 'online' ? 
                prompt('Enter meeting link (optional):') : '';
              if (meetingLink !== null) {
                handleQuickApprove(booking._id, meetingLink);
              }
            }}
            disabled={actionLoading}
            className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
          >
            Approve
          </button>
        )}

        {canCancel(booking) && (
          <button
            onClick={() => {
              const reason = prompt('Enter cancellation reason:');
              if (reason) {
                handleQuickCancel(booking._id, reason);
              }
            }}
            disabled={actionLoading}
            className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        )}

        {canComplete(booking) && (
          <button
            onClick={() => handleStatusUpdate(booking._id, 'completed')}
            disabled={actionLoading}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
          >
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );

  const BookingModal = () => {
    if (!selectedBooking) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {userRole === 'student' ? 'Counselor' : 'Student'}
                  </label>
                  <div className="flex items-center space-x-3">
                    <img
                      src={(userRole === 'student' ? selectedBooking.counselor?.avatar : selectedBooking.student?.avatar) || '/default-avatar.png'}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">
                        {userRole === 'student' ? selectedBooking.counselor?.fullName : selectedBooking.student?.fullName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {userRole === 'student' ? selectedBooking.counselor?.email : selectedBooking.student?.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p className="text-gray-900">{formatDate(selectedBooking.date)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <p className="text-gray-900">{formatTime(selectedBooking.timeSlot)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Session Mode</label>
                <div className="flex items-center space-x-2">
                  <span>{getModeIcon(selectedBooking.mode)}</span>
                  <span className="capitalize">{selectedBooking.mode}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedBooking.reason}</p>
              </div>

              {selectedBooking.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md">{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.meetingLink && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                  <a 
                    href={selectedBooking.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {selectedBooking.meetingLink}
                  </a>
                </div>
              )}

              {selectedBooking.cancellationReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason</label>
                  <p className="text-gray-900 bg-red-50 p-3 rounded-md border border-red-200">{selectedBooking.cancellationReason}</p>
                </div>
              )}

              {selectedBooking.sessionNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Notes</label>
                  <p className="text-gray-900 bg-blue-50 p-3 rounded-md border border-blue-200">{selectedBooking.sessionNotes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Close
              </button>

              {canApprove(selectedBooking) && (
                <button
                  onClick={() => {
                    const meetingLink = selectedBooking.mode === 'online' ? 
                      prompt('Enter meeting link (optional):') : '';
                    if (meetingLink !== null) {
                      handleQuickApprove(selectedBooking._id, meetingLink);
                    }
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                  Approve
                </button>
              )}

              {canCancel(selectedBooking) && (
                <button
                  onClick={() => {
                    const reason = prompt('Enter cancellation reason:');
                    if (reason) {
                      handleQuickCancel(selectedBooking._id, reason);
                    }
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {userRole === 'counsellor' ? 'Counseling Sessions' : 'Counsellor Dashboard '}
        </h1>
        <p className="text-gray-600">
          {userRole === 'counsellor' 
            ? 'Manage your upcoming and past counseling sessions'
            : 'View and manage your counseling session bookings'
          }
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-4" aria-label="Filter">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'You don\'t have any bookings yet.' 
              : `No ${filter} bookings found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={!pagination.hasPrev}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 border rounded-md ${
                  pageNum === pagination.page
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
            disabled={!pagination.hasNext}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && <BookingModal />}
    </div>
  );
};

export default BookingDashboard;

