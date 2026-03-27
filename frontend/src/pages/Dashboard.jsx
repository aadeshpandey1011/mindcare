import React, { useEffect, useState, useCallback } from "react";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import {
    Users, Calendar, Activity, TrendingUp, AlertCircle, Clock,
    Search, Eye, CheckCircle, XCircle, RefreshCw,
    Bell, BarChart3, IndianRupee, Megaphone, Banknote,
    UserCheck, Star, ShieldAlert, Scale, CheckSquare,
    AlertTriangle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000/api/v1";

const fmtRupees = (n) => n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K` : `₹${Number(n||0).toFixed(0)}`;
const fmtNum   = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n || 0);
// Null-safe date formatter — never shows "Invalid Date"
const fmtDate  = (d) => {
    if (!d) return "—";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
};
const COLORS   = ["#059669","#10b981","#f59e0b","#ef4444","#0d9488","#0ea5e9"];

function StatCard({ title, value, subtitle, icon: Icon, color = "blue", trend, trendUp }) {
    const colorMap = {
        blue:   { bg:"bg-blue-50",   text:"text-blue-600",   icon:"text-blue-500"   },
        green:  { bg:"bg-green-50",  text:"text-green-600",  icon:"text-green-500"  },
        yellow: { bg:"bg-yellow-50", text:"text-yellow-600", icon:"text-yellow-500" },
        red:    { bg:"bg-red-50",    text:"text-red-600",    icon:"text-red-500"    },
        purple: { bg:"bg-purple-50", text:"text-purple-600", icon:"text-purple-500" },
        emerald:{ bg:"bg-emerald-50",text:"text-emerald-600", icon:"text-emerald-500" },
        orange: { bg:"bg-orange-50", text:"text-orange-600", icon:"text-orange-500" },
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
                <p className={`text-xs mt-1 flex items-center gap-1 ${trendUp ? "text-green-600" : "text-red-500"}`}>
                    <TrendingUp size={11} /> {trendUp ? "+" : ""}{trend}% from last month
                </p>
            )}
        </div>
    );
}

// ── User modal ────────────────────────────────────────────────────────────────
function UserModal({ user, loading, onApprove, onReject, onClose }) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">User Profile</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={20}/></button>
                </div>
                <div className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        {user.avatar
                            ? <img src={user.avatar} alt={user.fullName} className="w-20 h-20 rounded-full object-cover border-4 border-emerald-100 mb-3"/>
                            : <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-emerald-100 mb-3">{(user.fullName||"?")[0]}</div>
                        }
                        <h4 className="text-xl font-bold text-gray-900">{user.fullName}</h4>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 capitalize">{user.role}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                        {user.specialization && <div className="col-span-2 bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Specialization</p><p className="font-medium text-gray-900">{user.specialization}</p></div>}
                        {user.institution     && <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Institution</p><p className="font-medium text-gray-900">{user.institution}</p></div>}
                        <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Status</p><p className="font-medium capitalize text-gray-900">{user.status}</p></div>
                        <div className="bg-gray-50 rounded-xl p-3"><p className="text-gray-400 text-xs mb-0.5">Joined</p><p className="font-medium text-gray-900">{fmtDate(user.createdAt)}</p></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => onReject(user._id)} disabled={loading}
                            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <RefreshCw size={14} className="animate-spin"/> : <XCircle size={14}/>} Reject
                        </button>
                        <button onClick={() => onApprove(user._id)} disabled={loading}
                            className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            {loading ? <RefreshCw size={14} className="animate-spin"/> : <CheckCircle size={14}/>} Approve
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DISPUTE CARD
//  FIX 1: isResolved checks adminDisputeResolution.decision (string),
//         NOT the whole subdoc object (which is truthy even when empty {}).
//  FIX 2: fmtDate handles null/undefined resolvedAt without "Invalid Date".
//  FIX 3: Action buttons are always visible for open disputes — no hidden state.
// ─────────────────────────────────────────────────────────────────────────────
function DisputeCard({ dispute, onResolve, resolving }) {
    const [decision, setDecision] = useState("");
    const [note,     setNote]     = useState("");

    const reason = dispute.cancellationReason?.replace(/^DISPUTE:\s*/i, "").trim() || "No reason provided";

    // ✅ FIXED: Check the nested .decision string, not the subdoc object itself.
    // An empty {} or null subdoc is falsy for a string check but truthy for !!{}.
    const isResolved = !!(dispute.adminDisputeResolution?.decision);
    const resolution  = dispute.adminDisputeResolution;

    const isSubmitting = resolving[dispute._id];

    const handleConfirm = () => {
        if (!decision || isSubmitting) return;
        onResolve(dispute._id, decision, note);
    };

    return (
        <div className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-shadow ${
            isResolved
                ? "border border-gray-200"
                : "border-2 border-orange-400 shadow-orange-100 shadow-md"
        }`}>
            {/* Top colour strip */}
            <div className={`h-1.5 w-full ${isResolved ? "bg-gray-300" : "bg-orange-500"}`} />

            <div className="p-5 space-y-4">

                {/* ── Header row ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isResolved ? "bg-gray-100" : "bg-orange-100"}`}>
                            {isResolved
                                ? <CheckSquare size={14} className="text-gray-500"/>
                                : <AlertTriangle size={14} className="text-orange-600"/>
                            }
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isResolved ? "bg-gray-100 text-gray-600" : "bg-orange-100 text-orange-700"
                        }`}>
                            {isResolved ? "✅ Resolved" : "🔴 Open — Action Required"}
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">{fmtDate(dispute.createdAt)}</span>
                </div>

                {/* ── Parties ── */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1.5">Student (filed dispute)</p>
                        <div className="flex items-center gap-2">
                            {dispute.student?.avatar
                                ? <img src={dispute.student.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"/>
                                : <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{(dispute.student?.fullName||"S")[0]}</div>
                            }
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{dispute.student?.fullName}</p>
                                <p className="text-[10px] text-gray-400 truncate">{dispute.student?.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wide mb-1.5">Counsellor</p>
                        <div className="flex items-center gap-2">
                            {dispute.counselor?.avatar
                                ? <img src={dispute.counselor.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"/>
                                : <div className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{(dispute.counselor?.fullName||"C")[0]}</div>
                            }
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">{dispute.counselor?.fullName}</p>
                                <p className="text-[10px] text-gray-400 truncate">{dispute.counselor?.specialization}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Session details ── */}
                <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-xs space-y-1.5">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Session Date</span>
                        <span className="font-medium text-gray-800">{fmtDate(dispute.date)} · {dispute.timeSlot}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Mode</span>
                        <span className="font-medium text-gray-800 capitalize">{dispute.mode}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-gray-200">
                        <span className="text-gray-600 font-semibold">Fee in dispute</span>
                        <span className="font-bold text-gray-900 text-sm">₹{dispute.feePaid || 0}</span>
                    </div>
                </div>

                {/* ── Student's dispute reason ── */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide mb-1">Student's Dispute Reason</p>
                    <p className="text-xs text-gray-800 leading-relaxed">{reason}</p>
                </div>

                {/* ── RESOLVED: show outcome ── */}
                {isResolved && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Admin Resolution</p>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Decision</span>
                                <span className={`font-bold text-sm ${resolution.decision === "refund_student" ? "text-green-700" : "text-indigo-700"}`}>
                                    {resolution.decision === "refund_student" ? "💰 Refunded to student" : "📤 Released to counsellor"}
                                </span>
                            </div>
                            {resolution.note && (
                                <div className="flex items-start justify-between gap-4">
                                    <span className="text-gray-500 flex-shrink-0">Admin note</span>
                                    <span className="text-gray-700 italic text-right">"{resolution.note}"</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Resolved on</span>
                                {/* ✅ FIXED: fmtDate handles null/undefined — no more "Invalid Date" */}
                                <span className="text-gray-700">{fmtDate(resolution.resolvedAt)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── OPEN: admin decision panel ── */}
                {!isResolved && (
                    <div className="border-2 border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-bold text-orange-800 flex items-center gap-1.5">
                            <Scale size={13}/> Your Decision — choose one:
                        </p>

                        {/* Two big decision buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setDecision("refund_student")}
                                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                                    decision === "refund_student"
                                        ? "border-green-500 bg-green-50 text-green-800 shadow-sm"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50"
                                }`}>
                                <span className="text-2xl">💰</span>
                                <span>Refund Student</span>
                                <span className="text-[10px] font-normal opacity-70">₹{dispute.feePaid} back to student</span>
                                {decision === "refund_student" && <span className="text-green-600 font-bold">✓ Selected</span>}
                            </button>
                            <button
                                onClick={() => setDecision("release_counsellor")}
                                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                                    decision === "release_counsellor"
                                        ? "border-indigo-500 bg-indigo-50 text-indigo-800 shadow-sm"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50"
                                }`}>
                                <span className="text-2xl">📤</span>
                                <span>Pay Counsellor</span>
                                <span className="text-[10px] font-normal opacity-70">₹{dispute.feePaid} to counsellor</span>
                                {decision === "release_counsellor" && <span className="text-indigo-600 font-bold">✓ Selected</span>}
                            </button>
                        </div>

                        {/* What will happen preview */}
                        {decision && (
                            <div className={`text-xs rounded-lg px-3 py-2 leading-relaxed ${
                                decision === "refund_student"
                                    ? "bg-green-100 border border-green-300 text-green-800"
                                    : "bg-indigo-100 border border-indigo-300 text-indigo-800"
                            }`}>
                                {decision === "refund_student"
                                    ? `✅ A refund of ₹${dispute.feePaid} will be sent to ${dispute.student?.fullName}. The counsellor will NOT receive payment. Both will get an email.`
                                    : `✅ ₹${dispute.feePaid} will be released to ${dispute.counselor?.fullName}'s bank account. The student will NOT be refunded. Both will get an email.`
                                }
                            </div>
                        )}

                        {/* Optional admin note */}
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={2}
                            placeholder="Admin note (optional) — included in the emails sent to both parties…"
                            className="w-full px-3 py-2 border border-orange-200 rounded-xl text-xs resize-none bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400"
                        />

                        {/* Confirm button — disabled until decision is selected */}
                        <button
                            onClick={handleConfirm}
                            disabled={!decision || isSubmitting}
                            className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                                !decision
                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                    : isSubmitting
                                        ? "bg-orange-400 text-white cursor-wait"
                                        : "bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg"
                            }`}>
                            {isSubmitting ? (
                                <><RefreshCw size={14} className="animate-spin"/> Resolving dispute…</>
                            ) : !decision ? (
                                <>⚖️ Select a decision above to continue</>
                            ) : (
                                <><Scale size={14}/> Confirm &amp; Resolve Dispute</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
    const { token, user } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [refreshing, setRefreshing] = useState(false);

    const [overview,     setOverview]     = useState(null);
    const [payStats,     setPayStats]     = useState(null);
    const [bookingStats, setBookingStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const [pendingUsers,    setPendingUsers]    = useState([]);
    const [usersLoading,    setUsersLoading]    = useState(false);
    const [searchTerm,      setSearchTerm]      = useState("");
    const [filterRole,      setFilterRole]      = useState("all");
    const [selectedUser,    setSelectedUser]    = useState(null);
    const [userActLoading,  setUserActLoading]  = useState({});

    const [ads,            setAds]            = useState([]);
    const [adFilter,       setAdFilter]       = useState("payment_received");
    const [adsLoading,     setAdsLoading]     = useState(false);
    const [adActLoading,   setAdActLoading]   = useState({});
    const [pendingAdCount, setPendingAdCount] = useState(0);
    const [adRejectNote,   setAdRejectNote]   = useState({});

    const [disputes,         setDisputes]         = useState([]);
    const [openDisputes,     setOpenDisputes]     = useState(0);
    const [disputeFilter,    setDisputeFilter]    = useState("open");
    const [disputesLoading,  setDisputesLoading]  = useState(false);
    const [resolvingDispute, setResolvingDispute] = useState({});

    const [toast, setToast] = useState(null);
    const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4500); };

    const fetchOverview = useCallback(async () => {
        try {
            const [usersRes, payRes, bookRes, dispRes] = await Promise.all([
                fetch(`${API_BASE}/admin/pending-users`,  { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/payments/stats`,       { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/bookings/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE}/admin/disputes?status=open&limit=1`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [usersData, payData, bookData, dispData] = await Promise.all([
                usersRes.json(), payRes.json(), bookRes.json(), dispRes.json(),
            ]);
            if (usersData.success) setOverview(prev => ({ ...prev, pendingApprovals: usersData.data?.users?.length || 0 }));
            if (payData.success)   setPayStats(payData.data);
            if (bookData.success)  setBookingStats(bookData.data);
            if (dispData.success)  setOpenDisputes(dispData.data?.openCount || 0);
        } catch (e) { console.error("[Dashboard overview]", e.message); }
        finally { setStatsLoading(false); }
    }, [token]);

    const fetchPendingUsers = useCallback(async () => {
        setUsersLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/admin/pending-users`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setPendingUsers(data.data?.users || []);
        } catch (e) { showToast("Failed to load users", "error"); }
        finally { setUsersLoading(false); }
    }, [token]);

    const fetchAds = useCallback(async (statusFilter = adFilter) => {
        setAdsLoading(true);
        try {
            const params = new URLSearchParams({ limit: 50 });
            if (statusFilter !== "all") params.set("status", statusFilter);
            const res  = await fetch(`${API_BASE}/ads/admin/all?${params}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) { setAds(data.data.ads || []); setPendingAdCount(data.data.pendingCount || 0); }
        } catch (e) { showToast("Failed to load ads", "error"); }
        finally { setAdsLoading(false); }
    }, [token, adFilter]);

    const fetchDisputes = useCallback(async (filter = disputeFilter) => {
        setDisputesLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/admin/disputes?status=${filter}&limit=50`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                setDisputes(data.data.disputes || []);
                setOpenDisputes(data.data.openCount || 0);
            }
        } catch (e) { showToast("Failed to load disputes", "error"); }
        finally { setDisputesLoading(false); }
    }, [token, disputeFilter]);

    useEffect(() => { fetchOverview(); }, [fetchOverview]);
    useEffect(() => { if (activeTab === "users")    fetchPendingUsers(); }, [activeTab]);
    useEffect(() => { if (activeTab === "ads")      fetchAds(adFilter);  }, [activeTab, adFilter]);
    useEffect(() => { if (activeTab === "disputes") fetchDisputes(disputeFilter); }, [activeTab, disputeFilter]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOverview();
        if (activeTab === "users")    await fetchPendingUsers();
        if (activeTab === "ads")      await fetchAds();
        if (activeTab === "disputes") await fetchDisputes();
        setRefreshing(false);
    };

    const handleUserAction = async (userId, action) => {
        setUserActLoading(p => ({ ...p, [userId]: action }));
        try {
            const res  = await fetch(`${API_BASE}/admin/${action}/${userId}`, {
                method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

    const handleAdAction = async (adId, action) => {
        const note = adRejectNote[adId] || "";
        if (action === "reject" && !note.trim()) { showToast("Please provide a rejection reason", "error"); return; }
        setAdActLoading(p => ({ ...p, [adId]: action }));
        try {
            const res  = await fetch(`${API_BASE}/ads/admin/${adId}/review`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action, note }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(action === "approve" ? "Ad approved! Now live on forum." : "Ad rejected. Refund initiated.", action === "approve" ? "success" : "warning");
            await fetchAds();
            await fetchOverview();
        } catch (e) { showToast(`Error: ${e.message}`, "error"); }
        finally { setAdActLoading(p => ({ ...p, [adId]: null })); }
    };

    const handleResolveDispute = async (bookingId, decision, note) => {
        setResolvingDispute(p => ({ ...p, [bookingId]: true }));
        try {
            const res  = await fetch(`${API_BASE}/admin/disputes/${bookingId}/resolve`, {
                method:  "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ decision, note }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast(data.data?.outcome || "Dispute resolved. Both parties have been notified by email.");
            // Refresh both the list and overview badge
            await fetchDisputes(disputeFilter);
            await fetchOverview();
        } catch (e) { showToast(`Error: ${e.message}`, "error"); }
        finally { setResolvingDispute(p => ({ ...p, [bookingId]: false })); }
    };

    const monthlyRevenue = payStats?.monthlyRevenue?.slice().reverse().map(m => ({
        month: new Date(m.year, m.month - 1).toLocaleString("default", { month: "short" }),
        revenue: Number(m.revenue), sessions: m.count,
    })) || [];

    const bookingStatusData = bookingStats?.statusStats?.map(s => ({
        name:  s._id === "completed" ? "Completed" : s._id === "confirmed" ? "Confirmed" : s._id === "cancelled" ? "Cancelled" : s._id === "pending" ? "Pending" : s._id,
        value: s.count,
    })) || [];

    const filteredUsers = pendingUsers.filter(u => {
        const q = searchTerm.toLowerCase();
        return (u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) && (filterRole === "all" || u.role === filterRole);
    });

    const totalPending = pendingUsers.length + pendingAdCount + openDisputes;

    const TABS = [
        { id: "overview",  label: "Overview",       icon: Activity   },
        { id: "users",     label: "User Approvals", icon: Users,       badge: pendingUsers.length },
        { id: "ads",       label: "Ad Requests",    icon: Megaphone,   badge: pendingAdCount      },
        { id: "disputes",  label: "Disputes",       icon: ShieldAlert, badge: openDisputes, badgeColor: "bg-orange-500" },
        { id: "sessions",  label: "Sessions",       icon: Calendar     },
        { id: "analytics", label: "Analytics",      icon: BarChart3    },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                        <p className="text-sm text-gray-500">Welcome back, {user?.fullName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {totalPending > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                                <Bell size={13}/>
                                {totalPending} action{totalPending !== 1 ? "s" : ""} needed
                                {openDisputes > 0 && <span className="ml-1 px-1.5 py-0.5 bg-orange-500 text-white rounded-full text-[10px] font-bold">{openDisputes} dispute{openDisputes !== 1 ? "s" : ""}</span>}
                            </div>
                        )}
                        <button onClick={handleRefresh} disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""}/> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
                    {TABS.map(({ id, label, icon: Icon, badge, badgeColor }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className={`relative flex items-center gap-2 px-4 py-4 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === id ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}>
                            <Icon size={15}/> {label}
                            {badge > 0 && (
                                <span className={`min-w-[18px] h-[18px] px-1 rounded-full ${badgeColor || "bg-red-500"} text-white text-[10px] font-bold flex items-center justify-center`}>
                                    {badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* ── OVERVIEW ── */}
                {activeTab === "overview" && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Total Revenue"   value={payStats ? fmtRupees(payStats.summary?.totalRevenue)  : "–"} subtitle="All-time"           icon={IndianRupee} color="green"  />
                            <StatCard title="Net Revenue"     value={payStats ? fmtRupees(payStats.summary?.netRevenue)    : "–"} subtitle="After refunds"       icon={Banknote}    color="blue"   />
                            <StatCard title="Total Sessions"  value={bookingStats ? fmtNum(bookingStats.totalBookings)     : "–"} subtitle="All time"            icon={Calendar}    color="purple" />
                            <StatCard title="Open Disputes"   value={openDisputes}                                                subtitle="Awaiting your decision" icon={ShieldAlert} color="orange" />
                        </div>

                        {openDisputes > 0 && (
                            <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex items-start gap-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <ShieldAlert size={20} className="text-orange-600"/>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-orange-800 text-sm">
                                        ⚠️ {openDisputes} open dispute{openDisputes !== 1 ? "s" : ""} require your attention
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        Students have raised disputes on sessions. Review each case and issue a decision to resolve payment.
                                    </p>
                                </div>
                                <button onClick={() => setActiveTab("disputes")}
                                    className="flex-shrink-0 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors">
                                    Review Now →
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard title="Payments Collected" value={payStats ? fmtNum(payStats.summary?.successCount)  : "–"} icon={CheckCircle} color="green"  />
                            <StatCard title="Refunds Issued"     value={payStats ? fmtNum(payStats.summary?.refundCount)   : "–"} icon={XCircle}     color="red"    />
                            <StatCard title="Completed Sessions" value={bookingStats ? fmtNum(bookingStats.statusStats?.find(s=>s._id==="completed")?.count||0) : "–"} icon={UserCheck} color="indigo" />
                            <StatCard title="Pending Reviews"    value={pendingUsers.length + pendingAdCount} subtitle={`${pendingUsers.length} users · ${pendingAdCount} ads`} icon={Clock} color="yellow" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Monthly Revenue (₹)</h3>
                                {monthlyRevenue.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <AreaChart data={monthlyRevenue}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                                            <XAxis dataKey="month" tick={{ fontSize:12 }}/>
                                            <YAxis tickFormatter={v => `₹${v>=1000?(v/1000).toFixed(0)+"K":v}`} tick={{ fontSize:11 }}/>
                                            <Tooltip formatter={(v) => [`₹${v}`,"Revenue"]}/>
                                            <Area type="monotone" dataKey="revenue" stroke="#059669" fill="#059669" fillOpacity={0.15} strokeWidth={2}/>
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>}
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Booking Status Distribution</h3>
                                {bookingStatusData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart>
                                            <Pie data={bookingStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                                                {bookingStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                                            </Pie>
                                            <Tooltip/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No booking data yet</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-5 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Pending User Approvals</h3>
                                {pendingUsers.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400"><CheckCircle size={28} className="mx-auto mb-2 text-green-400"/><p className="text-xs">All caught up!</p></div>
                                ) : (
                                    <div className="space-y-2">
                                        {pendingUsers.slice(0,3).map(u => (
                                            <div key={u._id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {u.avatar ? <img src={u.avatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"/> : <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{(u.fullName||"?")[0]}</div>}
                                                    <div className="min-w-0"><p className="text-xs font-medium text-gray-900 truncate">{u.fullName}</p><p className="text-[10px] text-gray-400 capitalize truncate">{u.role}</p></div>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    <button onClick={() => handleUserAction(u._id,"reject")}  disabled={userActLoading[u._id]} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"><XCircle size={12}/></button>
                                                    <button onClick={() => handleUserAction(u._id,"approve")} disabled={userActLoading[u._id]} className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 disabled:opacity-50"><CheckCircle size={12}/></button>
                                                </div>
                                            </div>
                                        ))}
                                        {pendingUsers.length > 3 && <button onClick={() => setActiveTab("users")} className="w-full text-xs text-emerald-600 hover:underline pt-1">+{pendingUsers.length-3} more →</button>}
                                    </div>
                                )}
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Pending Ad Requests</h3>
                                {ads.filter(a=>a.status==="payment_received").length === 0 ? (
                                    <div className="text-center py-6 text-gray-400"><Megaphone size={28} className="mx-auto mb-2 text-emerald-200"/><p className="text-xs">No ads awaiting review.</p></div>
                                ) : (
                                    <div className="space-y-2">
                                        {ads.filter(a=>a.status==="payment_received").slice(0,3).map(ad => (
                                            <div key={ad._id} className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-xl">
                                                <div className="min-w-0"><p className="text-xs font-medium text-gray-900 truncate">{ad.counsellorId?.fullName}</p><p className="text-[10px] text-emerald-600 capitalize">{ad.plan} · ₹{ad.amountPaid}</p></div>
                                                <button onClick={() => setActiveTab("ads")} className="text-[11px] text-emerald-600 font-semibold hover:underline flex-shrink-0">Review →</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className={`p-5 rounded-xl border-2 ${openDisputes > 0 ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"}`}>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <ShieldAlert size={14} className={openDisputes > 0 ? "text-orange-600" : "text-gray-400"}/>
                                    Open Disputes
                                </h3>
                                {openDisputes === 0 ? (
                                    <div className="text-center py-6 text-gray-400"><Scale size={28} className="mx-auto mb-2 text-gray-200"/><p className="text-xs">No open disputes.</p></div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-4xl font-black text-orange-600 mb-1">{openDisputes}</p>
                                        <p className="text-xs text-orange-600 mb-4">dispute{openDisputes !== 1 ? "s" : ""} awaiting resolution</p>
                                        <button onClick={() => setActiveTab("disputes")} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg transition-colors">Review Now →</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── USER APPROVALS ── */}
                {activeTab === "users" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div><h2 className="text-xl font-bold text-gray-900">User Approvals</h2><p className="text-sm text-gray-500 mt-0.5">{pendingUsers.length} awaiting review</p></div>
                            <button onClick={fetchPendingUsers} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><RefreshCw size={13} className={usersLoading?"animate-spin":""}/> Refresh</button>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 flex gap-3">
                            <div className="flex-1 relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Search name or email…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"/></div>
                            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none"><option value="all">All Roles</option><option value="student">Students</option><option value="counsellor">Counsellors</option></select>
                        </div>
                        {usersLoading ? (
                            <div className="flex flex-col items-center py-20 gap-3"><RefreshCw size={28} className="animate-spin text-indigo-400"/><p className="text-gray-400 text-sm">Loading…</p></div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center"><div className="text-5xl mb-3">✅</div><h3 className="text-lg font-semibold text-gray-700">All Caught Up!</h3><p className="text-gray-400 text-sm">No pending approvals.</p></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredUsers.map(u => (
                                    <div key={u._id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-20 bg-gradient-to-r from-emerald-400 to-emerald-600 relative">
                                            <div className="absolute -bottom-7 left-4">{u.avatar?<img src={u.avatar} alt="" className="w-14 h-14 rounded-full object-cover border-3 border-white shadow"/>:<div className="w-14 h-14 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-lg border-3 border-white shadow">{(u.fullName||"?")[0]}</div>}</div>
                                        </div>
                                        <div className="pt-10 px-4 pb-4">
                                            <p className="font-bold text-gray-900">{u.fullName}</p>
                                            <p className="text-xs text-gray-400 mb-3">@{u.username||u.email}</p>
                                            <div className="flex flex-wrap gap-1 mb-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 capitalize">{u.role}</span>{u.specialization && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{u.specialization}</span>}</div>
                                            <p className="text-xs text-gray-400 mb-4">{u.email}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => setSelectedUser(u)} className="flex items-center gap-1 px-2 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"><Eye size={12}/> View</button>
                                                <button onClick={() => handleUserAction(u._id,"reject")} disabled={userActLoading[u._id]} className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 disabled:opacity-50 flex-1 justify-center">{userActLoading[u._id]==="reject"?<RefreshCw size={11} className="animate-spin"/>:<XCircle size={11}/>} Reject</button>
                                                <button onClick={() => handleUserAction(u._id,"approve")} disabled={userActLoading[u._id]} className="flex items-center gap-1 px-2 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 disabled:opacity-50 flex-1 justify-center">{userActLoading[u._id]==="approve"?<RefreshCw size={11} className="animate-spin"/>:<CheckCircle size={11}/>} Approve</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── AD REQUESTS ── */}
                {activeTab === "ads" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div><h2 className="text-xl font-bold text-gray-900">Forum Ad Requests</h2><p className="text-sm text-gray-500 mt-0.5">{pendingAdCount} awaiting review</p></div>
                            <div className="flex items-center gap-2">
                                <select value={adFilter} onChange={e => setAdFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none"><option value="payment_received">Awaiting Review</option><option value="active">Active</option><option value="rejected">Rejected</option><option value="all">All</option></select>
                                <button onClick={() => fetchAds(adFilter)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><RefreshCw size={13} className={adsLoading?"animate-spin":""}/> Refresh</button>
                            </div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                            <p className="font-semibold mb-2">📋 Ad Review Workflow</p>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                                {[{step:"1",text:"Counsellor configures ad + pays"},{step:"2",text:"Appears here for admin review"},{step:"3",text:"Admin approves → Live on forum"},{step:"4",text:"Admin rejects → Full refund"}].map(({step,text}) => (
                                    <div key={step} className="flex items-start gap-2 bg-white rounded-lg p-2"><span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{step}</span><span>{text}</span></div>
                                ))}
                            </div>
                        </div>
                        {adsLoading ? (
                            <div className="flex flex-col items-center py-16 gap-3"><RefreshCw size={28} className="animate-spin text-indigo-400"/><p className="text-gray-400 text-sm">Loading…</p></div>
                        ) : ads.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center"><Megaphone size={40} className="mx-auto mb-3 text-emerald-200"/><h3 className="text-lg font-semibold text-gray-700 mb-1">No {adFilter === "payment_received" ? "pending" : adFilter} ads</h3></div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {ads.map(ad => {
                                    const isPendingReview = ad.status === "payment_received";
                                    const planColor = { basic:"#6366f1", standard:"#0ea5e9", premium:"#8b5cf6" }[ad.plan] || "#6366f1";
                                    return (
                                        <div key={ad._id} className={`bg-white rounded-xl border-2 overflow-hidden ${isPendingReview?"border-yellow-300":"border-gray-200"}`}>
                                            <div className="h-1.5" style={{ background:planColor }}/>
                                            <div className="p-5">
                                                <div className="flex items-start gap-3 mb-4">
                                                    {ad.counsellorId?.avatar?<img src={ad.counsellorId.avatar} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0"/>:<div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-base" style={{background:planColor}}>{(ad.counsellorId?.fullName||"C")[0]}</div>}
                                                    <div className="min-w-0 flex-1"><p className="font-bold text-gray-900">{ad.counsellorId?.fullName}</p><p className="text-xs text-gray-500">{ad.counsellorId?.email}</p></div>
                                                    <span className="text-[10px] font-bold px-2 py-1 rounded-full capitalize" style={{background:planColor+"20",color:planColor}}>{ad.plan}</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2 text-sm">
                                                    <div className="flex justify-between"><span className="text-gray-500">Tagline</span><span className="text-gray-800 text-xs text-right max-w-xs">{ad.tagline}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-gray-800">{ad.durationMonths} month{ad.durationMonths>1?"s":""}</span></div>
                                                    <div className="flex justify-between border-t pt-2"><span className="text-gray-500 font-medium">Amount Paid</span><span className="font-bold text-green-700">₹{ad.amountPaid}</span></div>
                                                </div>
                                                {isPendingReview && (
                                                    <div className="space-y-2">
                                                        <input type="text" placeholder="Rejection reason (required to reject)…" value={adRejectNote[ad._id]||""} onChange={e => setAdRejectNote(p=>({...p,[ad._id]:e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-300"/>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleAdAction(ad._id,"reject")} disabled={adActLoading[ad._id]||!adRejectNote[ad._id]?.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">{adActLoading[ad._id]==="reject"?<RefreshCw size={11} className="animate-spin"/>:<XCircle size={11}/>} Reject & Refund ₹{ad.amountPaid}</button>
                                                            <button onClick={() => handleAdAction(ad._id,"approve")} disabled={adActLoading[ad._id]} className="flex-1 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1.5">{adActLoading[ad._id]==="approve"?<RefreshCw size={11} className="animate-spin"/>:<CheckCircle size={11}/>} Approve</button>
                                                        </div>
                                                    </div>
                                                )}
                                                {!isPendingReview && <div className="flex items-center justify-center"><span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${ad.status==="active"?"bg-green-100 text-green-700":ad.status==="rejected"?"bg-red-100 text-red-700":"bg-gray-100 text-gray-600"}`}>{ad.status==="active"?"✅ Live":ad.status==="rejected"?"❌ Rejected":ad.status}</span></div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── DISPUTES ── */}
                {activeTab === "disputes" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <ShieldAlert size={20} className="text-orange-600"/> Session Disputes
                                </h2>
                                <p className="text-sm mt-0.5">
                                    {openDisputes > 0
                                        ? <span className="text-orange-600 font-semibold">{openDisputes} open — requires your decision</span>
                                        : <span className="text-gray-500">No open disputes</span>
                                    }
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex rounded-xl border border-gray-300 overflow-hidden text-xs font-semibold">
                                    {[["open","🔴 Open"],["resolved","✅ Resolved"],["all","All"]].map(([val,label]) => (
                                        <button key={val} onClick={() => setDisputeFilter(val)}
                                            className={`px-4 py-2 transition-colors ${disputeFilter===val?"bg-orange-600 text-white":"bg-white text-gray-600 hover:bg-gray-50"}`}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => fetchDisputes(disputeFilter)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                    <RefreshCw size={13} className={disputesLoading?"animate-spin":""}/> Refresh
                                </button>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800">
                            <p className="font-semibold mb-2">⚖️ How Disputes Work</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                {[
                                    { step:"1", text:"Student marks a session as disputed and provides a reason" },
                                    { step:"2", text:"Admin reviews the reason and decides: refund student OR release payment to counsellor" },
                                    { step:"3", text:"Both parties receive an email with the decision. Payment is processed automatically." },
                                ].map(({step,text}) => (
                                    <div key={step} className="flex items-start gap-2 bg-white rounded-lg p-2.5">
                                        <span className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{step}</span>
                                        <span>{text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {disputesLoading ? (
                            <div className="flex flex-col items-center py-20 gap-3"><RefreshCw size={32} className="animate-spin text-orange-400"/><p className="text-gray-400">Loading disputes…</p></div>
                        ) : disputes.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                                <Scale size={48} className="mx-auto mb-3 text-gray-200"/>
                                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                                    {disputeFilter === "open" ? "No open disputes" : `No ${disputeFilter} disputes`}
                                </h3>
                                <p className="text-gray-400 text-sm">
                                    {disputeFilter === "open" ? "All disputes resolved — great work!" : "Disputes appear here when students raise them."}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {disputes.map(dispute => (
                                    <DisputeCard
                                        key={dispute._id}
                                        dispute={dispute}
                                        onResolve={handleResolveDispute}
                                        resolving={resolvingDispute}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── SESSIONS ── */}
                {activeTab === "sessions" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Session Analytics</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StatCard title="Total Bookings" value={bookingStats?fmtNum(bookingStats.totalBookings):"–"} icon={Calendar}    color="blue"  />
                            <StatCard title="Completed"      value={bookingStats?fmtNum(bookingStats.statusStats?.find(s=>s._id==="completed")?.count||0):"–"} icon={CheckCircle} color="green" />
                            <StatCard title="Cancelled"      value={bookingStats?fmtNum(bookingStats.statusStats?.find(s=>s._id==="cancelled")?.count||0):"–"} icon={XCircle}     color="red"   />
                        </div>
                        {bookingStatusData.length > 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Bookings by Status</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <BarChart data={bookingStatusData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="name" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip/><Bar dataKey="value" radius={[4,4,0,0]}>{bookingStatusData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">No session data yet</div>}
                    </div>
                )}

                {/* ── ANALYTICS ── */}
                {activeTab === "analytics" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-900">Platform Analytics</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard title="Total Revenue"  value={payStats?fmtRupees(payStats.summary?.totalRevenue) :"–"} icon={IndianRupee} color="green" />
                            <StatCard title="Total Refunded" value={payStats?fmtRupees(payStats.summary?.totalRefunded):"–"} icon={XCircle}     color="red"   />
                            <StatCard title="Net Revenue"    value={payStats?fmtRupees(payStats.summary?.netRevenue)   :"–"} icon={Banknote}    color="blue"  />
                            <StatCard title="Success Rate"   value={payStats?`${Math.round((payStats.summary.successCount/Math.max(payStats.summary.totalPayments,1))*100)}%`:"–"} icon={TrendingUp} color="emerald"/>
                        </div>
                        {monthlyRevenue.length > 0 ? (
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h3 className="text-base font-bold text-gray-900 mb-4">Revenue Over Time</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <LineChart data={monthlyRevenue}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="month" tick={{fontSize:12}}/><YAxis tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+"K":v}`} tick={{fontSize:11}}/><Tooltip formatter={(v)=>[`₹${v}`,"Revenue"]}/><Legend/><Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} dot={{r:4}} name="Revenue (₹)"/><Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={{r:3}} name="Paid Sessions"/></LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400"><IndianRupee size={40} className="mx-auto mb-3 text-gray-200"/><p>Revenue data will appear here once payments are processed.</p></div>}
                    </div>
                )}
            </div>

            {selectedUser && (
                <UserModal user={selectedUser} loading={!!userActLoading[selectedUser._id]}
                    onApprove={(id) => handleUserAction(id,"approve")}
                    onReject={(id)  => handleUserAction(id,"reject")}
                    onClose={() => setSelectedUser(null)}/>
            )}

            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium max-w-sm ${
                    toast.type==="error"?"bg-red-600":toast.type==="warning"?"bg-yellow-500":"bg-green-600"
                }`}>
                    {toast.type==="error"?<AlertCircle size={16}/>:<CheckCircle size={16}/>}
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
