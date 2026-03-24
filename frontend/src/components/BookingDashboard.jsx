import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle, XCircle, Clock, Calendar, Video, Phone,
    MapPin, ChevronDown, ChevronUp, ExternalLink, AlertCircle,
    RefreshCw, CheckSquare, X, IndianRupee, Banknote, Star, Settings,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
});
const fmtRupees = (a) => (a === 0 || !a) ? 'Free' : `₹${Number(a).toFixed(0)}`;

const STATUS_META = {
    payment_pending: { label: 'Payment Pending',        cls: 'bg-purple-100 text-purple-800 border-purple-200' },
    pending:         { label: 'Awaiting Your Approval', cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    confirmed:       { label: 'Confirmed',              cls: 'bg-green-100  text-green-800  border-green-200'  },
    session_done:    { label: 'Awaiting Student Review', cls: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    cancelled:       { label: 'Cancelled',              cls: 'bg-red-100    text-red-800    border-red-200'    },
    completed:       { label: 'Completed & Paid',       cls: 'bg-blue-100   text-blue-800   border-blue-200'   },
};

const ModeIcon = ({ mode, size = 14 }) => {
    if (mode === 'online')    return <Video  size={size} />;
    if (mode === 'phone')     return <Phone  size={size} />;
    if (mode === 'in-person') return <MapPin size={size} />;
    return <Calendar size={size} />;
};

// ── APPROVE MODAL ─────────────────────────────────────────────────────────────
function ApproveModal({ booking, onConfirm, onClose, loading }) {
    const [meetingLink, setMeetingLink] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle size={20} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Session</h3>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Student</span><span className="font-medium">{booking.student?.fullName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{fmtDate(booking.date)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{booking.timeSlot}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Mode</span><span className="font-medium capitalize">{booking.mode}</span></div>
                    <div className="flex justify-between border-t pt-2 mt-1">
                        <span className="text-gray-500">Fee collected</span>
                        <span className="font-semibold text-green-600">{fmtRupees(booking.feePaid)}</span>
                    </div>
                </div>
                {booking.feePaid > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-xs text-green-800 flex items-start gap-2">
                        <Banknote size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{fmtRupees(booking.feePaid)} will be transferred to your bank account after the student confirms the session is completed.</span>
                    </div>
                )}
                {booking.mode === 'online' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Meeting Link <span className="text-gray-400">(recommended)</span>
                        </label>
                        <input type="url" placeholder="https://meet.google.com/xxx"
                            value={meetingLink} onChange={e => setMeetingLink(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                    </div>
                )}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={() => onConfirm(booking._id, meetingLink)} disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-green-600 rounded-xl text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Confirm Session
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── REJECT MODAL ──────────────────────────────────────────────────────────────
function RejectModal({ booking, onConfirm, onClose, loading }) {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle size={20} className="text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Reject Request</h3>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
                    The student will receive a <strong>full refund of {fmtRupees(booking.feePaid)}</strong> automatically.
                </div>
                <textarea rows={3} autoFocus placeholder="Reason for rejection…"
                    value={reason} onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 mb-4" />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
                    <button onClick={() => reason.trim() && onConfirm(booking._id, reason.trim())}
                        disabled={loading || !reason.trim()}
                        className="flex-1 px-4 py-2.5 bg-red-600 rounded-xl text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Reject & Refund
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── MARK DONE MODAL ───────────────────────────────────────────────────────────
function DoneModal({ booking, onConfirm, onClose, loading }) {
    const [notes, setNotes] = useState('');
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <CheckSquare size={20} className="text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Mark Session Done</h3>
                        <p className="text-xs text-gray-500">Student will be asked to confirm and review</p>
                    </div>
                </div>
                {booking.feePaid > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-xs text-green-800 flex items-start gap-2">
                        <Banknote size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                        <span>Once the student confirms, <strong>{fmtRupees(booking.feePaid)}</strong> will be released to your bank account. If they don't respond in 48 hours, payment is auto-released.</span>
                    </div>
                )}
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session notes <span className="text-gray-400 font-normal">(private — not shown to student)</span>
                </label>
                <textarea rows={4} placeholder="Key observations, follow-up actions…"
                    value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-4" />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={() => onConfirm(booking._id, notes)} disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <CheckSquare size={14} />}
                        Mark Done & Notify Student
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── BOOKING CARD (counsellor view) ────────────────────────────────────────────
function BookingCard({ booking, onApprove, onReject, onDone, actionLoading }) {
    const [expanded, setExpanded] = useState(false);
    const s            = STATUS_META[booking.status] || STATUS_META.pending;
    const isActionable = booking.status === 'pending';
    const isConfirmed  = booking.status === 'confirmed';
    const isDone       = booking.status === 'session_done';
    const isCompleted  = booking.status === 'completed';

    return (
        <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-shadow hover:shadow-md ${
            isActionable ? 'border-yellow-200' : isDone ? 'border-indigo-200' : 'border-gray-200'
        }`}>
            <div className={`h-1 ${
                isActionable ? 'bg-yellow-400' :
                isConfirmed  ? 'bg-green-400'  :
                isDone       ? 'bg-indigo-400' :
                isCompleted  ? 'bg-blue-400'   : 'bg-gray-200'
            }`} />

            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        {booking.student?.avatar ? (
                            <img src={booking.student.avatar} alt={booking.student.fullName}
                                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow" />
                        ) : (
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-base">
                                {(booking.student?.fullName || 'S')[0].toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{booking.student?.fullName || 'Unknown Student'}</p>
                            <p className="text-xs text-gray-500">{booking.student?.email}</p>
                        </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${s.cls}`}>
                        {s.label}
                    </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={13} className="text-indigo-400" />
                        <span>{fmtDate(booking.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Clock size={13} className="text-indigo-400" />
                        <span>{booking.timeSlot}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <ModeIcon mode={booking.mode} />
                        <span className="capitalize">{booking.mode}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <IndianRupee size={13} className="text-green-500" />
                        <span className="font-semibold text-green-600">{fmtRupees(booking.feePaid)}</span>
                    </div>
                </div>

                {/* Reason */}
                <div className="bg-gray-50 rounded-xl px-3 py-2 mb-3 text-sm text-gray-700">
                    <span className="font-medium text-gray-500">Reason: </span>{booking.reason}
                </div>

                {/* session_done — awaiting student */}
                {isDone && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 mb-3 text-xs text-indigo-800">
                        ⏳ Waiting for student to confirm and review. Payment releases automatically in 48 hours if no response.
                    </div>
                )}

                {/* Completed — show review */}
                {isCompleted && booking.reviewId && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-3">
                        <div className="flex items-center gap-1 mb-0.5">
                            {[1,2,3,4,5].map(s => (
                                <Star key={s} size={13} className={s <= (booking.reviewId?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                            ))}
                            <span className="text-xs text-blue-700 ml-1">Student review</span>
                        </div>
                        {booking.reviewId?.comment && (
                            <p className="text-xs text-blue-700">"{booking.reviewId.comment}"</p>
                        )}
                    </div>
                )}

                {/* Payout reminder for confirmed sessions */}
                {isConfirmed && booking.feePaid > 0 && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3">
                        <Banknote size={12} />
                        <span>Mark done to start the student review process. Payout releases after confirmation.</span>
                    </div>
                )}

                {/* Meeting link */}
                {booking.meetingLink && isConfirmed && (
                    <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-3">
                        <ExternalLink size={13} /> Join Session
                    </a>
                )}

                {/* Expanded */}
                {expanded && (
                    <div className="text-sm space-y-2 border-t border-gray-100 pt-3 mt-2">
                        {booking.notes && (
                            <p className="text-gray-600"><span className="font-medium">Student notes: </span>{booking.notes}</p>
                        )}
                        {booking.cancellationReason && (
                            <div className="bg-red-50 rounded-lg px-3 py-2 text-red-700">
                                <span className="font-medium">Cancellation: </span>{booking.cancellationReason}
                            </div>
                        )}
                        {booking.sessionNotes && (
                            <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-700">
                                <span className="font-medium">Your session notes: </span>{booking.sessionNotes}
                            </div>
                        )}
                        {booking.payoutStatus === 'released' && (
                            <p className="text-xs text-green-600">✅ Payout released on {fmtDate(booking.payoutReleasedAt)}</p>
                        )}
                        <p className="text-xs text-gray-400">Booked on {fmtDate(booking.createdAt)}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
                    <button onClick={() => setExpanded(e => !e)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        {expanded ? 'Less' : 'More'}
                    </button>
                    <div className="flex gap-2">
                        {isActionable && (
                            <>
                                <button onClick={() => onReject(booking)} disabled={actionLoading[booking._id]}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 disabled:opacity-50">
                                    <XCircle size={12} /> Reject
                                </button>
                                <button onClick={() => onApprove(booking)} disabled={actionLoading[booking._id]}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50">
                                    {actionLoading[booking._id] === 'approve'
                                        ? <RefreshCw size={12} className="animate-spin" />
                                        : <CheckCircle size={12} />}
                                    Approve
                                </button>
                            </>
                        )}
                        {isConfirmed && (
                            <button onClick={() => onDone(booking)} disabled={actionLoading[booking._id]}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 disabled:opacity-50">
                                <CheckSquare size={12} /> Mark Done
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── FEE EDITOR ────────────────────────────────────────────────────────────────
function FeeEditor({ currentFee, token, onSaved }) {
    const [mode,    setMode]    = useState('view');
    const [fee,     setFee]     = useState(currentFee ?? 299);
    const [isFree,  setIsFree]  = useState(currentFee === 0);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState('');

    const handleSave = async () => {
        const finalFee = isFree ? 0 : Number(fee);
        if (!isFree && (isNaN(finalFee) || finalFee < 50 || finalFee > 5000)) {
            setError('Fee must be ₹50–₹5000'); return;
        }
        setMode('saving'); setError('');
        try {
            const res  = await fetch(`${API_BASE}/users/session-fee`, {
                method:  'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ sessionFee: finalFee }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess('Fee updated!');
            onSaved(finalFee);
            setTimeout(() => setSuccess(''), 3000);
            setMode('view');
        } catch (e) { setError(e.message); setMode('edit'); }
    };

    if (mode === 'view') return (
        <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                <IndianRupee size={14} className="text-green-500" />
                <span className="font-semibold">{currentFee === 0 ? 'Free sessions' : `₹${currentFee} per session`}</span>
            </div>
            {success && <span className="text-xs text-green-600">{success}</span>}
            <button onClick={() => setMode('edit')} className="text-xs text-indigo-600 hover:underline">Change</button>
        </div>
    );

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)}
                    className="accent-indigo-600" />
                <span className="text-gray-700 font-medium">Free</span>
            </label>
            {!isFree && (
                <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-500">₹</span>
                    <input type="number" min={50} max={5000} value={fee}
                        onChange={e => setFee(e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                </div>
            )}
            {error && <span className="text-xs text-red-500">{error}</span>}
            <button onClick={handleSave} disabled={mode === 'saving'}
                className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1">
                {mode === 'saving' && <RefreshCw size={11} className="animate-spin" />}
                Save
            </button>
            <button onClick={() => setMode('view')} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
        </div>
    );
}

// ── EARNINGS SUMMARY ──────────────────────────────────────────────────────────
function EarningsSummary({ bookings }) {
    const completed      = bookings.filter(b => b.status === 'completed'    && b.feePaid > 0);
    const totalEarned    = completed.reduce((s, b) => s + (b.feePaid || 0), 0);
    const awaitingPayout = bookings.filter(b => b.status === 'session_done' && b.feePaid > 0)
                                   .reduce((s, b) => s + (b.feePaid || 0), 0);
    const upcoming       = bookings.filter(b => b.status === 'confirmed'    && b.feePaid > 0)
                                   .reduce((s, b) => s + (b.feePaid || 0), 0);

    if (totalEarned === 0 && awaitingPayout === 0 && upcoming === 0) return null;

    return (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mt-4">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Banknote size={13} /> Earnings
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                    <p className="text-lg font-bold text-green-700">{fmtRupees(totalEarned)}</p>
                    <p className="text-xs text-green-600">Paid Out</p>
                </div>
                <div className="border-x border-green-200">
                    <p className="text-lg font-bold text-indigo-600">{fmtRupees(awaitingPayout)}</p>
                    <p className="text-xs text-indigo-600">Awaiting Review</p>
                </div>
                <div>
                    <p className="text-lg font-bold text-yellow-600">{fmtRupees(upcoming)}</p>
                    <p className="text-xs text-yellow-600">Upcoming</p>
                </div>
            </div>
            <p className="text-xs text-green-600 border-t border-green-200 pt-2 mt-3">
                💳 Payouts credited to your bank within 3–5 business days after student confirmation.
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export default function BookingDashboard() {
    const { user, token } = useAuth();
    const navigate        = useNavigate();

    const [bookings,      setBookings]      = useState([]);
    const [allBookings,   setAllBookings]   = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [refreshing,    setRefreshing]    = useState(false);
    const [filter,        setFilter]        = useState('all');
    const [page,          setPage]          = useState(1);
    const [pagination,    setPagination]    = useState({});
    const [error,         setError]         = useState('');
    const [sessionFee,    setSessionFee]    = useState(user?.sessionFee ?? 299);

    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget,  setRejectTarget]  = useState(null);
    const [doneTarget,    setDoneTarget]    = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [toast,         setToast]         = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadBookings = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (filter !== 'all') params.set('status', filter);
            const res  = await fetch(`${API_BASE}/bookings?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setBookings(data.data.bookings || []);
            setPagination(data.data.pagination || {});
        } catch (e) { setError(e.message || 'Failed to load bookings'); }
        finally { setLoading(false); setRefreshing(false); }
    }, [filter, page, token]);

    const loadAllBookings = useCallback(async () => {
        try {
            const res  = await fetch(`${API_BASE}/bookings?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) setAllBookings(data.data.bookings || []);
        } catch (e) { /* silent */ }
    }, [token]);

    useEffect(() => { loadBookings(); },    [loadBookings]);
    useEffect(() => { loadAllBookings(); }, [loadAllBookings]);

    const pendingCount = bookings.filter(b => b.status === 'pending').length;
    const doneCount    = bookings.filter(b => b.status === 'session_done').length;

    const handleApproveConfirm = async (bookingId, meetingLink) => {
        setActionLoading(p => ({ ...p, [bookingId]: 'approve' }));
        try {
            const res  = await fetch(`${API_BASE}/bookings/${bookingId}/approve`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ meetingLink: meetingLink || '' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setApproveTarget(null);
            showToast('Session confirmed! Student notified.');
            await loadBookings(true);
            await loadAllBookings();
        } catch (e) { showToast(e.message, 'error'); }
        finally { setActionLoading(p => ({ ...p, [bookingId]: null })); }
    };

    const handleRejectConfirm = async (bookingId, reason) => {
        setActionLoading(p => ({ ...p, [bookingId]: 'reject' }));
        try {
            const res  = await fetch(`${API_BASE}/bookings/${bookingId}/reject`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setRejectTarget(null);
            showToast('Request rejected. Full refund initiated.', 'warning');
            await loadBookings(true);
            await loadAllBookings();
        } catch (e) { showToast(e.message, 'error'); }
        finally { setActionLoading(p => ({ ...p, [bookingId]: null })); }
    };

    const handleDoneConfirm = async (bookingId, sessionNotes) => {
        setActionLoading(p => ({ ...p, [bookingId]: 'done' }));
        try {
            const res  = await fetch(`${API_BASE}/bookings/${bookingId}/done`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ sessionNotes }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setDoneTarget(null);
            showToast('Session marked done! Student notified to confirm and review.');
            await loadBookings(true);
            await loadAllBookings();
        } catch (e) { showToast(e.message, 'error'); }
        finally { setActionLoading(p => ({ ...p, [bookingId]: null })); }
    };

    const FILTER_TABS = [
        { key: 'all',          label: 'All' },
        { key: 'pending',      label: 'Pending',         badge: pendingCount },
        { key: 'confirmed',    label: 'Confirmed' },
        { key: 'session_done', label: 'Awaiting Review', badge: doneCount },
        { key: 'completed',    label: 'Completed' },
        { key: 'cancelled',    label: 'Cancelled' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">

            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {user?.fullName} · {user?.specialization || 'Counsellor'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Settings & Ads link */}
                            <button
                                onClick={() => navigate('/counsellor-settings')}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                <Settings size={14} /> Settings & Ads
                            </button>
                            <button
                                onClick={() => { setRefreshing(true); loadBookings(true); loadAllBookings(); }}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Session fee editor */}
                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Your session fee</p>
                        <FeeEditor currentFee={sessionFee} token={token} onSaved={setSessionFee} />
                    </div>

                    {/* Earnings summary */}
                    <EarningsSummary bookings={allBookings} />
                </div>
            </div>

            {/* ── Filter tabs ── */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
                    {FILTER_TABS.map(tab => (
                        <button key={tab.key}
                            onClick={() => { setFilter(tab.key); setPage(1); }}
                            className={`relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                filter === tab.key
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-yellow-400 text-white text-[10px] font-bold flex items-center justify-center">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                        <span className="text-sm text-red-700">{error}</span>
                        <button onClick={() => loadBookings()} className="ml-auto text-xs text-red-600 underline">Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <RefreshCw size={32} className="animate-spin text-indigo-400" />
                        <p className="text-gray-400">Loading sessions…</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Calendar size={48} className="text-gray-200" />
                        <p className="text-lg font-medium text-gray-400">
                            {filter === 'all' ? 'No sessions yet' : `No ${filter} sessions`}
                        </p>
                        {filter === 'pending' && (
                            <p className="text-sm text-gray-400">New paid student requests will appear here</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {bookings.map(b => (
                            <BookingCard key={b._id} booking={b}
                                actionLoading={actionLoading}
                                onApprove={setApproveTarget}
                                onReject={setRejectTarget}
                                onDone={setDoneTarget}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        <button onClick={() => setPage(p => Math.max(p - 1, 1))} disabled={!pagination.hasPrev}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                            ← Prev
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => (
                            <button key={i + 1} onClick={() => setPage(i + 1)}
                                className={`px-3 py-1.5 rounded-lg text-sm ${
                                    page === i + 1
                                        ? 'bg-indigo-600 text-white'
                                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}>
                                {i + 1}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(p + 1, pagination.totalPages))} disabled={!pagination.hasNext}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                            Next →
                        </button>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {approveTarget && (
                <ApproveModal booking={approveTarget}
                    onConfirm={handleApproveConfirm}
                    onClose={() => setApproveTarget(null)}
                    loading={!!actionLoading[approveTarget._id]} />
            )}
            {rejectTarget && (
                <RejectModal booking={rejectTarget}
                    onConfirm={handleRejectConfirm}
                    onClose={() => setRejectTarget(null)}
                    loading={!!actionLoading[rejectTarget._id]} />
            )}
            {doneTarget && (
                <DoneModal booking={doneTarget}
                    onConfirm={handleDoneConfirm}
                    onClose={() => setDoneTarget(null)}
                    loading={!!actionLoading[doneTarget._id]} />
            )}

            {/* ── Toast ── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all ${
                    toast.type === 'error'   ? 'bg-red-600'    :
                    toast.type === 'warning' ? 'bg-yellow-500' : 'bg-green-600'
                }`}>
                    {toast.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
