import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BookingCard from "../components/BookingCard";
import BookingFilters from "../components/BookingFilters";
import {
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

const AllBookings = () => {
  const { user, token, loading, authChecked, isStudent } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    mode: "all",
    dateRange: "all",
  });

  // ✅ Only redirect AFTER auth is fully checked
  useEffect(() => {
    // Wait for auth to be fully resolved
    if (!authChecked || loading) return;

    // If not authenticated, redirect to login
    if (!user || !token) {
      navigate('/login');
      return;
    }

    // If not a student, redirect to login
    if (user.role !== 'student') {
      navigate('/login');
      return;
    }

    // If we reach here, user is authenticated and is a student
    loadBookings();
  }, [authChecked, loading, user, token, navigate, pagination.page]);

  // ✅ Apply filters when data changes
  useEffect(() => {
    applyFilters();
  }, [bookings, searchTerm, filters]);

  // Load bookings from API
  const loadBookings = async () => {
    setBookingsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(
        `http://localhost:5000/api/v1/bookings?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();

      if (data.success) {
        setBookings(data.data.bookings || []);
        setPagination((prev) => ({
          ...prev,
          totalPages: data.data.pagination?.totalPages || 1,
        }));
        setError("");
      } else {
        setError(data.message || "Failed to load bookings");
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
      setError("Failed to load bookings. Please try again.");
    } finally {
      setBookingsLoading(false);
    }
  };

  // Apply filters + search on client side
  const applyFilters = () => {
    let filtered = [...bookings];

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (b) =>
          b.counselor?.fullName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          b.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((b) => b.status === filters.status);
    }

    if (filters.mode !== "all") {
      filtered = filtered.filter((b) => b.mode === filters.mode);
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      filtered = filtered.filter((b) => {
        const bookingDate = new Date(b.date);
        switch (filters.dateRange) {
          case "upcoming":
            return bookingDate >= now;
          case "past":
            return bookingDate < now;
          case "thisWeek": {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return bookingDate >= start && bookingDate <= end;
          }
          case "thisMonth":
            return (
              bookingDate.getMonth() === now.getMonth() &&
              bookingDate.getFullYear() === now.getFullYear()
            );
          default:
            return true;
        }
      });
    }

    setFilteredBookings(filtered);
  };

  // Status update (cancel/confirm)
  const handleStatusUpdate = async (bookingId, newStatus, reason = "") => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/bookings/${bookingId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            ...(reason && { cancellationReason: reason }),
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to update booking");
      }

      const data = await response.json();
      setBookings((prev) =>
        prev.map((b) => (b._id === bookingId ? data.data : b))
      );
    } catch (err) {
      console.error("Error updating booking:", err);
      alert(err.message);
    }
  };

  // Status counts for dashboard
  const getStatusCounts = () =>
    bookings.reduce(
      (acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        acc.all++;
        return acc;
      },
      { all: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
    );

  const statusCounts = getStatusCounts();

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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Only students can view booking history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/booking")}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Booking
            </button>

            <button
              onClick={() => navigate("/booking")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book New Session
            </button>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mt-6">My Bookings</h1>
          <p className="text-gray-600 mt-2">
            View and manage all your counseling session bookings
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div
                key={status}
                className="bg-white p-4 rounded-lg shadow-sm border"
              >
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {status === "all" ? "Total" : status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by counselor, reason, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <BookingFilters filters={filters} onFiltersChange={setFilters} />
          )}
        </div>

        {/* Bookings Loading */}
        {bookingsLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading bookings...</span>
          </div>
        )}

        {/* Error */}
        {!bookingsLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Bookings */}
        {!bookingsLoading && !error && (
          <>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No bookings found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ||
                  filters.status !== "all" ||
                  filters.mode !== "all" ||
                  filters.dateRange !== "all"
                    ? "No bookings match your current filters."
                    : "You haven't made any booking requests yet."}
                </p>
                <button
                  onClick={() => navigate("/booking")}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Book Your First Session
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <BookingCard
                    key={b._id}
                    booking={b}
                    onStatusUpdate={handleStatusUpdate}
                    userRole={user.role}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredBookings.length > 0 && pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center space-x-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: i + 1 }))
                    }
                    className={`px-3 py-2 rounded-lg ${
                      pagination.page === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-white border text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllBookings;




// // frontend/src/pages/AllBookings.jsx
// import React, { useState, useEffect } from "react";
// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";
// import BookingCard from "../components/BookingCard";
// import BookingFilters from "../components/BookingFilters";
// import {
//   Calendar,
//   Search,
//   Filter,
//   ArrowLeft,
//   Loader2,
//   AlertCircle,
// } from "lucide-react";

// const AllBookings = () => {
//   const { user, token } = useAuth();
//   const navigate = useNavigate();

//   const [bookings, setBookings] = useState([]);
//   const [filteredBookings, setFilteredBookings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showFilters, setShowFilters] = useState(false);
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 10,
//     totalPages: 1,
//   });

//   // filter states
//   const [filters, setFilters] = useState({
//     status: "all",
//     mode: "all",
//     dateRange: "all",
//   });

//   // 🔹 Load bookings from API
//   const loadBookings = async () => {
//     setLoading(true);
//     try {
//       const queryParams = new URLSearchParams({
//         page: pagination.page,
//         limit: pagination.limit,
//         sortBy: "createdAt",
//         sortOrder: "desc",
//       });

//       const response = await fetch(
//         `http://localhost:5000/api/v1/bookings?${queryParams}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (!response.ok) throw new Error("Failed to fetch bookings");

//       const data = await response.json();

//       if (data.success) {
//         setBookings(data.data.bookings || []);
//         setPagination((prev) => ({
//           ...prev,
//           totalPages: data.data.pagination?.totalPages || 1,
//         }));
//         setError("");
//       } else {
//         setError(data.message || "Failed to load bookings");
//       }
//     } catch (err) {
//       console.error("Error loading bookings:", err);
//       setError("Failed to load bookings. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🔹 Apply filters + search on client side
//   const applyFilters = () => {
//     let filtered = [...bookings];

//     if (searchTerm.trim()) {
//       filtered = filtered.filter(
//         (b) =>
//           b.counselor?.fullName
//             ?.toLowerCase()
//             .includes(searchTerm.toLowerCase()) ||
//           b.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           b.status?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     if (filters.status !== "all") {
//       filtered = filtered.filter((b) => b.status === filters.status);
//     }

//     if (filters.mode !== "all") {
//       filtered = filtered.filter((b) => b.mode === filters.mode);
//     }

//     if (filters.dateRange !== "all") {
//       const now = new Date();
//       filtered = filtered.filter((b) => {
//         const bookingDate = new Date(b.date);
//         switch (filters.dateRange) {
//           case "upcoming":
//             return bookingDate >= now;
//           case "past":
//             return bookingDate < now;
//           case "thisWeek": {
//             const start = new Date(now);
//             start.setDate(now.getDate() - now.getDay());
//             const end = new Date(start);
//             end.setDate(start.getDate() + 6);
//             return bookingDate >= start && bookingDate <= end;
//           }
//           case "thisMonth":
//             return (
//               bookingDate.getMonth() === now.getMonth() &&
//               bookingDate.getFullYear() === now.getFullYear()
//             );
//           default:
//             return true;
//         }
//       });
//     }

//     setFilteredBookings(filtered);
//   };

//   // 🔹 Status update (cancel/confirm)
//   const handleStatusUpdate = async (bookingId, newStatus, reason = "") => {
//     try {
//       const response = await fetch(
//         `http://localhost:5000/api/v1/bookings/${bookingId}/status`,
//         {
//           method: "PATCH",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             status: newStatus,
//             ...(reason && { cancellationReason: reason }),
//           }),
//         }
//       );

//       if (!response.ok) {
//         const errData = await response.json();
//         throw new Error(errData.message || "Failed to update booking");
//       }

//       const data = await response.json();
//       setBookings((prev) =>
//         prev.map((b) => (b._id === bookingId ? data.data : b))
//       );
//     } catch (err) {
//       console.error("Error updating booking:", err);
//       alert(err.message);
//     }
//   };

//   // 🔹 Status counts for dashboard
//   const getStatusCounts = () =>
//     bookings.reduce(
//       (acc, b) => {
//         acc[b.status] = (acc[b.status] || 0) + 1;
//         acc.all++;
//         return acc;
//       },
//       { all: 0, pending: 0, confirmed: 0, cancelled: 0, completed: 0 }
//     );

//   const statusCounts = getStatusCounts();

//   // 🔹 Effects
//   useEffect(() => {
//     if (!user) return;
//     if (user.role !== "student") {
//       navigate("/login");
//       return;
//     }
//     loadBookings();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pagination.page, user]);

//   useEffect(() => {
//     applyFilters();
//   }, [bookings, searchTerm, filters]);

//   // 🔹 Guard if not student
//   if (!user || user.role !== "student") {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">
//             Access Denied
//           </h2>
//           <p className="text-gray-600">
//             Only students can view booking history.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between">
//             <button
//               onClick={() => navigate("/booking")}
//               className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
//             >
//               <ArrowLeft className="h-5 w-5 mr-2" />
//               Back to Booking
//             </button>

//             <button
//               onClick={() => navigate("/booking")}
//               className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
//             >
//               <Calendar className="h-4 w-4 mr-2" />
//               Book New Session
//             </button>
//           </div>

//           <h1 className="text-3xl font-bold text-gray-900 mt-6">My Bookings</h1>
//           <p className="text-gray-600 mt-2">
//             View and manage all your counseling session bookings
//           </p>

//           {/* Stats */}
//           <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
//             {Object.entries(statusCounts).map(([status, count]) => (
//               <div
//                 key={status}
//                 className="bg-white p-4 rounded-lg shadow-sm border"
//               >
//                 <div className="text-2xl font-bold text-gray-900">{count}</div>
//                 <div className="text-sm text-gray-600 capitalize">
//                   {status === "all" ? "Total" : status}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Search + Filters */}
//         <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
//           <div className="flex flex-col md:flex-row gap-4">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
//               <input
//                 type="text"
//                 placeholder="Search by counselor, reason, or status..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
//               />
//             </div>
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
//             >
//               <Filter className="h-4 w-4 mr-2" />
//               Filters
//             </button>
//           </div>

//           {showFilters && (
//             <BookingFilters filters={filters} onFiltersChange={setFilters} />
//           )}
//         </div>

//         {/* Loading */}
//         {loading && (
//           <div className="flex items-center justify-center py-12">
//             <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//             <span className="ml-2 text-gray-600">Loading bookings...</span>
//           </div>
//         )}

//         {/* Error */}
//         {!loading && error && (
//           <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//             <div className="flex items-center text-red-800">
//               <AlertCircle className="h-5 w-5 mr-2" />
//               {error}
//             </div>
//           </div>
//         )}

//         {/* Bookings */}
//         {!loading && !error && (
//           <>
//             {filteredBookings.length === 0 ? (
//               <div className="text-center py-12">
//                 <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">
//                   No bookings found
//                 </h3>
//                 <p className="text-gray-600 mb-6">
//                   {searchTerm ||
//                   filters.status !== "all" ||
//                   filters.mode !== "all" ||
//                   filters.dateRange !== "all"
//                     ? "No bookings match your current filters."
//                     : "You haven't made any booking requests yet."}
//                 </p>
//                 <button
//                   onClick={() => navigate("/booking")}
//                   className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
//                 >
//                   Book Your First Session
//                 </button>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {filteredBookings.map((b) => (
//                   <BookingCard
//                     key={b._id}
//                     booking={b}
//                     onStatusUpdate={handleStatusUpdate}
//                     userRole={user.role}
//                   />
//                 ))}
//               </div>
//             )}

//             {/* Pagination */}
//             {filteredBookings.length > 0 && pagination.totalPages > 1 && (
//               <div className="mt-8 flex justify-center space-x-2">
//                 {Array.from({ length: pagination.totalPages }, (_, i) => (
//                   <button
//                     key={i + 1}
//                     onClick={() =>
//                       setPagination((prev) => ({ ...prev, page: i + 1 }))
//                     }
//                     className={`px-3 py-2 rounded-lg ${
//                       pagination.page === i + 1
//                         ? "bg-blue-600 text-white"
//                         : "bg-white border text-gray-700 hover:bg-gray-50"
//                     }`}
//                   >
//                     {i + 1}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AllBookings;
