// // src/pages/UserApproval.jsx
// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// export default function PendingApprovals() {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchPendingUsers = async () => {
//     try {
//       const res = await axios.get(`${API_BASE}/admin/pending-users`, {
//         withCredentials: true,
//       });
//       if (res.data?.data?.users?.length) {
//         setUsers(res.data.data.users);
//       } else {
//         // ✅ fallback placeholder users
//         setUsers([
//           {
//             _id: "1",
//             fullName: "Placeholder User 1",
//             email: "placeholder1@example.com",
//             role: "counsellor",
//             status: "pending",
//           },
//           {
//             _id: "2",
//             fullName: "Placeholder User 2",
//             email: "placeholder2@example.com",
//             role: "counsellor",
//             status: "pending",
//           },
//         ]);
//       }
//     } catch (err) {
//       console.error("⚠️ API error:", err.message);
//       // ✅ show placeholder cards if API fails
//       setUsers([
//         {
//           _id: "1",
//           fullName: "Placeholder User 1",
//           email: "placeholder1@example.com",
//           role: "counsellor",
//           status: "pending",
//         },
//         {
//           _id: "2",
//           fullName: "Placeholder User 2",
//           email: "placeholder2@example.com",
//           role: "counsellor",
//           status: "pending",
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPendingUsers();
//   }, []);

//   if (loading) return <p className="p-4">🔄 Loading pending users...</p>;

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-6">Pending User Approvals</h2>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {users.map((u) => (
//           <div
//             key={u._id}
//             className="bg-white p-4 rounded-2xl shadow-md border"
//           >
//             <h3 className="text-lg font-semibold">{u.fullName}</h3>
//             <p className="text-sm text-gray-600">{u.email}</p>
//             <p className="mt-2">
//               <span className="font-medium">Role:</span> {u.role}
//             </p>
//             <p>
//               <span className="font-medium">Status:</span> {u.status}
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1";

export default function PendingApprovals() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/admin/pending-users`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login as admin');
        } else if (response.status === 403) {
          throw new Error('Forbidden - Admin access required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.log("Non-JSON response:", textResponse);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log("Full API Response:", data);

      // Handle the response structure from your adminController
      if (data && data.success && data.data && Array.isArray(data.data.users)) {
        setUsers(data.data.users);
        console.log("Users loaded:", data.data.users.length);
      } else if (data && data.success && data.data && Array.isArray(data.data.users) && data.data.users.length === 0) {
        console.log("No pending users found");
        setUsers([]);
      } else {
        console.log("Unexpected response structure:", data);
        setUsers([]);
      }
    } catch (err) {
      console.error("API Error Details:", err);
      setError(`Failed to fetch pending users: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'approve' }));
      
      // Using your exact route structure: PUT /admin/approve/:id
      const response = await fetch(`${API_BASE}/admin/approve/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Approval response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - Please login as admin');
        } else if (response.status === 403) {
          throw new Error('Forbidden - Admin access required');
        } else if (response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Remove the user from the list after successful approval
        setUsers(prev => prev.filter(user => user._id !== userId));
        alert('User approved successfully!');
      } else {
        alert(`Failed to approve user: ${data.message}`);
      }
    } catch (err) {
      console.error('Error approving user:', err);
      alert(`Error approving user: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingUsers();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading pending users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchPendingUsers}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Pending User Approvals</h2>
        <p className="text-gray-600">
          {users.length} counsellor{users.length !== 1 ? 's' : ''} awaiting approval
        </p>
        <button
          onClick={fetchPendingUsers}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
          <p className="text-gray-500">No pending user approvals at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* User Avatar */}
              <div className="relative h-32 bg-gradient-to-r from-blue-400 to-purple-500">
                {user.coverImage && (
                  <img
                    src={user.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute -bottom-8 left-4">
                  <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                        {user.fullName?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Details */}
              <div className="pt-10 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {user.fullName || 'No Name'}
                </h3>
                <p className="text-gray-600 mb-3">@{user.username}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-16">Email:</span>
                    <span className="text-gray-600 truncate">{user.email}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-16">Role:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {user.role}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-16">Status:</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 capitalize">
                      {user.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-16">Joined:</span>
                    <span className="text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  <button
                    onClick={() => handleApproval(user._id)}
                    disabled={actionLoading[user._id]}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                  >
                    {actionLoading[user._id] ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Approving...
                      </span>
                    ) : (
                      '✓ Approve Counsellor'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}