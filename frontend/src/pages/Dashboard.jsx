import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Users,
  MessageSquare,
  Calendar,
  Activity,
} from "lucide-react";

export default function Dashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/v1/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-6 text-center text-red-500">Failed to load data.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {user?.fullName || "User"} 👋
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="text-blue-600" size={32} />}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-blue-100"
        />
        <StatCard
          icon={<MessageSquare className="text-green-600" size={32} />}
          label="Forum Posts"
          value={stats.totalComments}
          color="bg-green-100"
        />
        <StatCard
          icon={<Calendar className="text-purple-600" size={32} />}
          label="Bookings"
          value={stats.totalBookings}
          color="bg-purple-100"
        />
        <StatCard
          icon={<Activity className="text-orange-600" size={32} />}
          label="Screenings"
          value={stats.totalScreenings}
          color="bg-orange-100"
        />
      </div>

      {/* Main Grid: Chart + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Monthly Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#3B82F6" name="New Users" />
              <Bar dataKey="bookings" fill="#10B981" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Forum Posts</h2>
          {stats.recentComments.length > 0 ? (
            <ul className="space-y-3">
              {stats.recentComments.map((c) => (
                <li key={c._id} className="border-b pb-2">
                  <p className="text-gray-800">{c.text}</p>
                  <span className="text-sm text-gray-500">
                    by {c.user?.fullName || "Anonymous"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No recent posts.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`p-6 rounded-lg shadow ${color} flex flex-col items-center`}>
      <div className="mb-2">{icon}</div>
      <h3 className="text-lg font-semibold">{value}</h3>
      <p className="text-gray-700">{label}</p>
    </div>
  );
}
