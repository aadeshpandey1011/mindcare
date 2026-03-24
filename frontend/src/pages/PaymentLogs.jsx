import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Search, RefreshCw, CheckCircle, XCircle, Clock,
    RotateCcw, IndianRupee, Calendar, CreditCard,
    ArrowLeft, Banknote, TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const fmtDate   = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtShort  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtRupees = (n) => `₹${Number(n || 0).toLocaleString()}`;

const STATUS_META = {
    pending:  { cls: 'bg-yellow-100 text-yellow-800', icon: <Clock       size={13}/>, label: 'Pending'  },
    success:  { cls: 'bg-green-100  text-green-800',  icon: <CheckCircle size={13}/>, label: 'Paid'     },
    failed:   { cls: 'bg-red-100    text-red-800',    icon: <XCircle     size={13}/>, label: 'Failed'   },
    refunded: { cls: 'bg-blue-100   text-blue-800',   icon: <RotateCcw   size={13}/>, label: 'Refunded' },
};

// ─────────────────────────────────────────────────────────────────────────────
//  PAYMENT DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PaymentModal({ payment, isCounsellor, onClose }) {
    const m = STATUS_META[payment.status] || STATUS_META.pending;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={20}/></button>
                </div>

                <div className={`rounded-xl p-4 mb-5 text-center ${m.cls}`}>
                    <p className="text-3xl font-bold mb-1">{fmtRupees(payment.amount)}</p>
                    <div className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                        {m.icon} {m.label}
                    </div>
                </div>

                {/* Counsellor payout status */}
                {isCounsellor && payment.bookingId && (
                    <div className={`rounded-xl p-3 mb-4 text-sm flex items-center gap-2 ${
                        payment.bookingId?.payoutStatus === 'released'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-amber-50 border border-amber-200 text-amber-800'
                    }`}>
                        <Banknote size={15} className="flex-shrink-0" />
                        {payment.bookingId?.payoutStatus === 'released'
                            ? `✅ Payout of ${fmtRupees(payment.amount)} released to your bank account.`
                            : '⏳ Payout pending — releases after session completion & student confirmation.'}
                    </div>
                )}

                <div className="space-y-2 text-sm">
                    {[
                        { label: 'Order ID',        value: payment.order_id,                    mono: true },
                        { label: 'Cashfree Ref',    value: payment.cf_payment_id || '—',        mono: true },
                        { label: 'Method',          value: payment.paymentMethod || '—',        cap: true  },
                        { label: 'Date',            value: fmtDate(payment.createdAt)                      },
                        ...(payment.userId      ? [{ label: 'Student',      value: payment.userId?.fullName || '—' }]      : []),
                        ...(payment.counsellorId? [{ label: 'Counsellor',   value: payment.counsellorId?.fullName || '—' }]: []),
                        ...(payment.bookingId   ? [
                            { label: 'Session Date',   value: fmtShort(payment.bookingId?.date)                      },
                            { label: 'Session Mode',   value: payment.bookingId?.mode   || '—', cap: true             },
                            { label: 'Booking Status', value: payment.bookingId?.status || '—', cap: true             },
                        ] : []),
                        ...(payment.refundId    ? [
                            { label: 'Refund ID',      value: payment.refundId,                 mono: true             },
                            { label: 'Refunded On',    value: fmtDate(payment.refundedAt)                              },
                            { label: 'Refund Reason',  value: payment.refundReason || '—'                              },
                        ] : []),
                        ...(payment.failureReason ? [{ label: 'Failure',    value: payment.failureReason }]             : []),
                    ].map(({ label, value, mono, cap }) => (
                        <div key={label} className="flex justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
                            <span className="text-gray-500 flex-shrink-0">{label}</span>
                            <span className={`font-medium text-gray-900 text-right ${mono ? 'font-mono text-xs' : ''} ${cap ? 'capitalize' : ''}`}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COUNSELLOR EARNINGS SECTION
//  Shows completed bookings and their payout status — answers the question
//  "am I getting paid when I complete a session?"
// ─────────────────────────────────────────────────────────────────────────────
function CounsellorEarnings({ token }) {
    const [bookings, setBookings] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [stats,    setStats]    = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res  = await fetch(`${API_BASE}/bookings?limit=50&status=completed`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    const bks = data.data.bookings || [];
                    setBookings(bks);

                    const totalEarned     = bks.filter(b => b.payoutStatus === 'released').reduce((s, b) => s + (b.feePaid || 0), 0);
                    const pendingPayout   = bks.filter(b => b.payoutStatus === 'pending').reduce((s, b) => s + (b.feePaid || 0), 0);
                    const completedCount  = bks.length;
                    setStats({ totalEarned, pendingPayout, completedCount });
                }
            } catch (e) { /* silent */ }
            finally { setLoading(false); }
        })();
    }, [token]);

    if (loading) return <div className="flex justify-center py-8"><RefreshCw size={20} className="animate-spin text-green-400" /></div>;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Banknote size={18} className="text-green-600" /> Counsellor Earnings
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    You earn money when a student pays for a session. After you mark the session done and the student confirms (or 48h auto-confirm passes), MindCare transfers the fee to your registered bank account within 3–5 business days.
                </p>
            </div>

            {stats && (
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                    <div className="px-6 py-4 text-center">
                        <p className="text-2xl font-bold text-green-700">{fmtRupees(stats.totalEarned)}</p>
                        <p className="text-xs text-gray-500">Paid Out</p>
                    </div>
                    <div className="px-6 py-4 text-center">
                        <p className="text-2xl font-bold text-amber-600">{fmtRupees(stats.pendingPayout)}</p>
                        <p className="text-xs text-gray-500">Pending Payout</p>
                    </div>
                    <div className="px-6 py-4 text-center">
                        <p className="text-2xl font-bold text-indigo-700">{stats.completedCount}</p>
                        <p className="text-xs text-gray-500">Completed Sessions</p>
                    </div>
                </div>
            )}

            {bookings.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <Banknote size={32} className="mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No completed sessions yet. Complete a session to see earnings here.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {['Student', 'Session Date', 'Fee', 'Payout Status', 'Released On'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.map(b => (
                                <tr key={b._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-medium text-gray-900">{b.student?.fullName || '—'}</p>
                                        <p className="text-xs text-gray-400">{b.mode}</p>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{fmtShort(b.date)} · {b.timeSlot}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm font-bold text-gray-900">
                                            {b.feePaid === 0 ? 'Free' : fmtRupees(b.feePaid)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {b.feePaid === 0 ? (
                                            <span className="text-xs text-gray-400">N/A (free)</span>
                                        ) : b.payoutStatus === 'released' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                <CheckCircle size={11}/> Paid out
                                            </span>
                                        ) : b.payoutStatus === 'pending' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                                <Clock size={11}/> Pending
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400 capitalize">{b.payoutStatus}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{b.payoutReleasedAt ? fmtShort(b.payoutReleasedAt) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="bg-amber-50 border-t border-amber-100 px-6 py-3 text-xs text-amber-800 flex items-start gap-2">
                <IndianRupee size={13} className="flex-shrink-0 mt-0.5" />
                <span>
                    <strong>How payouts work:</strong> After a session is completed (student confirms or 48h auto-confirm), MindCare marks your payout as released and initiates a bank transfer to your registered account. This typically takes 3–5 business days. Make sure your bank details are saved in <a href="/counsellor-settings" className="underline font-medium">Settings</a>.
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE — used at:
//    /my-payments      → student/counsellor own history
//    /admin/payments   → admin sees all
// ─────────────────────────────────────────────────────────────────────────────
export default function PaymentLogsPage() {
    const { user, token } = useAuth();
    const navigate        = useNavigate();
    const isAdmin         = user?.role === 'admin';
    const isCounsellor    = user?.role === 'counsellor';

    // Which tab is active — counsellors get an extra "Earnings" tab
    const [tab, setTab] = useState(isCounsellor ? 'payments' : 'payments');

    const [payments,   setPayments]   = useState([]);
    const [summary,    setSummary]    = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [pagination, setPagination] = useState({});
    const [selected,   setSelected]   = useState(null);

    const [statusFilter, setStatusFilter] = useState('all');
    const [searchInput,  setSearchInput]  = useState('');
    const [search,       setSearch]       = useState('');
    const [dateFrom,     setDateFrom]     = useState('');
    const [dateTo,       setDateTo]       = useState('');
    const [page,         setPage]         = useState(1);

    const fetchPayments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (statusFilter !== 'all') params.set('status',   statusFilter);
            if (search)                 params.set('search',   search);
            if (dateFrom)               params.set('dateFrom', dateFrom);
            if (dateTo)                 params.set('dateTo',   dateTo);

            const endpoint = isAdmin
                ? `${API_BASE}/admin/payments?${params}`
                : `${API_BASE}/payments/history?${params}`;

            const res  = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setPayments(data.data.payments || []);
            setPagination(data.data.pagination || {});
            if (data.data.summary) setSummary(data.data.summary);
        } catch (e) { console.error(e.message); }
        finally { setLoading(false); }
    }, [token, isAdmin, page, statusFilter, search, dateFrom, dateTo]);

    useEffect(() => { if (tab === 'payments') fetchPayments(); }, [fetchPayments, tab]);

    useEffect(() => {
        const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const totalCollected = summary?.totalCollected || 0;
    const totalRefunded  = summary?.totalRefunded  || 0;
    const netRevenue     = totalCollected - totalRefunded;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => navigate(isAdmin ? '/dashboard' : '/newhome')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
                            <ArrowLeft size={16}/> Back
                        </button>
                    </div>
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isAdmin ? 'All Payment Logs' : isCounsellor ? 'Payments & Earnings' : 'My Payment History'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {isAdmin      ? 'Complete transaction log for the platform'  :
                                 isCounsellor ? 'Student payments received · Your payout status' :
                                                'Your booking payments and refunds'}
                            </p>
                        </div>
                        <button onClick={fetchPayments}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>

                    {/* Summary cards */}
                    {summary && tab === 'payments' && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Total Collected', value: fmtRupees(totalCollected), cls: 'bg-green-50 border-green-200 text-green-700',  icon: IndianRupee },
                                { label: 'Refunded',        value: fmtRupees(totalRefunded),  cls: 'bg-red-50   border-red-200   text-red-700',    icon: RotateCcw   },
                                { label: 'Net Revenue',     value: fmtRupees(netRevenue),     cls: 'bg-indigo-50 border-indigo-200 text-indigo-700',icon: CreditCard  },
                                { label: 'Transactions',    value: `${summary.successCount || 0} paid · ${summary.refundCount || 0} refunded`, cls: 'bg-gray-50 border-gray-200 text-gray-700', icon: Calendar },
                            ].map(({ label, value, cls, icon: Icon }) => (
                                <div key={label} className={`rounded-xl border p-4 flex items-start gap-3 ${cls}`}>
                                    <Icon size={16} className="mt-0.5 flex-shrink-0 opacity-70" />
                                    <div>
                                        <p className="text-xs opacity-60 font-medium mb-0.5">{label}</p>
                                        <p className="text-sm font-bold">{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs — counsellors get Payments + Earnings */}
            {isCounsellor && (
                <div className="bg-white border-b border-gray-200 px-6">
                    <div className="max-w-7xl mx-auto flex gap-1">
                        {[
                            { id: 'payments', label: 'Payment History',    icon: CreditCard },
                            { id: 'earnings', label: 'My Earnings & Payouts', icon: Banknote  },
                        ].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex items-center gap-2 px-4 py-4 border-b-2 text-sm font-medium transition-colors ${
                                    tab === id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}>
                                <Icon size={15}/> {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-6">

                {/* ── Earnings tab (counsellor only) ── */}
                {tab === 'earnings' && isCounsellor && (
                    <CounsellorEarnings token={token} />
                )}

                {/* ── Payments tab ── */}
                {tab === 'payments' && (
                    <>
                        {/* Filters */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-3 flex-wrap">
                            {isAdmin && (
                                <div className="flex-1 min-w-[180px] relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Search by user name or email…"
                                        value={searchInput} onChange={e => setSearchInput(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                                </div>
                            )}
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                <option value="all">All Statuses</option>
                                <option value="success">Success / Paid</option>
                                <option value="refunded">Refunded</option>
                                <option value="failed">Failed</option>
                                <option value="pending">Pending</option>
                            </select>
                            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }}
                                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            {(statusFilter !== 'all' || dateFrom || dateTo || searchInput) && (
                                <button onClick={() => { setStatusFilter('all'); setDateFrom(''); setDateTo(''); setSearchInput(''); }}
                                    className="px-3 py-2 text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                                    <XCircle size={14}/> Clear
                                </button>
                            )}
                        </div>

                        <p className="text-sm text-gray-500 mb-4">{pagination.total || 0} transactions</p>

                        {loading ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 flex flex-col items-center gap-3">
                                <RefreshCw size={28} className="animate-spin text-indigo-400" />
                                <p className="text-gray-400 text-sm">Loading transactions…</p>
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                                <IndianRupee size={40} className="mx-auto mb-3 text-gray-200" />
                                <h3 className="text-lg font-semibold text-gray-700">No transactions found</h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    {statusFilter !== 'all' || dateFrom || search ? 'Try adjusting your filters' : 'Transactions will appear here once bookings are paid'}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                {[
                                                    'Amount',
                                                    'Status',
                                                    ...(isAdmin ? ['Student', 'Counsellor'] : isCounsellor ? ['Student', 'Payout'] : ['Counsellor']),
                                                    'Method',
                                                    'Session Date',
                                                    'Date',
                                                    '',
                                                ].map((h, i) => (
                                                    <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {payments.map(p => {
                                                const meta    = STATUS_META[p.status] || STATUS_META.pending;
                                                const booking = p.bookingId;
                                                return (
                                                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <p className={`text-sm font-bold ${p.status === 'refunded' ? 'text-blue-700' : p.status === 'failed' ? 'text-red-600' : 'text-gray-900'}`}>
                                                                {fmtRupees(p.amount)}
                                                            </p>
                                                            {p.refundAmount && <p className="text-xs text-blue-600">Refund: {fmtRupees(p.refundAmount)}</p>}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>
                                                                {meta.icon} {meta.label}
                                                            </span>
                                                        </td>

                                                        {/* Admin: student + counsellor */}
                                                        {isAdmin && (<>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm font-medium text-gray-900">{p.userId?.fullName || '—'}</p>
                                                                <p className="text-xs text-gray-400">{p.userId?.email}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm text-gray-900">{p.counsellorId?.fullName || '—'}</p>
                                                                {p.counsellorId?.specialization && <p className="text-xs text-gray-400">{p.counsellorId.specialization}</p>}
                                                            </td>
                                                        </>)}

                                                        {/* Counsellor: who paid + payout */}
                                                        {isCounsellor && (<>
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm text-gray-900">{p.userId?.fullName || '—'}</p>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {p.amount === 0 ? (
                                                                    <span className="text-xs text-gray-400">Free session</span>
                                                                ) : booking?.payoutStatus === 'released' ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                                                        <CheckCircle size={10}/> Paid to you
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                                                        <Clock size={10}/> Pending
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </>)}

                                                        {/* Student: counsellor name */}
                                                        {!isAdmin && !isCounsellor && (
                                                            <td className="px-4 py-3">
                                                                <p className="text-sm text-gray-900">{p.counsellorId?.fullName || '—'}</p>
                                                                {p.counsellorId?.specialization && <p className="text-xs text-gray-400">{p.counsellorId.specialization}</p>}
                                                            </td>
                                                        )}

                                                        <td className="px-4 py-3 text-xs text-gray-500 capitalize">{p.paymentMethod || '—'}</td>
                                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                            {booking?.date ? new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtShort(p.createdAt)}</td>
                                                        <td className="px-4 py-3">
                                                            <button onClick={() => setSelected(p)}
                                                                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100" title="View details">
                                                                <Search size={13}/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {pagination.totalPages > 1 && (
                                    <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
                                        <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} transactions</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setPage(p => Math.max(p-1,1))} disabled={!pagination.hasPrev}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">← Prev</button>
                                            <button onClick={() => setPage(p => Math.min(p+1, pagination.totalPages))} disabled={!pagination.hasNext}
                                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">Next →</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {selected && <PaymentModal payment={selected} isCounsellor={isCounsellor} onClose={() => setSelected(null)} />}
        </div>
    );
}
