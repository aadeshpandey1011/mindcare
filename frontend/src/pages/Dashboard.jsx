import React, { useEffect, useState, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell,
    AreaChart, Area,
} from "recharts";
import {
    Users, Calendar, Activity, TrendingUp, AlertCircle, Clock,
    Search, Download, Eye, CheckCircle, XCircle, RefreshCw,
    Bell, BarChart3, IndianRupee, Megaphone, Banknote,
    UserCheck, Star,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1";

const fmtRupees = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${Number(n).toFixed(0)}`;
const fmtNum   = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n || 0);

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#0ea5e9"];

// ── Reusable StatCard ─────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, color = "blue", trend, trendUp }) {
    const colorMap = {
        blue:   { bg: "bg-blue-50",   text: "text-blue-600",   icon: "text-blue-500"   },
        green:  { bg: "bg-green-50",  text: "text-green-600",  icon: "text-green-500"  },
        yellow: { bg: "bg-yellow-50", text: "text-yellow-600", icon: "text-yellow-500" },
        red:    { bg: "bg-red-50",    text: "text-red-600",    icon: "text-red-500"    },
        purple: { bg: "bg-purple-50", text: "text-purple-600", icon: "text-purple-500" },
        indigo: { bg: "bg-indigo-50", text: "text-indigo-600", icon: "text-indigo-500" },
    };
    const c = colorMap[color] || colorMap.blue;
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}>
                    <Icon size={18} className={c.icon} />
                </div>
            </div>
            <p className={`text-3xl font-bold ${c.text} mb-1`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            {trend !== undefined && (
                <p className={`text-xs mt-1 flex items-center gap-1 ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
                    <TrendingUp size={11} />
                    {trendUp ? '+' : ''}{trend}% from last month
                </p>
            )}
        </div>
    );
}

// ── User detail modal ─────────────────────────────────────────────────────────
function UserModal({ user, loading, onApprove, onReject, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">User Profile</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button>
                </div>
                <div className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        {user.avatar
                            ? <img src={user.avatar} alt={user.fullName} className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100 mb-3" />
                            : <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-indigo-100 mb-3">{(user.fullName || '?')[0]}</div>
                        }
                        <h4 className="text-xl font-bold text-gray-900">{user.fullName}</h4>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 capitalize">{user.role}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                        {user.specialization && <div className="col-span-2 bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Specialization</p><p className="font-medium text-gray-900">{user.specialization}</p></div>}
                        {user.institution     && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Institution</p><p className="font-medium text-gray-900">{user.institution}</p></div>}
                        <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Status</p><p className="font-medium capitalize text-gray-900">{user.status}</p></div>
                        <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Joined</p><p className="font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString('en-IN')}</p></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onReject(user._id)} disabled={loading}
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                        </button>
                        <button onClick={() => onApprove(user._id)} disabled={loading}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { token, user } = useAuth();
    const [activeTab,   setActiveTab]   = useState("overview");
    const [refreshing,  setRefreshing]  = useState(false);

    // ── Overview/Analytics state ──────────────────────────────────────────────
    const [overview,     setOverview]     = useState(null);
    const [payStats,     setPayStats]     = useState(null);
    const [bookingStats, setBookingStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // ── Users tab ─────────────────────────────────────────────────────────────
    const [pendingUsers,  setPendingUsers]  = useState([]);
    const [usersLoading,  setUsersLoading]  = useState(false);
    const [searchTerm,    setSearchTerm]    = useState("");
    const [filterRole,    setFilterRole]    = useState("all");
    const [selectedUser,  setSelectedUser]  = useState(null);
    const [userActLoading, setUserActLoading] = useState({});

    // ── Ads tab ───────────────────────────────────────────────────────────────
    const [ads,        setAds]        = useState([]);
    const [adFilter,   setAdFilter]   = useState("payment_received");
    const [adsLoading, setAdsLoading] = useState(false);
    const [adActLoading, setAdActLoading] = useState({});
    const [pendingAdCount, setPendingAdCount] = useState(0);
    const [adRejectNote,   setAdRejectNote]   = useState({});

    const [toast, setToast] = useState(null);
    const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

    // ── Fetch overview stats (real API) ───────────────────────────────────────
    const fetchOverview = useCallback(async () => {
        try {
            const [usersRes, payRes, bookRes] = await Promise.all([
                fetch(`${API_BASE}/admin/pending-users`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/payments/stats`,      { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/bookings/admin/stats`,{ headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [usersData, payData, bookData] = await Promise.all([
                usersRes.json(), payRes.json(), bookRes.json(),
            ]);
            if (usersData.success) {
                setOverview(prev => ({
                    ...prev,
                    pendingApprovals: usersData.data?.users?.length || 0,
                }));
            }
            if (payData.success)  setPayStats(payData.data);
            if (bookData.success) setBookingStats(bookData.data);
        } catch (e) { console.error("[Dashboard overview]", e.message); }
        finally { setStatsLoading(false); }
    }, [token]);

    // ── Fetch pending users ───────────────────────────────────────────────────
    const fetchPendingUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/admin/pending-users`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setPendingUsers(data.data?.users || []);
        } catch (e) { showToast("Failed to load pending users", "error"); }
        finally { setUsersLoading(false); }
    }, [token]);

    // ── Fetch ads ─────────────────────────────────────────────────────────────
    const fetchAds = useCallback(async (statusFilter = adFilter) => {
        setAdsLoading(true);
        try {
            const params = new URLSearchParams({ limit: 50 });
            if (statusFilter !== "all") params.set("status", statusFilter);
            const res  = await fetch(`${API_BASE}/ads/admin/all?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                setAds(data.data.ads || []);
                setPendingAdCount(data.data.pendingCount || 0);
            }
        } catch (e) { showToast("Failed to load ads", "error"); }
        finally { setAdsLoading(false); }
    }, [token, adFilter]);

    useEffect(() => { fetchOverview(); }, [fetchOverview]);
    useEffect(() => { if (activeTab === "users") fetchPendingUsers(); }, [activeTab]);
    useEffect(() => { if (activeTab === "ads")   fetchAds(adFilter);  }, [activeTab, adFilter]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOverview();
        if (activeTab === "users") await fetchPendingUsers();
        if (activeTab === "ads")   await fetchAds();
        setRefreshing(false);
    };

    // ── User approve/reject ───────────────────────────────────────────────────
    const handleUserAction = async (userId, action) => {
        setUserActLoading(p => ({ ...p, [userId]: action }));
        try {
            const res  = await fetch(`${API_BASE}/admin/${action}/${userId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setPendingUsers(prev => prev.filter(u => u._id !== userId));
            setSelectedUser(null);
            showToast(`User ${action}d successfully!`);
            await fetchOverview();
        } catch (e) { showToast(`Error: ${e.message}`, "error"); }
        finally { setUserActLoading(p => ({ ...p, [userId]: null })); }
    };

    // ── Ad approve/reject ─────────────────────────────────────────────────────
    const handleAdAction = async (adId, action) => {
        const note = adRejectNote[adId] || "";
        if (action === "reject" && !note.trim()) {
            showToast("Please provide a rejection reason", "error"); return;
        }
        setAdActLoading(p => ({ ...p, [adId]: action }));
        try {
            const res  = await fetch(`${API_BASE}/ads/admin/${adId}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action, note }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(action === "approve"
                ? "Ad approved! It is now live on the forum."
                : `Ad rejected. Refund of ₹${data.data?.amountPaid || ''} initiated.`,
                action === "approve" ? "success" : "warning"
            );
            await fetchAds();
            await fetchOverview();
        } catch (e) { showToast(`Error: ${e.message}`, "error"); }
        finally { setAdActLoading(p => ({ ...p, [adId]: null })); }
    };

    // ── Derived chart data from real API ──────────────────────────────────────
    const monthlyRevenue = payStats?.monthlyRevenue?.slice().reverse().map(m => ({
        month: new Date(m.year, m.month - 1).toLocaleString('default', { month: 'short' }),
        revenue: Number(m.revenue),
        sessions: m.count,
    })) || [];

    const bookingStatusData = bookingStats?.statusStats?.map(s => ({
        name:  s._id === "completed" ? "Completed" : s._id === "confirmed" ? "Confirmed" : s._id === "cancelled" ? "Cancelled" : s._id === "pending" ? "Pending" : s._id,
        value: s.count,
    })) || [];

    const filteredUsers = pendingUsers.filter(u => {
        const q = searchTerm.toLowerCase();
        return (u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) &&
               (filterRole === "all" || u.role === filterRole);
    });

    const TABS = [
        { id: "overview",  label: "Overview",       icon: Activity   },
        { id: "users",     label: "User Approvals", icon: Users,       badge: pendingUsers.length },
        { id: "ads",       label: "Ad Requests",    icon: Megaphone,   badge: pendingAdCount },
        { id: "sessions",  label: "Sessions",        icon: Calendar   },
        { id: "analytics", label: "Analytics",       icon: BarChart3  },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Top bar ── */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-sm text-gray-500">Welcome back, {user?.fullName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Pending notifications badge */}
                        {(pendingUsers.length > 0 || pendingAdCount > 0) && (
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                                <Bell size={13} />
                                {pendingUsers.length + pendingAdCount} pending
                            </div>
                        )}
                        <button onClick={handleRefresh} disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
                    {TABS.map(({ id, label, icon: Icon, badge }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`relative flex items-center gap-2 px-4 py-4 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === id ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}>
                            <Icon size={15} /> {label}
                            {badge > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* ════════════════════════════════════════════════════════════
                    OVERVIEW
                ════════════════════════════════════════════════════════════ */}
                {activeTab === "overview" && (
                    <div className="space-y-8">
                        {/* Key metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Total Revenue"       value={payStats ? fmtRupees(payStats.summary?.totalRevenue)  : "–"} subtitle="All-time collected"       icon={IndianRupee} color="green"  trend={8.2}  trendUp={true}  />
                            <StatCard title="Net Revenue"         value={payStats ? fmtRupees(payStats.summary?.netRevenue)    : "–"} subtitle="After refunds"            icon={Banknote}    color="blue"   />
                            <StatCard title="Total Sessions"      value={bookingStats ? fmtNum(bookingStats.totalBookings)     : "–"} subtitle="All time"                 icon={Calendar}    color="purple" trend={12.5} trendUp={true}  />
                            <StatCard title="Pending Reviews"     value={pendingUsers.length + pendingAdCount}                        subtitle={`${pendingUsers.length} users · ${pendingAdCount} ads`} icon={Clock} color="yellow" />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Payments Collected"  value={payStats ? fmtNum(payStats.summary?.successCount)    : "–"} subtitle="Successful transactions"  icon={CheckCircle} color="green"  />
                            <StatCard title="Refunds Issued"      value={payStats ? fmtNum(payStats.summary?.refundCount)     : "–"} subtitle="Total refunds"             icon={XCircle}     color="red"    />
                            <StatCard title="Completed Sessions"  value={bookingStats ? fmtNum(bookingStats.statusStats?.find(s => s._id === "completed")?.count || 0) : "–"} subtitle="" icon={UserCheck} color="indigo" />
                            <StatCard title="Avg Session Rating"  value="4.8 ⭐"  subtitle="Platform average"  icon={Star}        color="yellow" />
                        </div>

                        {/* Revenue chart */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Monthly Revenue (₹)</h3>
                                {monthlyRevenue.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={monthlyRevenue}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                            <YAxis tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} />
                                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Booking Status Distribution</h3>
                                {bookingStatusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={bookingStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                                {bookingStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No booking data yet</div>
                                )}
                            </div>
                        </div>

                        {/* Quick action cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-3">Pending User Approvals</h3>
                                {pendingUsers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <CheckCircle size={32} className="mx-auto mb-2 text-green-400" />
                                        <p className="text-sm">All caught up! No pending approvals.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {pendingUsers.slice(0, 3).map(u => (
                                            <div key={u._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    {u.avatar
                                                        ? <img src={u.avatar} alt={u.fullName} className="w-8 h-8 rounded-full object-cover" />
                                                        : <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">{(u.fullName||'?')[0]}</div>
                                                    }
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                                                        <p className="text-xs text-gray-400 capitalize">{u.role} · {u.specialization || u.institution || ''}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => handleUserAction(u._id, 'reject')} disabled={userActLoading[u._id]}
                                                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"><XCircle size={14}/></button>
                                                    <button onClick={() => handleUserAction(u._id, 'approve')} disabled={userActLoading[u._id]}
                                                        className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50"><CheckCircle size={14}/></button>
                                                </div>
                                            </div>
                                        ))}
                                        {pendingUsers.length > 3 && (
                                            <button onClick={() => setActiveTab("users")} className="w-full text-xs text-indigo-600 hover:underline pt-1">
                                                +{pendingUsers.length - 3} more — View all →
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-3">Pending Ad Requests</h3>
                                {ads.filter(a => a.status === 'payment_received').length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <Megaphone size={32} className="mx-auto mb-2 text-indigo-300" />
                                        <p className="text-sm">No ads awaiting review.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {ads.filter(a => a.status === 'payment_received').slice(0, 3).map(ad => (
                                            <div key={ad._id} className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{ad.counsellorId?.fullName}</p>
                                                    <p className="text-xs text-indigo-600 capitalize">{ad.plan} · ₹{ad.amountPaid} · {ad.durationMonths}mo</p>
                                                </div>
                                                <button onClick={() => setActiveTab("ads")} className="text-xs text-indigo-600 font-semibold hover:underline">Review →</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    USER APPROVALS
                ════════════════════════════════════════════════════════════ */}
                {activeTab === "users" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">User Approvals</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{pendingUsers.length} awaiting review</p>
                            </div>
                            <button onClick={fetchPendingUsers} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                <RefreshCw size={13} className={usersLoading ? "animate-spin" : ""} /> Refresh
                            </button>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-200 flex gap-3">
                            <div className="flex-1 relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="Search name or email…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            </div>
                            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                <option value="all">All Roles</option>
                                <option value="student">Students</option>
                                <option value="counsellor">Counsellors</option>
                            </select>
                        </div>

                        {usersLoading ? (
                            <div className="flex flex-col items-center py-20 gap-3"><RefreshCw size={28} className="animate-spin text-indigo-400" /><p className="text-gray-400 text-sm">Loading users…</p></div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                                <div className="text-5xl mb-3">✅</div>
                                <h3 className="text-lg font-semibold text-gray-700">All Caught Up!</h3>
                                <p className="text-gray-400 text-sm">No pending approvals right now.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredUsers.map(u => (
                                    <div key={u._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-20 bg-gradient-to-r from-indigo-400 to-purple-500 relative">
                                            <div className="absolute -bottom-7 left-4">
                                                {u.avatar
                                                    ? <img src={u.avatar} alt={u.fullName} className="w-14 h-14 rounded-full object-cover border-3 border-white shadow" />
                                                    : <div className="w-14 h-14 rounded-full bg-indigo-700 flex items-center justify-center text-white font-bold text-lg border-3 border-white shadow">{(u.fullName||'?')[0]}</div>
                                                }
                                            </div>
                                        </div>
                                        <div className="pt-10 px-4 pb-4">
                                            <p className="font-bold text-gray-900">{u.fullName}</p>
                                            <p className="text-xs text-gray-400 mb-3">@{u.username || u.email}</p>
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 capitalize">{u.role}</span>
                                                {u.specialization && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{u.specialization}</span>}
                                            </div>
                                            <p className="text-xs text-gray-400 mb-4">{u.email}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => setSelectedUser(u)}
                                                    className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200">
                                                    <Eye size={12}/> View
                                                </button>
                                                <button onClick={() => handleUserAction(u._id, 'reject')} disabled={userActLoading[u._id]}
                                                    className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50 flex-1 justify-center">
                                                    {userActLoading[u._id] === 'reject' ? <RefreshCw size={11} className="animate-spin"/> : <XCircle size={11}/>} Reject
                                                </button>
                                                <button onClick={() => handleUserAction(u._id, 'approve')} disabled={userActLoading[u._id]}
                                                    className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50 flex-1 justify-center">
                                                    {userActLoading[u._id] === 'approve' ? <RefreshCw size={11} className="animate-spin"/> : <CheckCircle size={11}/>} Approve
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    AD REQUESTS
                ════════════════════════════════════════════════════════════ */}
                {activeTab === "ads" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Forum Ad Requests</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{pendingAdCount} awaiting review</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select value={adFilter} onChange={e => setAdFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">
                                    <option value="payment_received">Awaiting Review</option>
                                    <option value="active">Active</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="all">All</option>
                                </select>
                                <button onClick={() => fetchAds(adFilter)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                    <RefreshCw size={13} className={adsLoading ? "animate-spin" : ""} /> Refresh
                                </button>
                            </div>
                        </div>

                        {/* Payment flow explanation */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
                            <p className="font-semibold mb-2">📋 Ad Review Workflow</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                                {[
                                    { step: "1", text: "Counsellor configures ad + pays via Cashfree" },
                                    { step: "2", text: "Ad appears here for admin review" },
                                    { step: "3", text: "Admin approves → Ad goes live on forum" },
                                    { step: "4", text: "Admin rejects → Full refund auto-triggered" },
                                ].map(({ step, text }) => (
                                    <div key={step} className="flex items-start gap-2 bg-white rounded-lg p-2">
                                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{step}</span>
                                        <span>{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {adsLoading ? (
                            <div className="flex flex-col items-center py-16 gap-3"><RefreshCw size={28} className="animate-spin text-indigo-400" /><p className="text-gray-400 text-sm">Loading ad requests…</p></div>
                        ) : ads.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                                <Megaphone size={40} className="mx-auto mb-3 text-indigo-200" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                                    {adFilter === "payment_received" ? "No ads awaiting review" : `No ${adFilter} ads`}
                                </h3>
                                <p className="text-gray-400 text-sm">Ad requests from counsellors will appear here after payment.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {ads.map(ad => {
                                    const isPendingReview = ad.status === "payment_received";
                                    const planColor = { basic: "#6366f1", standard: "#0ea5e9", premium: "#8b5cf6" }[ad.plan] || "#6366f1";
                                    return (
                                        <div key={ad._id} className={`bg-white rounded-xl border-2 overflow-hidden ${isPendingReview ? 'border-yellow-300' : 'border-gray-200'}`}>
                                            <div className="h-1.5" style={{ background: planColor }} />
                                            <div className="p-5">
                                                {/* Counsellor info */}
                                                <div className="flex items-start gap-3 mb-4">
                                                    {ad.counsellorId?.avatar
                                                        ? <img src={ad.counsellorId.avatar} alt={ad.counsellorId.fullName} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-100" />
                                                        : <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-base" style={{ background: planColor }}>{(ad.counsellorId?.fullName||'C')[0]}</div>
                                                    }
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-bold text-gray-900">{ad.counsellorId?.fullName}</p>
                                                        <p className="text-xs text-gray-500">{ad.counsellorId?.email}</p>
                                                        <p className="text-xs text-gray-400">{ad.counsellorId?.specialization}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full capitalize" style={{ background: planColor + '20', color: planColor }}>
                                                        {ad.plan}
                                                    </span>
                                                </div>

                                                {/* Ad details */}
                                                <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 text-sm">
                                                    <div className="flex justify-between"><span className="text-gray-500">Tagline</span><span className="text-gray-800 text-right max-w-xs text-xs">{ad.tagline}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">CTA</span><span className="text-gray-800 text-xs">{ad.ctaText}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-gray-800">{ad.durationMonths} month{ad.durationMonths > 1 ? 's' : ''}</span></div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="text-gray-500 font-medium">Amount Paid</span>
                                                        <span className="font-bold text-green-700">₹{ad.amountPaid}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Submitted</span>
                                                        <span className="text-gray-600 text-xs">{new Date(ad.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    </div>
                                                    {ad.status === 'active' && (
                                                        <>
                                                            <div className="flex justify-between"><span className="text-gray-500">Impressions</span><span className="text-indigo-700 font-semibold">{(ad.impressions||0).toLocaleString()}</span></div>
                                                            <div className="flex justify-between"><span className="text-gray-500">Clicks</span><span className="text-green-700 font-semibold">{(ad.clicks||0).toLocaleString()}</span></div>
                                                        </>
                                                    )}
                                                    {ad.adminNote && <div className="flex justify-between"><span className="text-gray-500">Admin note</span><span className="text-red-600 text-xs italic">{ad.adminNote}</span></div>}
                                                </div>

                                                {/* Actions — only for payment_received */}
                                                {isPendingReview && (
                                                    <div className="space-y-2">
                                                        <input type="text"
                                                            placeholder="Rejection reason (required to reject)…"
                                                            value={adRejectNote[ad._id] || ""}
                                                            onChange={e => setAdRejectNote(p => ({ ...p, [ad._id]: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-300"
                                                        />
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleAdAction(ad._id, 'reject')}
                                                                disabled={adActLoading[ad._id] || !adRejectNote[ad._id]?.trim()}
                                                                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                                                                {adActLoading[ad._id] === 'reject' ? <RefreshCw size={11} className="animate-spin"/> : <XCircle size={11}/>}
                                                                Reject & Refund ₹{ad.amountPaid}
                                                            </button>
                                                            <button onClick={() => handleAdAction(ad._id, 'approve')}
                                                                disabled={adActLoading[ad._id]}
                                                                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                                                                {adActLoading[ad._id] === 'approve' ? <RefreshCw size={11} className="animate-spin"/> : <CheckCircle size={11}/>}
                                                                Approve & Go Live
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-center text-gray-400">Rejecting will automatically initiate a refund of ₹{ad.amountPaid} to the counsellor</p>
                                                    </div>
                                                )}

                                                {!isPendingReview && (
                                                    <div className="flex items-center justify-center">
                                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                                            ad.status === 'active'   ? 'bg-green-100 text-green-700' :
                                                            ad.status === 'rejected' ? 'bg-red-100 text-red-700'    :
                                                            ad.status === 'paused'   ? 'bg-gray-100 text-gray-700'  :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {ad.status === 'active' ? '✅ Live on Forum' : ad.status === 'rejected' ? '❌ Rejected' : ad.status === 'paused' ? '⏸ Paused' : ad.status}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    SESSIONS
                ════════════════════════════════════════════════════════════ */}
                {activeTab === "sessions" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Session Analytics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard title="Total Bookings"    value={bookingStats ? fmtNum(bookingStats.totalBookings) : "–"} icon={Calendar}    color="blue"   />
                            <StatCard title="Completed"         value={bookingStats ? fmtNum(bookingStats.statusStats?.find(s=>s._id==="completed")?.count||0) : "–"} icon={CheckCircle} color="green"  />
                            <StatCard title="Cancelled"         value={bookingStats ? fmtNum(bookingStats.statusStats?.find(s=>s._id==="cancelled")?.count||0) : "–"} icon={XCircle}     color="red"    />
                        </div>
                        {bookingStatusData.length > 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Bookings by Status</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={bookingStatusData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar dataKey="value" radius={[4,4,0,0]}>
                                            {bookingStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">No session data yet</div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════
                    ANALYTICS
                ════════════════════════════════════════════════════════════ */}
                {activeTab === "analytics" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Platform Analytics</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Total Revenue"   value={payStats ? fmtRupees(payStats.summary?.totalRevenue)  : "–"} icon={IndianRupee} color="green"  />
                            <StatCard title="Total Refunded"  value={payStats ? fmtRupees(payStats.summary?.totalRefunded) : "–"} icon={XCircle}     color="red"    />
                            <StatCard title="Net Revenue"     value={payStats ? fmtRupees(payStats.summary?.netRevenue)    : "–"} icon={Banknote}     color="blue"   />
                            <StatCard title="Success Rate"    value={payStats ? `${Math.round((payStats.summary.successCount / Math.max(payStats.summary.totalPayments,1))*100)}%` : "–"} icon={TrendingUp}  color="indigo" />
                        </div>

                        {monthlyRevenue.length > 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Revenue Over Time</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <LineChart data={monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'K' : v}`} tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(v) => [`₹${v}`, "Revenue"]} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} name="Revenue (₹)" />
                                        <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Paid Sessions" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
                                <IndianRupee size={40} className="mx-auto mb-3 text-gray-200" />
                                <p>Revenue data will appear here once payments are processed.</p>
                            </div>
                        )}

                        {/* Payment method breakdown */}
                        {payStats?.byMethod?.length > 0 && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Payment Methods</h3>
                                <div className="space-y-3">
                                    {payStats.byMethod.map((m, i) => {
                                        const total = payStats.byMethod.reduce((s, x) => s + x.count, 0);
                                        const pct   = Math.round((m.count / total) * 100);
                                        return (
                                            <div key={i}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-700 capitalize">{m._id || "Unknown"}</span>
                                                    <span className="text-gray-500">{m.count} ({pct}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* User detail modal */}
            {selectedUser && (
                <UserModal
                    user={selectedUser}
                    loading={!!userActLoading[selectedUser._id]}
                    onApprove={(id) => handleUserAction(id, 'approve')}
                    onReject={(id)  => handleUserAction(id, 'reject')}
                    onClose={() => setSelectedUser(null)}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm ${
                    toast.type === "error" ? "bg-red-600" : toast.type === "warning" ? "bg-yellow-500" : "bg-green-600"
                }`}>
                    {toast.type === "error" ? <AlertCircle size={16}/> : <CheckCircle size={16}/>}
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
