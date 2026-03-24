import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BookingComponent from '../components/BookingComponent';
import { AlertCircle, Calendar, Clock, User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const Booking = () => {
  const { user, token, loading, authChecked, isStudent } = useAuth();
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();

  // ── If student arrived from a forum ad, this will be the counsellor's _id ──
  const preselectedCounsellorId = searchParams.get('counsellor') || null;

  const [recentBookings,  setRecentBookings]  = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error,           setError]           = useState('');

  useEffect(() => {
    if (!authChecked || loading) return;
    if (!user || !token)         { navigate('/login'); return; }
    if (user.role !== 'student') { navigate('/counsellorDashboard'); return; }
    loadRecentBookings();
  }, [user, token, loading, authChecked, navigate]);

  const loadRecentBookings = async () => {
    try {
      const res  = await fetch(`${API_BASE}/bookings`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setRecentBookings(data.data?.bookings?.slice(0, 3) || []);
      }
    } catch (err) {
      setError('Failed to load recent bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingCreated = (newBooking) => {
    if (newBooking) setRecentBookings(prev => [newBooking, ...prev.slice(0, 2)]);
  };

  const getStatusColor = (status) => ({
    payment_pending: 'bg-purple-100 text-purple-800 border-purple-200',
    pending:         'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed:       'bg-green-100  text-green-800  border-green-200',
    cancelled:       'bg-red-100    text-red-800    border-red-200',
    completed:       'bg-blue-100   text-blue-800   border-blue-200',
  }[status] || 'bg-gray-100 text-gray-800 border-gray-200');

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday:'short', year:'numeric', month:'short', day:'numeric' });
  const fmtSlot = (s) => s?.replace('-', ' – ');

  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only students can access the booking page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Book a Counselling Session</h1>
          <p className="mt-2 text-lg text-gray-600">Take the first step towards better mental health</p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-left max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Welcome, <strong>{user.fullName}</strong>!{' '}
                {preselectedCounsellorId
                  ? 'Pick a date and time to book your session.'
                  : 'Schedule a confidential session with one of our qualified counsellors.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Booking form — spans 2 columns */}
          <div className="lg:col-span-2">
            <BookingComponent
              onBookingCreated={handleBookingCreated}
              preselectedCounsellorId={preselectedCounsellorId}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Guidelines */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />Booking Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {[
                  'Book up to 30 days in advance',
                  'Online, phone, or in-person sessions available',
                  'In-person sessions have a ₹100 surcharge',
                  'Cancel up to 2 hours before session (confirmed)',
                  'Paid cancellations >24h before get a full refund',
                  'Email confirmation once counsellor approves',
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />{t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent bookings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-500" />Recent Bookings
              </h3>
              {bookingsLoading ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  <p className="text-sm text-gray-500 mt-2">Loading…</p>
                </div>
              ) : error ? (
                <p className="text-sm text-red-600 text-center py-4">{error}</p>
              ) : recentBookings.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Calendar className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map(b => (
                    <div key={b._id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-medium text-gray-900">{b.counselor?.fullName || 'N/A'}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(b.status)}`}>
                          {b.status === 'payment_pending' ? 'Awaiting Payment' : b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{fmtDate(b.date)} · {fmtSlot(b.timeSlot)}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{b.reason}</p>
                    </div>
                  ))}
                  <button onClick={() => navigate('/all-bookings')}
                    className="w-full text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium pt-2 border-t border-gray-100">
                    View All Bookings →
                  </button>
                </div>
              )}
            </div>

            {/* Crisis support */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />Need Urgent Help?
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-red-800 font-medium text-xs mb-1">Crisis Support</p>
                <p className="text-red-800 font-bold text-sm">Emergency: 112</p>
                <p className="text-red-800 font-bold text-sm">iCall: 9152987821</p>
                <p className="text-red-800 font-bold text-sm">Vandrevala: 1860-2662-345</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 font-medium text-xs mb-1">Technical Support</p>
                <p className="text-blue-700 text-xs">support@mindcare.com</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
