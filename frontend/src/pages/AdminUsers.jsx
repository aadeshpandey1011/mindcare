import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Search, Filter, RefreshCw, CheckCircle, XCircle,
    AlertTriangle, Eye, RotateCcw, Users, UserCheck,
    UserX, Shield, ChevronDown, X, IndianRupee,
    Calendar, Star, Ban,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtRupees = (n) => `₹${Number(n || 0).toLocaleString()}`;

const ROLE_BADGE = {
    student:   'bg-blue-100   text-blue-800   border-blue-200',
    counsellor:'bg-green-100  text-green-800  border-green-200',
    admin:     'bg-red-100    text-red-800    border-red-200',
};
const STATUS_BADGE = {
    approved: 'bg-green-100  text-green-700',
    pending:  'bg-yellow-100 text-yellow-700',
    rejected: 'bg-red-100    text-red-700',
};

// ── User Detail Drawer ─────────────────────────────────────────────────────────
function UserDrawer({ userId, token, onClose, onAction }) {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [termReason, setTermReason] = useState('');
    const [acting, setActing] = useState(null);
    const [showTermForm, setShowTermForm] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res  = await fetch(`${API_BASE}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                const resp = await res.json();
                if (resp.success) setData(resp.data);
            } catch (e) { /* silent */ }
            finally { setLoading(false); }
        })();
    }, [userId]);

    const handleAction = async (action) => {
        setActing(action);
        try {
            const url    = `${API_BASE}/admin/users/${userId}/${action}`;
            const method = action === 'terminate' ? 'DELETE' : 'PUT';
            const res    = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ reason: termReason }),
            });
            const resp = await res.json();
            if (!res.ok) throw new Error(resp.message);
            onAction(action, userId);
            onClose();
        } catch (e) { alert(e.message); }
        finally { setActing(null); }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end" onClick={onClose}>
            <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 text-lg">User Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <RefreshCw size={28} className="animate-spin text-indigo-400" />
                        <p className="text-gray-400 text-sm">Loading…</p>
                    </div>
                ) : !data ? (
                    <div className="p-6 text-center text-gray-400">Failed to load user</div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Avatar + name */}
                        <div className="flex flex-col items-center text-center gap-3">
                            {data.user.avatar
                                ? <img src={data.user.avatar} alt={data.user.fullName} className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100" />
                                : <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">{(data.user.fullName||'U')[0]}</div>
                            }
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{data.user.fullName}</h3>
                                <p className="text-gray-500 text-sm">{data.user.email}</p>
                                {data.user.username && <p className="text-gray-400 text-xs">@{data.user.username}</p>}
                            </div>
                            <div className="flex gap-2 flex-wrap justify-center">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${ROLE_BADGE[data.user.role]}`}>{data.user.role}</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[data.user.status] || 'bg-gray-100 text-gray-600'}`}>
                                    {data.user.isApproved ? 'Active' : data.user.status}
                                </span>
                                {data.user.isBannedFromForum && <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Forum Banned</span>}
                            </div>
                        </div>

                        {/* Info grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Role',           value: data.user.role,            cap: true },
                                { label: 'Joined',         value: fmtDate(data.user.createdAt) },
                                ...(data.user.specialization ? [{ label: 'Specialization', value: data.user.specialization }] : []),
                                ...(data.user.institution   ? [{ label: 'Institution',     value: data.user.institution    }] : []),
                                ...(data.user.sessionFee !== undefined && data.user.role === 'counsellor'
                                    ? [{ label: 'Session Fee', value: fmtRupees(data.user.sessionFee) }] : []),
                                ...(data.user.avgRating && data.user.role === 'counsellor'
                                    ? [{ label: 'Avg Rating', value: `⭐ ${data.user.avgRating} (${data.user.totalReviews} reviews)` }] : []),
                            ].map(({ label, value, cap }) => (
                                <div key={label} className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                                    <p className={`text-sm font-semibold text-gray-900 ${cap ? 'capitalize' : ''}`}>{value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Activity summary */}
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-3">Activity Summary</p>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <p className="text-xl font-bold text-indigo-700">{data.activity.totalBookings}</p>
                                    <p className="text-xs text-indigo-500">Bookings</p>
                                </div>
                                <div className="border-x border-indigo-200">
                                    <p className="text-xl font-bold text-green-700">{data.activity.paymentCount}</p>
                                    <p className="text-xs text-green-600">Payments</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-indigo-700">{fmtRupees(data.activity.totalPaid)}</p>
                                    <p className="text-xs text-indigo-500">Total Paid</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            {/* Restore if suspended */}
                            {(!data.user.isApproved && data.user.status === 'rejected' && data.user.role !== 'admin') && (
                                <button onClick={() => handleAction('restore')} disabled={!!acting}
                                    className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {acting === 'restore' ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                    Restore Account
                                </button>
                            )}

                            {/* Terminate — only if not already terminated and not admin */}
                            {data.user.role !== 'admin' && (data.user.isApproved || data.user.status !== 'rejected') && (
                                <>
                                    {!showTermForm ? (
                                        <button onClick={() => setShowTermForm(true)}
                                            className="w-full py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 flex items-center justify-center gap-2">
                                            <Ban size={14} /> Terminate Account
                                        </button>
                                    ) : (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs text-red-700 font-semibold">⚠️ This will disable login, cancel all upcoming bookings, and ban from forum.</p>
                                            <textarea value={termReason} onChange={e => setTermReason(e.target.value)}
                                                placeholder="Reason for termination (required)…" rows={3}
                                                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
                                            <div className="flex gap-2">
                                                <button onClick={() => setShowTermForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                                <button onClick={() => handleAction('terminate')} disabled={!termReason.trim() || !!acting}
                                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                                    {acting === 'terminate' ? <RefreshCw size={13} className="animate-spin"/> : <Ban size={13}/>}
                                                    Confirm Terminate
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const { token } = useAuth();

    const [users,      setUsers]      = useState([]);
    const [stats,      setStats]      = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [pagination, setPagination] = useState({});

    // Filters
    const [search,   setSearch]   = useState('');
    const [roleFilter,   setRoleFilter]   = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [page,     setPage]     = useState(1);

    // Drawer
    const [selectedUserId, setSelectedUserId] = useState(null);

    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (search)                      params.set('search', search);
            if (roleFilter   !== 'all')      params.set('role',   roleFilter);
            if (statusFilter !== 'all')      params.set('status', statusFilter);

            const res  = await fetch(`${API_BASE}/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setUsers(data.data.users || []);
            setPagination(data.data.pagination || {});
            setStats(data.data.stats || null);
        } catch (e) { showToast(e.message, 'error'); }
        finally { setLoading(false); }
    }, [token, page, search, roleFilter, statusFilter]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Debounce search
    const [searchInput, setSearchInput] = useState('');
    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const handleDrawerAction = (action, userId) => {
        const label = action === 'terminate' ? 'Account terminated' : 'Account restored';
        showToast(label);
        fetchUsers();
    };

    const handleQuickAction = async (userId, action) => {
        try {
            const url    = `${API_BASE}/admin/users/${userId}/${action}`;
            const method = action === 'terminate' ? 'DELETE' : 'PUT';
            const res    = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ reason: 'Admin action from user list' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(action === 'terminate' ? 'Account terminated' : 'Account restored');
            fetchUsers();
        } catch (e) { showToast(e.message, 'error'); }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                            <p className="text-sm text-gray-500 mt-1">View, search, and manage all registered users</p>
                        </div>
                        <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>

                    {/* Stats pills */}
                    {stats && (
                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: 'Total Students',    value: stats.totalStudents,    color: 'blue',  icon: Users      },
                                { label: 'Counsellors',       value: stats.totalCounsellors, color: 'green', icon: UserCheck  },
                                { label: 'Admins',            value: stats.totalAdmins,      color: 'red',   icon: Shield     },
                                { label: 'Pending Approval',  value: stats.pendingApprovals, color: 'yellow',icon: AlertTriangle },
                            ].map(({ label, value, color, icon: Icon }) => (
                                <div key={label} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-${color}-50 border-${color}-200`}>
                                    <Icon size={16} className={`text-${color}-500`} />
                                    <span className={`text-2xl font-bold text-${color}-700`}>{value}</span>
                                    <span className={`text-sm text-${color}-600`}>{label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search by name, email or username…"
                            value={searchInput} onChange={e => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="counsellor">Counsellors</option>
                        <option value="admin">Admins</option>
                    </select>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                        <option value="all">All Status</option>
                        <option value="approved">Active</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Terminated</option>
                    </select>
                </div>

                {/* Count */}
                <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-500">{pagination.total || 0} users found</p>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center gap-3">
                        <RefreshCw size={28} className="animate-spin text-indigo-400" />
                        <p className="text-gray-400 text-sm">Loading users…</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                        <Users size={40} className="mx-auto mb-3 text-gray-200" />
                        <h3 className="text-lg font-semibold text-gray-700">No users found</h3>
                        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        {['User', 'Role', 'Status', 'Joined', 'Details', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => {
                                        const isTerminated = !u.isApproved && u.status === 'rejected';
                                        return (
                                            <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${isTerminated ? 'opacity-60' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {u.avatar
                                                            ? <img src={u.avatar} alt={u.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                                            : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{(u.fullName||'?')[0]}</div>
                                                        }
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{u.fullName}</p>
                                                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {isTerminated
                                                        ? <span className="flex items-center gap-1 text-xs text-red-600 font-medium"><Ban size={11}/>Terminated</span>
                                                        : u.isApproved
                                                            ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle size={11}/>Active</span>
                                                            : <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium"><AlertTriangle size={11}/>Pending</span>
                                                    }
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs text-gray-500 space-y-0.5">
                                                        {u.specialization && <p className="truncate max-w-[140px]">{u.specialization}</p>}
                                                        {u.role === 'counsellor' && u.sessionFee !== undefined && <p>₹{u.sessionFee}/session</p>}
                                                        {u.avgRating > 0 && <p>⭐ {u.avgRating}</p>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <button onClick={() => setSelectedUserId(u._id)} title="View details"
                                                            className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                                                            <Eye size={13}/>
                                                        </button>
                                                        {isTerminated ? (
                                                            <button onClick={() => handleQuickAction(u._id, 'restore')} title="Restore account"
                                                                className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                                                                <RotateCcw size={13}/>
                                                            </button>
                                                        ) : u.role !== 'admin' && (
                                                            <button onClick={() => {
                                                                if (window.confirm(`Terminate ${u.fullName}'s account? This will cancel all their bookings.`))
                                                                    handleQuickAction(u._id, 'terminate');
                                                            }} title="Terminate account"
                                                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                                                <Ban size={13}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Page {pagination.page} of {pagination.totalPages} · {pagination.total} users
                                </p>
                                <div className="flex gap-2">
                                    <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={!pagination.hasPrev}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                                    <button onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))} disabled={!pagination.hasNext}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">Next →</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Side drawer */}
            {selectedUserId && (
                <UserDrawer
                    userId={selectedUserId}
                    token={token}
                    onClose={() => setSelectedUserId(null)}
                    onAction={handleDrawerAction}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium ${
                    toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
                }`}>
                    {toast.type === 'error' ? <XCircle size={15}/> : <CheckCircle size={15}/>}
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
