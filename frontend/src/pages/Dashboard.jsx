// // import React, { useEffect, useState } from "react";
// // import axios from "axios";
// // import { useAuth } from "../context/AuthContext";
// // import {
// //   BarChart,
// //   Bar,
// //   XAxis,
// //   YAxis,
// //   Tooltip,
// //   ResponsiveContainer,
// //   CartesianGrid,
// //   Legend,
// // } from "recharts";
// // import {
// //   Users,
// //   MessageSquare,
// //   Calendar,
// //   Activity,
// // } from "lucide-react";

// // // 🔹 Mock data placeholder
// // const mockStats = {
// //   totalUsers: 120,
// //   totalComments: 45,
// //   totalBookings: 18,
// //   totalScreenings: 33,
// //   chartData: [
// //     { month: "Jan", users: 10, bookings: 3 },
// //     { month: "Feb", users: 15, bookings: 4 },
// //     { month: "Mar", users: 25, bookings: 6 },
// //     { month: "Apr", users: 20, bookings: 5 },
// //     { month: "May", users: 30, bookings: 8 },
// //   ],
// //   recentComments: [
// //     { _id: "1", text: "This platform is amazing!", user: { fullName: "Alice" } },
// //     { _id: "2", text: "Looking forward to my session.", user: { fullName: "Bob" } },
// //     { _id: "3", text: "Great resources shared here.", user: { fullName: "Charlie" } },
// //   ],
// // };

// // export default function Dashboard() {
// //   const { token, user } = useAuth();
// //   const [stats, setStats] = useState(null);
// //   const [loading, setLoading] = useState(true);

// //   // Fetch dashboard stats
// //   useEffect(() => {
// //     const fetchStats = async () => {
// //       try {
// //         const res = await axios.get(
// //           "http://localhost:5000/api/v1/dashboard/stats",
// //           { headers: { Authorization: `Bearer ${token}` } }
// //         );
// //         setStats(res.data.data);
// //       } catch (err) {
// //         console.warn("⚠️ API not ready, using mock data:", err.message);
// //         setStats(mockStats); // ⬅ fallback
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchStats();
// //   }, [token]);

// //   if (loading) {
// //     return <div className="p-6 text-center">Loading dashboard...</div>;
// //   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <h1 className="text-3xl font-bold mb-6">
//         Welcome, {user?.fullName || "User"} 👋
//       </h1>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//         <StatCard
//           icon={<Users className="text-blue-600" size={32} />}
//           label="Total Users"
//           value={stats.totalUsers}
//           color="bg-blue-100"
//         />
//         <StatCard
//           icon={<MessageSquare className="text-green-600" size={32} />}
//           label="Forum Posts"
//           value={stats.totalComments}
//           color="bg-green-100"
//         />
//         <StatCard
//           icon={<Calendar className="text-purple-600" size={32} />}
//           label="Bookings"
//           value={stats.totalBookings}
//           color="bg-purple-100"
//         />
//         <StatCard
//           icon={<Activity className="text-orange-600" size={32} />}
//           label="Screenings"
//           value={stats.totalScreenings}
//           color="bg-orange-100"
//         />
//       </div>

//       {/* Main Grid: Chart + Recent Activity */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {/* Chart */}
//         <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
//           <h2 className="text-xl font-semibold mb-4">Monthly Overview</h2>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={stats.chartData}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="users" fill="#3B82F6" name="New Users" />
//               <Bar dataKey="bookings" fill="#10B981" name="Bookings" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Recent Activity */}
//         <div className="bg-white p-6 rounded-lg shadow">
//           <h2 className="text-xl font-semibold mb-4">Recent Forum Posts</h2>
//           {stats.recentComments.length > 0 ? (
//             <ul className="space-y-3">
//               {stats.recentComments.map((c) => (
//                 <li key={c._id} className="border-b pb-2">
//                   <p className="text-gray-800">{c.text}</p>
//                   <span className="text-sm text-gray-500">
//                     by {c.user?.fullName || "Anonymous"}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="text-gray-500">No recent posts.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function StatCard({ icon, label, value, color }) {
//   return (
//     <div
//       className={`p-6 rounded-lg shadow ${color} flex flex-col items-center`}
//     >
//       <div className="mb-2">{icon}</div>
//       <h3 className="text-lg font-semibold">{value}</h3>
//       <p className="text-gray-700">{label}</p>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  Activity,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Settings,
  Shield,
  BarChart3,
} from "lucide-react";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1";

// Enhanced mock data with more realistic mental health platform metrics
const mockStats = {
  overview: {
    totalUsers: 1247,
    activeUsers: 892,
    pendingApprovals: 23,
    totalSessions: 456,
    completedSessions: 389,
    cancelledSessions: 67,
    emergencyFlags: 3,
    avgSessionRating: 4.7,
  },
  userDistribution: [
    { name: "Students", value: 856, color: "#3b82f6" },
    { name: "Counsellors", value: 134, color: "#10b981" },
    { name: "Admins", value: 12, color: "#f59e0b" },
    { name: "Pending", value: 23, color: "#ef4444" },
  ],
  registrationTrends: [
    { month: "Jan", students: 45, counsellors: 8, total: 53 },
    { month: "Feb", students: 62, counsellors: 12, total: 74 },
    { month: "Mar", students: 78, counsellors: 15, total: 93 },
    { month: "Apr", students: 89, counsellors: 18, total: 107 },
    { month: "May", students: 95, counsellors: 22, total: 117 },
    { month: "Jun", students: 112, counsellors: 19, total: 131 },
  ],
  sessionMetrics: [
    { week: "Week 1", completed: 45, cancelled: 8, noShow: 3 },
    { week: "Week 2", completed: 52, cancelled: 6, noShow: 2 },
    { week: "Week 3", completed: 48, cancelled: 9, noShow: 4 },
    { week: "Week 4", completed: 61, cancelled: 7, noShow: 1 },
  ],
  recentActivity: [
    {
      id: 1,
      type: "approval",
      message: "Dr. Sarah Johnson approved as counsellor",
      timestamp: "2 minutes ago",
      severity: "success",
    },
    {
      id: 2,
      type: "emergency",
      message: "Emergency flag triggered for student ID: STU001",
      timestamp: "15 minutes ago",
      severity: "critical",
    },
    {
      id: 3,
      type: "session",
      message: "High cancellation rate detected for counsellor ID: COU045",
      timestamp: "1 hour ago",
      severity: "warning",
    },
    {
      id: 4,
      type: "registration",
      message: "15 new student registrations today",
      timestamp: "2 hours ago",
      severity: "info",
    },
  ],
  pendingUsers: [
    {
      _id: "1",
      fullName: "Dr. Michael Chen",
      email: "m.chen@university.edu",
      role: "counsellor",
      specialization: "Anxiety & Depression",
      experience: "8 years",
      institution: "State University",
      submittedAt: "2024-01-15T10:30:00Z",
      status: "pending",
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    },
    {
      _id: "2", 
      fullName: "Dr. Lisa Anderson",
      email: "l.anderson@counseling.org",
      role: "counsellor",
      specialization: "PTSD & Trauma",
      experience: "12 years",
      institution: "Community Health Center",
      submittedAt: "2024-01-14T14:20:00Z",
      status: "pending",
      avatar: "https://images.unsplash.com/photo-1594824388170-22dfd5c3a5cc?w=150&h=150&fit=crop&crop=face",
    },
    {
      _id: "3", 
      fullName: "Dr. James Wilson",
      email: "j.wilson@therapy.com",
      role: "counsellor",
      specialization: "Substance Abuse",
      experience: "10 years",
      institution: "Regional Medical Center",
      submittedAt: "2024-01-13T09:15:00Z",
      status: "pending",
      avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
    },
  ],
  topCounsellors: [
    { name: "Dr. Sarah Wilson", sessions: 45, rating: 4.9, specialty: "Anxiety" },
    { name: "Dr. James Rodriguez", sessions: 38, rating: 4.8, specialty: "Depression" },
    { name: "Dr. Emily Chang", sessions: 42, rating: 4.7, specialty: "PTSD" },
  ],
};

export default function EnhancedAdminDashboard() {
  const [user, setUser] = useState({ fullName: "Admin User" }); // Mock user context
  const [token, setToken] = useState("mock-token"); // Mock token
  const [stats, setStats] = useState(mockStats);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(mockStats);
    } catch (err) {
      console.warn("API not ready, using mock data:", err.message);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleUserAction = async (userId, action) => {
    setActionLoading(prev => ({ ...prev, [userId]: action }));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state
      setStats(prev => ({
        ...prev,
        pendingUsers: prev.pendingUsers.filter(u => u._id !== userId),
        overview: {
          ...prev.overview,
          pendingApprovals: prev.overview.pendingApprovals - 1
        }
      }));
      
      alert(`User ${action}d successfully!`);
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      alert(`Error ${action}ing user`);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const StatCard = ({ title, value, change, icon: Icon, color = "blue" }) => {
    const colorClasses = {
      blue: "text-blue-600",
      green: "text-green-600", 
      yellow: "text-yellow-600",
      red: "text-red-600"
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
            {change && (
              <p className={`text-sm flex items-center mt-1 ${
                change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {change > 0 ? '+' : ''}{change}% from last month
              </p>
            )}
          </div>
          <Icon className={`h-12 w-12 opacity-80 ${colorClasses[color]}`} />
        </div>
      </div>
    );
  };

  const UserModal = ({ user, onClose, onApprove, onReject }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex justify-center">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&size=100&background=3b82f6&color=ffffff`}
              alt={user.fullName}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-lg font-semibold text-gray-900">{user.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {user.role}
              </span>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Institution</label>
              <p className="text-gray-900">{user.institution}</p>
            </div>
            {user.specialization && (
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-500">Specialization</label>
                <p className="text-gray-900">{user.specialization}</p>
              </div>
            )}
            {user.experience && (
              <div>
                <label className="text-sm font-medium text-gray-500">Experience</label>
                <p className="text-gray-900">{user.experience}</p>
              </div>
            )}
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">Application Submitted</label>
            <p className="text-gray-900">{new Date(user.submittedAt).toLocaleString()}</p>
          </div>
          
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => onApprove(user._id)}
              disabled={actionLoading[user._id]}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {actionLoading[user._id] === 'approve' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {actionLoading[user._id] === 'approve' ? 'Approving...' : 'Approve'}
            </button>
            <button
              onClick={() => onReject(user._id)}
              disabled={actionLoading[user._id]}
              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {actionLoading[user._id] === 'reject' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {actionLoading[user._id] === 'reject' ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = stats.pendingUsers.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.fullName}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600 hover:text-gray-800 cursor-pointer" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'sessions', label: 'Sessions', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Users"
                value={stats.overview.totalUsers}
                change={12.5}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Active Sessions"
                value={stats.overview.completedSessions}
                change={8.2}
                icon={Calendar}
                color="green"
              />
              <StatCard
                title="Pending Approvals"
                value={stats.overview.pendingApprovals}
                change={-15.3}
                icon={Clock}
                color="yellow"
              />
              <StatCard
                title="Emergency Flags"
                value={stats.overview.emergencyFlags}
                change={0}
                icon={AlertCircle}
                color="red"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Distribution */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.userDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {stats.userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Registration Trends */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.registrationTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="students" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="counsellors" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activity & Top Performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.severity === 'critical' ? 'bg-red-500' :
                        activity.severity === 'warning' ? 'bg-yellow-500' :
                        activity.severity === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Counsellors */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Counsellors</h3>
                <div className="space-y-4">
                  {stats.topCounsellors.map((counsellor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{counsellor.name}</p>
                        <p className="text-xs text-gray-500">{counsellor.specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{counsellor.sessions} sessions</p>
                        <p className="text-xs text-yellow-600">⭐ {counsellor.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="counsellor">Counsellors</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Approvals ({filteredUsers.length})
                </h3>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4 mb-4">
                      <img
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&size=60&background=3b82f6&color=ffffff`}
                        alt={user.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-900">{user.fullName}</h4>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                          </div>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Pending
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {user.specialization && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Specialty:</strong> {user.specialization}
                      </p>
                    )}
                    
                    <p className="text-xs text-gray-500 mb-4">
                      Submitted: {new Date(user.submittedAt).toLocaleDateString()}
                    </p>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </button>
                      <button
                        onClick={() => handleUserAction(user._id, 'approve')}
                        disabled={actionLoading[user._id]}
                        className="flex items-center px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading[user._id] === 'approve' ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                        ) : (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleUserAction(user._id, 'reject')}
                        disabled={actionLoading[user._id]}
                        className="flex items-center px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading[user._id] === 'reject' ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending users</h3>
                  <p className="text-gray-500">All users have been processed or no users match your search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Analytics</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats.sessionMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled" />
                  <Bar dataKey="noShow" fill="#f59e0b" name="No Show" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Session Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.overview.totalSessions}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round((stats.overview.completedSessions / stats.overview.totalSessions) * 100)}%
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.overview.avgSessionRating}</p>
                  </div>
                  <Activity className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Growth</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats.registrationTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} name="Total Registrations" />
                  <Line type="monotone" dataKey="students" stroke="#10b981" strokeWidth={2} name="Students" />
                  <Line type="monotone" dataKey="counsellors" stroke="#f59e0b" strokeWidth={2} name="Counsellors" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Analytics Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">Peak registration month</span>
                    <span className="text-sm font-bold text-blue-900">June (131 users)</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-900">Student growth rate</span>
                    <span className="text-sm font-bold text-green-900">+149% since January</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-900">Counsellor acceptance rate</span>
                    <span className="text-sm font-bold text-yellow-900">85.4%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Patterns</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Daily Active Users</span>
                      <span className="text-gray-600">72%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '72%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">Session Attendance</span>
                      <span className="text-gray-600">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">User Satisfaction</span>
                      <span className="text-gray-600">94%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{width: '94%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onApprove={(userId) => {
            handleUserAction(userId, 'approve');
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onReject={(userId) => {
            handleUserAction(userId, 'reject');
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}