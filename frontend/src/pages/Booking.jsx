
//booking.jsx
// import React, { useState } from "react";
// import axios from "axios";
// import { useAuth } from "../context/AuthContext";

// export default function Booking() {
//   const { token } = useAuth();
//   const [date, setDate] = useState("");
//   const [note, setNote] = useState("");

//   const book = async () => {
//     try {
//       await axios.post(
//         "http://localhost:5000/api/v1/bookings",
//         { date, note },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       alert("Appointment booked successfully!");
//     } catch (err) {
//       alert("Booking failed");
//     }
//   };

//   return (
//     <div className="max-w-lg mx-auto p-6">
//       <h2 className="text-2xl font-bold mb-4">Book Appointment</h2>
//       <input
//         type="date"
//         className="border p-2 w-full mb-4"
//         value={date}
//         onChange={(e) => setDate(e.target.value)}
//       />
//       <textarea
//         className="border p-2 w-full mb-4"
//         placeholder="Reason for booking"
//         value={note}
//         onChange={(e) => setNote(e.target.value)}
//       />
//       <button onClick={book} className="px-4 py-2 bg-blue-600 text-white rounded">
//         Book
//       </button>
//     </div>
//   );
// }



// frontend/src/pages/Booking.jsx
// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import BookingComponent from '../components/BookingComponent';
// import { AlertCircle, Calendar, Clock, User } from 'lucide-react';

// const Booking = () => {
//   const { user, token } = useAuth();
//   const navigate = useNavigate();
//   const [recentBookings, setRecentBookings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     // Check if user is authenticated and is a student
//     if (!user) {
//       navigate('/login');
//       return;
//     }

//     // if (user.role === 'counsellor' || 'admin') {
//     //   navigate('/counsellorDashboard');
//     //   return;
//   // }
//     if (user.role !== 'student') {
//       navigate('/counsellorDashboard');
//       return;
//     }
//     // if (user.role === 'student') {
//     //   navigate('/booking');
//     //   return;
//     // }

//     loadRecentBookings();
//   }, [user, navigate]);

//   const loadRecentBookings = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/api/v1/bookings', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const data = await response.json();
//         // Get last 3 bookings for display
//         setRecentBookings(data.data.bookings.slice(0, 3) || []);
//       }
//     } catch (err) {
//       console.error('Error loading recent bookings:', err);
//       setError('Failed to load recent bookings');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBookingCreated = (newBooking) => {
//     // Add the new booking to recent bookings
//     setRecentBookings(prev => [newBooking, ...prev.slice(0, 2)]);
    
//     // Optional: Show success message or redirect
//     setTimeout(() => {
//       navigate('/dashboard');
//     }, 2000);
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
//       confirmed: 'bg-green-100 text-green-800 border-green-200',
//       cancelled: 'bg-red-100 text-red-800 border-red-200',
//       completed: 'bg-blue-100 text-blue-800 border-blue-200'
//     };
//     return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
//   };

//   const formatDate = (dateString) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       weekday: 'short',
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const formatTime = (timeSlot) => {
//     return timeSlot.replace('-', ' - ');
//   };

//   if (!user || user.role !== 'student') {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
//           <p className="text-gray-600">Only students can access the booking page.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="text-center">
//             <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
//               Book a Counseling Session
//             </h1>
//             <p className="mt-3 text-xl text-gray-600">
//               Take the first step towards better mental health
//             </p>
//           </div>

//           {/* Welcome Message */}
//           <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
//             <div className="flex items-start">
//               <User className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
//               <div>
//                 <h3 className="text-sm font-medium text-blue-800">
//                   Welcome, {user.fullName}!
//                 </h3>
//                 <p className="text-sm text-blue-700 mt-1">
//                   Schedule a confidential counseling session with one of our qualified counselors.
//                   All sessions are completely private and designed to support your mental wellbeing.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Booking Form */}
//           <div className="lg:col-span-2">
//             <BookingComponent onBookingCreated={handleBookingCreated} />
//           </div>

//           {/* Sidebar */}
//           <div className="lg:col-span-1">
//             <div className="space-y-6">
//               {/* Guidelines Card */}
//               <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                   <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
//                   Booking Guidelines
//                 </h3>
//                 <ul className="space-y-3 text-sm text-gray-600">
//                   <li className="flex items-start">
//                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
//                     Sessions can be booked up to 30 days in advance
//                   </li>
//                   <li className="flex items-start">
//                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
//                     Choose from online, in-person, or phone sessions
//                   </li>
//                   <li className="flex items-start">
//                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
//                     Cancellations are allowed up to 2 hours before the session
//                   </li>
//                   <li className="flex items-start">
//                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
//                     You'll receive email confirmation once approved
//                   </li>
//                   <li className="flex items-start">
//                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
//                     All sessions are confidential and professional
//                   </li>
//                 </ul>
//               </div>

//               {/* Recent Bookings */}
//               <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                   <Calendar className="h-5 w-5 text-green-500 mr-2" />
//                   Recent Bookings
//                 </h3>

//                 {loading ? (
//                   <div className="text-center py-4">
//                     <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
//                     <p className="text-sm text-gray-500 mt-2">Loading...</p>
//                   </div>
//                 ) : error ? (
//                   <div className="text-center py-4">
//                     <p className="text-sm text-red-600">{error}</p>
//                   </div>
//                 ) : recentBookings.length === 0 ? (
//                   <div className="text-center py-4">
//                     <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
//                     <p className="text-sm text-gray-500">No recent bookings</p>
//                     <p className="text-xs text-gray-400 mt-1">
//                       Your booking history will appear here
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {recentBookings.map((booking) => (
//                       <div
//                         key={booking._id}
//                         className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
//                       >
//                         <div className="flex justify-between items-start mb-2">
//                           <div className="flex-1">
//                             <p className="text-sm font-medium text-gray-900">
//                               {booking.counselor?.fullName || 'N/A'}
//                             </p>
//                             <p className="text-xs text-gray-600">
//                               {formatDate(booking.date)} at {formatTime(booking.timeSlot)}
//                             </p>
//                           </div>
//                           <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
//                             {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
//                           </span>
//                         </div>
//                         <p className="text-xs text-gray-500 line-clamp-2">
//                           {booking.reason}
//                         </p>
//                       </div>
//                     ))}
                    
//                     <div className="pt-2 border-t border-gray-100">
//                       <button
//                         onClick={() => navigate('/all-bookings')}
//                         className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
//                       >
//                         View All Bookings
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Support Information */}
//               <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
//                   <Clock className="h-5 w-5 text-purple-500 mr-2" />
//                   Need Help?
//                 </h3>
//                 <div className="space-y-3 text-sm text-gray-600">
//                   <p>
//                     Our counseling team is here to support you through any mental health challenges.
//                   </p>
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//                     <p className="text-red-800 font-medium text-xs mb-1">Crisis Support</p>
//                     <p className="text-red-700 text-xs">
//                       If you're experiencing a mental health emergency, please contact:
//                     </p>
//                     <p className="text-red-800 font-bold text-sm mt-1">
//                       Emergency: 112        
                  
//                     </p>
//                     <p className="text-red-800 font-bold text-sm mt-1">   
//                       Mental Health Support : 14416
//                     </p>
//                   </div>
//                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
//                     <p className="text-blue-800 font-medium text-xs mb-1">Technical Support</p>
//                     <p className="text-blue-700 text-xs">
//                       Having trouble with booking? Contact support at:
//                     </p>
//                     <p className="text-blue-800 font-medium text-xs mt-1">
//                       support@mentalhealthsupport.com
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Booking; 
/// the above one is working version









import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BookingComponent from '../components/BookingComponent';
import { AlertCircle, Calendar, Clock, User } from 'lucide-react';

const Booking = () => {
  const { user, token, loading, authChecked, isStudent } = useAuth();
  const navigate = useNavigate();
  const [recentBookings, setRecentBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ Only redirect AFTER auth is fully checked and loading is complete
  useEffect(() => {
    // Wait for auth to be fully resolved
    if (!authChecked || loading) return;

    // If not authenticated, redirect to login
    if (!user || !token) {
      navigate('/login');
      return;
    }

    // If not a student, redirect to appropriate dashboard
    if (user.role !== 'student') {
      navigate('/counsellorDashboard');
      return;
    }

    // If we reach here, user is authenticated and is a student
    loadRecentBookings();
  }, [user, token, loading, authChecked, navigate]);

  const loadRecentBookings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecentBookings(data.data.bookings.slice(0, 3) || []);
      }
    } catch (err) {
      console.error('Error loading recent bookings:', err);
      setError('Failed to load recent bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleBookingCreated = (newBooking) => {
    setRecentBookings(prev => [newBooking, ...prev.slice(0, 2)]);
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
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

  // ✅ Show loading spinner while auth is being checked
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ✅ Access control - only show after auth is confirmed
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
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Book a Counseling Session
            </h1>
            <p className="mt-3 text-xl text-gray-600">
              Take the first step towards better mental health
            </p>
          </div>

          {/* Welcome Message */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <User className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Welcome, {user.fullName}!
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Schedule a confidential counseling session with one of our qualified counselors.
                  All sessions are completely private and designed to support your mental wellbeing.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Booking Form */}
          <div className="lg:col-span-2">
            <BookingComponent onBookingCreated={handleBookingCreated} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Guidelines Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
                  Booking Guidelines
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Sessions can be booked up to 30 days in advance
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Choose from online, in-person, or phone sessions
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Cancellations are allowed up to 2 hours before the session
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    You'll receive email confirmation once approved
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    All sessions are confidential and professional
                  </li>
                </ul>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 text-green-500 mr-2" />
                  Recent Bookings
                </h3>

                {bookingsLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-4">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent bookings</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Your booking history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentBookings.map((booking) => (
                      <div
                        key={booking._id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {booking.counselor?.fullName || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-600">
                              {formatDate(booking.date)} at {formatTime(booking.timeSlot)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {booking.reason}
                        </p>
                      </div>
                    ))}
                    
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        onClick={() => navigate('/all-bookings')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View All Bookings
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Support Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 text-purple-500 mr-2" />
                  Need Help?
                </h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    Our counseling team is here to support you through any mental health challenges.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 font-medium text-xs mb-1">Crisis Support</p>
                    <p className="text-red-700 text-xs">
                      If you're experiencing a mental health emergency, please contact:
                    </p>
                    <p className="text-red-800 font-bold text-sm mt-1">
                      Emergency: 112        
                    </p>
                    <p className="text-red-800 font-bold text-sm mt-1">   
                      Mental Health Support: 14416
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 font-medium text-xs mb-1">Technical Support</p>
                    <p className="text-blue-700 text-xs">
                      Having trouble with booking? Contact support at:
                    </p>
                    <p className="text-blue-800 font-medium text-xs mt-1">
                      support@mentalhealthsupport.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;