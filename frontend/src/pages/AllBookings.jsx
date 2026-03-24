import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BookingCard from "../components/BookingCard";
import BookingFilters from "../components/BookingFilters";
import {
    Calendar, Search, Filter, ArrowLeft,
    Loader2, AlertCircle, RefreshCw,
} from "lucide-react";

const API_BASE = "http://localhost:5000/api/v1";

// Status display config for the stat pills
const STAT_CONFIG = [
    { key: "all",             label: "Total",           cls: "border-gray-200 bg-white" },
    { key: "payment_pending", label: "Awaiting Payment", cls: "border-purple-200 bg-purple-50 text-purple-800" },
    { key: "pending",         label: "Pending",          cls: "border-yellow-200 bg-yellow-50 text-yellow-800" },
    { key: "confirmed",       label: "Confirmed",        cls: "border-green-200  bg-green-50  text-green-800"  },
    { key: "completed",       label: "Completed",        cls: "border-blue-200   bg-blue-50   text-blue-800"   },
    { key: "cancelled",       label: "Cancelled",        cls: "border-red-200    bg-red-50    text-red-800"    },
];

export default function AllBookings() {
    const { user, token, loading, authChecked, isStudent } = useAuth();
    const navigate = useNavigate();

    const [bookings,        setBookings]        = useState([]);
    const [filteredBookings,setFilteredBookings] = useState([]);
    const [bookingsLoading, setBookingsLoading]  = useState(false);
    const [error,           setError]            = useState("");
    const [searchTerm,      setSearchTerm]       = useState("");
    const [showFilters,     setShowFilters]      = useState(false);
    const [pagination,      setPagination]       = useState({ page: 1, limit: 10, totalPages: 1 });
    const [filters, setFilters] = useState({ status: "all", mode: "all", dateRange: "all" });

    // ── Auth guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!authChecked || loading) return;
        if (!user || !token) { navigate('/login'); return; }
        if (user.role !== 'student') { navigate('/login'); return; }
        loadBookings();
    }, [authChecked, loading, user, token, navigate, pagination.page]);

    // ── Apply client-side filters ─────────────────────────────────────────────
    useEffect(() => { applyFilters(); }, [bookings, searchTerm, filters]);

    // ── Load bookings ─────────────────────────────────────────────────────────
    const loadBookings = useCallback(async () => {
        setBookingsLoading(true);
        try {
            const params = new URLSearchParams({
                page:      pagination.page,
                limit:     pagination.limit,
                sortBy:    "createdAt",
                sortOrder: "desc",
            });
            const res  = await fetch(`${API_BASE}/bookings?${params}`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            });
            if (!res.ok) throw new Error("Failed to fetch bookings");
            const data = await res.json();
            if (data.success) {
                setBookings(data.data.bookings || []);
                setPagination(prev => ({ ...prev, totalPages: data.data.pagination?.totalPages || 1 }));
                setError("");
            } else {
                setError(data.message || "Failed to load bookings");
            }
        } catch (err) {
            setError("Failed to load bookings. Please try again.");
        } finally {
            setBookingsLoading(false);
        }
    }, [token, pagination.page, pagination.limit]);

    const applyFilters = () => {
        let f = [...bookings];

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            f = f.filter(b =>
                b.counselor?.fullName?.toLowerCase().includes(q) ||
                b.reason?.toLowerCase().includes(q) ||
                b.status?.toLowerCase().includes(q)
            );
        }

        if (filters.status !== "all") f = f.filter(b => b.status === filters.status);
        if (filters.mode   !== "all") f = f.filter(b => b.mode   === filters.mode);

        if (filters.dateRange !== "all") {
            const now = new Date();
            f = f.filter(b => {
                const d = new Date(b.date);
                switch (filters.dateRange) {
                    case "upcoming":   return d >= now;
                    case "past":       return d < now;
                    case "thisWeek": {
                        const start = new Date(now); start.setDate(now.getDate() - now.getDay());
                        const end   = new Date(start); end.setDate(start.getDate() + 6);
                        return d >= start && d <= end;
                    }
                    case "thisMonth":
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    default: return true;
                }
            });
        }

        setFilteredBookings(f);
    };

    // ── Status counts (includes payment_pending) ──────────────────────────────
    const statusCounts = bookings.reduce((acc, b) => {
        acc.all++;
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
    }, { all: 0, payment_pending: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });

    // ── Status update callback passed to BookingCard ──────────────────────────
    const handleStatusUpdate = (bookingId, newStatus) => {
        setBookings(prev => prev.map(b =>
            b._id === bookingId ? { ...b, status: newStatus } : b
        ));
    };

    // ── Loading / access guard ────────────────────────────────────────────────
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
                    <p className="text-gray-600">Only students can view booking history.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => navigate("/booking")}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">
                            <ArrowLeft className="h-4 w-4" /> Back to Booking
                        </button>
                        <button onClick={() => navigate("/booking")}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                            <Calendar className="h-4 w-4" /> Book New Session
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-500 mt-1">View, manage and track all your counselling sessions</p>

                    {/* Stat pills */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        {STAT_CONFIG.map(({ key, label, cls }) => {
                            const count = statusCounts[key] || 0;
                            if (key !== 'all' && count === 0) return null;
                            return (
                                <button key={key}
                                    onClick={() => setFilters(f => ({ ...f, status: key === 'all' ? 'all' : key }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all ${cls} ${
                                        filters.status === key || (key === 'all' && filters.status === 'all')
                                            ? 'ring-2 ring-indigo-400 ring-offset-1'
                                            : 'hover:opacity-80'
                                    }`}>
                                    <span className="font-bold text-base">{count}</span>
                                    <span>{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search + filter bar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input type="text" placeholder="Search by counsellor, reason, or status…"
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>
                        <button onClick={() => setShowFilters(s => !s)}
                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
                                showFilters ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}>
                            <Filter className="h-4 w-4" /> Filters
                        </button>
                        <button onClick={loadBookings} title="Refresh"
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            <RefreshCw className={`h-4 w-4 ${bookingsLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {showFilters && <BookingFilters filters={filters} onFiltersChange={setFilters} />}
                </div>

                {/* Loading */}
                {bookingsLoading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        <span className="ml-3 text-gray-600">Loading bookings…</span>
                    </div>
                )}

                {/* Error */}
                {!bookingsLoading && error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <span className="text-red-800 text-sm">{error}</span>
                        <button onClick={loadBookings} className="ml-auto text-red-600 underline text-sm">Retry</button>
                    </div>
                )}

                {/* Bookings list */}
                {!bookingsLoading && !error && (
                    <>
                        {filteredBookings.length === 0 ? (
                            <div className="text-center py-16">
                                <Calendar className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">No bookings found</h3>
                                <p className="text-gray-500 mb-6 text-sm">
                                    {searchTerm || filters.status !== "all" || filters.mode !== "all" || filters.dateRange !== "all"
                                        ? "No bookings match your current filters."
                                        : "You haven't made any booking requests yet."}
                                </p>
                                <button onClick={() => navigate("/booking")}
                                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
                                    Book Your First Session
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredBookings.map(b => (
                                    <BookingCard
                                        key={b._id}
                                        booking={b}
                                        onStatusUpdate={handleStatusUpdate}
                                        onRefresh={loadBookings}
                                        userRole={user.role}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="mt-8 flex justify-center gap-2">
                                {Array.from({ length: pagination.totalPages }, (_, i) => (
                                    <button key={i + 1}
                                        onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                                        className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                                            pagination.page === i + 1
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}>
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
}
