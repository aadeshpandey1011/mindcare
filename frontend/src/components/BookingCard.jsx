import React, { useState } from 'react';
import {
    Calendar, Clock, Video, Phone, MapPin, ExternalLink,
    X, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
    CreditCard, RefreshCw, IndianRupee, Ban, Star,
    ThumbsUp, AlertTriangle, Banknote, Scale, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// Static import replaces the dynamic await import() that caused the Vite warning
import {
    createPaymentOrder,
    openCashfreeCheckout,
    verifyPayment,
} from '../api/paymentApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? '—' : dt.toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
};
const fmtSlot = (s) => s?.replace('-', ' – ') || '—';

const isDispute         = (b) => /^DISPUTE:/i.test(b.cancellationReason || '');
const disputeReason     = (b) => (b.cancellationReason || '').replace(/^DISPUTE:\s*/i, '').trim();
const isDisputeResolved = (b) => !!(b.adminDisputeResolution?.decision);

const STATUS_META = {
    payment_pending: {
        label: 'Awaiting Payment',
        cls:   'bg-purple-100 text-purple-800 border-purple-200',
        icon:  <CreditCard className="h-3.5 w-3.5" />,
        tip:   'Your slot is reserved. Complete payment to confirm the booking.',
    },
    pending: {
        label: 'Pending Approval',
        cls:   'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon:  <Clock className="h-3.5 w-3.5" />,
        tip:   'Payment received. Waiting for the counsellor to confirm your session.',
    },
    confirmed: {
        label: 'Confirmed',
        cls:   'bg-green-100 text-green-800 border-green-200',
        icon:  <CheckCircle className="h-3.5 w-3.5" />,
        tip:   'Your session is confirmed! Attend as scheduled.',
    },
    session_done: {
        label: 'Awaiting Your Confirmation',
        cls:   'bg-indigo-100 text-indigo-800 border-indigo-200',
        icon:  <ThumbsUp className="h-3.5 w-3.5" />,
        tip:   'The counsellor has marked this session as done. Please confirm and leave a review to release payment.',
    },
    completed: {
        label: 'Completed',
        cls:   'bg-blue-100 text-blue-800 border-blue-200',
        icon:  <CheckCircle className="h-3.5 w-3.5" />,
        tip:   'Session completed and reviewed. Thank you!',
    },
    cancelled: {
        label: 'Cancelled',
        cls:   'bg-red-100 text-red-800 border-red-200',
        icon:  <X className="h-3.5 w-3.5" />,
        tip:   'This booking has been cancelled.',
    },
};

const getDisputeMeta = (booking) => {
    const resolved = isDisputeResolved(booking);
    const decision = booking.adminDisputeResolution?.decision;
    if (!resolved) return {
        label: 'Dispute Under Review',
        cls:   'bg-orange-100 text-orange-800 border-orange-300',
        icon:  <ShieldAlert className="h-3.5 w-3.5" />,
        tip:   'You raised a dispute. Our admin team is reviewing this case within 24 hours.',
    };
    if (decision === 'refund_student') return {
        label: 'Dispute — Refunded',
        cls:   'bg-green-100 text-green-800 border-green-200',
        icon:  <Scale className="h-3.5 w-3.5" />,
        tip:   'Dispute resolved in your favour. A refund has been initiated to your original payment method.',
    };
    return {
        label: 'Dispute — Closed',
        cls:   'bg-gray-100 text-gray-700 border-gray-200',
        icon:  <Scale className="h-3.5 w-3.5" />,
        tip:   'Dispute reviewed. Admin released payment to the counsellor. Contact support@mindcare.com with concerns.',
    };
};

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 28 }) {
    const [hovered, setHovered] = useState(0);
    return (
        <div className="flex items-center gap-1">
            {[1,2,3,4,5].map(star => (
                <button key={star} type="button"
                    onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(star)}
                    className="focus:outline-none transition-transform hover:scale-110">
                    <Star size={size} className={`transition-colors ${star <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
            ))}
            {value > 0 && (
                <span className="ml-2 text-sm font-medium text-gray-600">
                    {['','Poor','Fair','Good','Very Good','Excellent'][value]}
                </span>
            )}
        </div>
    );
}

// ── Review Modal ──────────────────────────────────────────────────────────────
function ReviewModal({ booking, onConfirm, onDispute, onClose, loading }) {
    const [rating,          setRating]         = useState(0);
    const [comment,         setComment]        = useState('');
    const [showDisputeForm, setShowDispute]    = useState(false);
    const [disputeText,     setDisputeText]    = useState('');
    const counsellorName = booking.counselor?.fullName || 'your counsellor';
    const autoConfirmIn  = booking.sessionDoneAt
        ? Math.max(0, Math.ceil((new Date(booking.sessionDoneAt).getTime() + 48*3600*1000 - Date.now()) / 3600000))
        : null;

    if (showDisputeForm) return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertTriangle size={20} className="text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Raise a Dispute</h3>
                        <p className="text-xs text-gray-500">Our team will review within 24 hours</p>
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
                    <p className="font-semibold mb-1">⚠️ What happens when you dispute:</p>
                    <ul className="space-y-1">
                        <li>• Payment to the counsellor is paused</li>
                        <li>• MindCare admin will review your case within 24 hours</li>
                        <li>• Refund will be issued if the dispute is valid</li>
                    </ul>
                </div>
                <textarea autoFocus value={disputeText} onChange={e => setDisputeText(e.target.value)}
                    placeholder="Describe what happened…" rows={4} maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 mb-4" />
                <div className="flex gap-3">
                    <button onClick={() => setShowDispute(false)}
                        className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
                    <button onClick={() => disputeText.trim() && onDispute(disputeText.trim())}
                        disabled={loading || !disputeText.trim()}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                        Submit Dispute
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Confirm Session & Review</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Your feedback helps other students and releases payment to {counsellorName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-5 text-sm space-y-1.5">
                    <div className="flex justify-between"><span className="text-gray-500">Counsellor</span><span className="font-medium">{counsellorName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{fmtDate(booking.date)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{booking.timeSlot}</span></div>
                    {booking.feePaid > 0 && (
                        <div className="flex justify-between border-t pt-2 mt-2">
                            <span className="text-gray-500">Fee paid</span>
                            <span className="font-semibold text-green-600">₹{booking.feePaid}</span>
                        </div>
                    )}
                </div>
                {autoConfirmIn !== null && autoConfirmIn > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
                        ⏰ If you don't respond within <strong>{autoConfirmIn} hour{autoConfirmIn !== 1 ? 's' : ''}</strong>, the session will be auto-confirmed.
                    </div>
                )}
                {booking.feePaid > 0 && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-5">
                        <Banknote size={13} className="flex-shrink-0" />
                        <span>Confirming will release <strong>₹{booking.feePaid}</strong> to {counsellorName}.</span>
                    </div>
                )}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Rate your session <span className="text-red-400">*</span></label>
                    <StarRating value={rating} onChange={setRating} size={32} />
                    {rating === 0 && <p className="text-xs text-red-400 mt-1">Please select a rating to continue</p>}
                </div>
                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Write a review <span className="text-gray-400">(optional)</span></label>
                    <textarea value={comment} onChange={e => setComment(e.target.value)}
                        placeholder="How was the session?" rows={3} maxLength={500}
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
                </div>
                <div className="space-y-2">
                    <button onClick={() => rating > 0 && onConfirm(rating, comment)} disabled={loading || rating === 0}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                        {loading ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                        Confirm Session & Submit Review
                    </button>
                    <button onClick={() => setShowDispute(true)} disabled={loading}
                        className="w-full py-2.5 text-red-600 text-sm font-medium hover:bg-red-50 rounded-xl border border-red-200 flex items-center justify-center gap-2 transition-colors">
                        <AlertTriangle size={14} /> Session didn't happen / I have a dispute
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
function CancelModal({ booking, onConfirm, onClose, loading }) {
    const [reason, setReason] = useState('');
    const isPaid = ['pending', 'confirmed', 'session_done'].includes(booking.status);
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Cancel Booking</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                </div>
                {isPaid && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
                        <p className="font-medium mb-0.5">💰 Refund Policy</p>
                        <p>Cancellations more than 24 hours before the session receive a <strong>full refund</strong>.</p>
                    </div>
                )}
                <textarea autoFocus value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="Reason for cancellation…" rows={3} maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300" />
                <p className="text-xs text-gray-400 text-right mt-1">{reason.length}/200</p>
                <div className="flex gap-3 mt-4">
                    <button onClick={onClose} disabled={loading}
                        className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Keep Booking</button>
                    <button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={loading || !reason.trim()}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <RefreshCw size={14} className="animate-spin" /> : <Ban size={14} />}
                        Cancel Booking
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  BOOKING CARD  (student view)
// ─────────────────────────────────────────────────────────────────────────────
export default function BookingCard({ booking, onStatusUpdate, onRefresh }) {
    const { token } = useAuth();
    const [expanded,      setExpanded]      = useState(false);
    const [showReview,    setShowReview]    = useState(false);
    const [showCancel,    setShowCancel]    = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [payState,      setPayState]      = useState('idle');
    const [payError,      setPayError]      = useState('');

    const isDisputeBooking = isDispute(booking);
    const disputeResolved  = isDisputeResolved(booking);
    const resolution       = booking.adminDisputeResolution;

    const meta       = isDisputeBooking ? getDisputeMeta(booking) : (STATUS_META[booking.status] || STATUS_META.cancelled);
    const isUpcoming = new Date(booking.date) > new Date();
    const canCancel  = ['payment_pending', 'pending', 'confirmed'].includes(booking.status) && !isDisputeBooking;
    const needsPayment = booking.status === 'payment_pending' && !isDisputeBooking;
    const needsReview  = booking.status === 'session_done'    && !isDisputeBooking;

    const accentColor = isDisputeBooking
        ? (disputeResolved ? (resolution?.decision === 'refund_student' ? '#10b981' : '#6b7280') : '#f97316')
        : ({
            payment_pending: '#a855f7', pending: '#f59e0b', confirmed: '#10b981',
            session_done: '#6366f1',    completed: '#3b82f6', cancelled: '#ef4444',
          }[booking.status] || '#6b7280');

    // ── Payment (now uses static import) ──────────────────────────────────────
    const handleRetryPayment = async () => {
        setPayError(''); setPayState('creating');
        try {
            const orderRes  = await createPaymentOrder(booking._id);
            const orderData = orderRes.data?.data || orderRes.data;
            if (orderData?.free || !orderData?.paymentSessionId) {
                setPayState(orderData?.free ? 'done' : 'failed');
                if (!orderData?.paymentSessionId) setPayError('Payment gateway not configured.');
                if (orderData?.free && onRefresh) onRefresh();
                return;
            }
            setPayState('paying');
            openCashfreeCheckout(orderData,
                async () => {
                    setPayState('verifying');
                    try {
                        await verifyPayment({ orderId: orderData.orderId, bookingId: booking._id });
                        setPayState('done');
                        if (onRefresh) onRefresh();
                    } catch (e) { setPayError(e.message); setPayState('failed'); }
                },
                (e) => {
                    if (e.message === 'Payment cancelled by user') setPayState('idle');
                    else { setPayError(e.message); setPayState('failed'); }
                }
            );
        } catch (e) { setPayError(e.message); setPayState('failed'); }
    };

    const handleConfirmReview = async (rating, comment) => {
        setActionLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/bookings/${booking._id}/confirm-complete`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ rating, comment }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to confirm session');
            setShowReview(false);
            if (onRefresh) onRefresh();
        } catch (e) { alert(e.message); }
        finally { setActionLoading(false); }
    };

    const handleDispute = async (reason) => {
        setActionLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/bookings/${booking._id}/dispute`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to file dispute');
            setShowReview(false);
            if (onRefresh) onRefresh();
        } catch (e) { alert(e.message); }
        finally { setActionLoading(false); }
    };

    const handleCancelConfirm = async (reason) => {
        setActionLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/bookings/${booking._id}/cancel`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ cancellationReason: reason }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Cancellation failed');
            setShowCancel(false);
            if (onStatusUpdate) onStatusUpdate(booking._id, 'cancelled', reason);
            if (onRefresh) onRefresh();
        } catch (e) { alert(e.message); }
        finally { setActionLoading(false); }
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-1.5" style={{ background: accentColor }} />

                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                            {booking.counselor?.avatar ? (
                                <img src={booking.counselor.avatar} alt={booking.counselor.fullName}
                                    className="w-11 h-11 rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm" />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                    {(booking.counselor?.fullName || 'C')[0].toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{booking.counselor?.fullName || 'Counsellor'}</p>
                                <p className="text-xs text-gray-500 truncate">{booking.counselor?.specialization || 'General Counselling'}</p>
                            </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${meta.cls}`}>
                            {meta.icon}{meta.label}
                        </span>
                    </div>

                    {/* Details row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Calendar size={12} className="text-indigo-400 flex-shrink-0" />
                            <span className="truncate">{fmtDate(booking.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Clock size={12} className="text-indigo-400 flex-shrink-0" />
                            <span>{fmtSlot(booking.timeSlot)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            {booking.mode === 'online'    && <Video  size={12} />}
                            {booking.mode === 'phone'     && <Phone  size={12} />}
                            {booking.mode === 'in-person' && <MapPin size={12} />}
                            <span className="capitalize">{booking.mode}</span>
                        </div>
                    </div>

                    {/* Status tip */}
                    <div className={`rounded-xl px-3 py-2 text-xs mb-4 ${
                        isDisputeBooking && !disputeResolved               ? 'bg-orange-50 border border-orange-200 text-orange-800' :
                        isDisputeBooking && resolution?.decision === 'refund_student' ? 'bg-green-50 border border-green-200 text-green-800' :
                        isDisputeBooking                                   ? 'bg-gray-50 border border-gray-200 text-gray-700' :
                        booking.status === 'payment_pending' ? 'bg-purple-50 border border-purple-200 text-purple-800' :
                        booking.status === 'pending'         ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                        booking.status === 'confirmed'       ? 'bg-green-50  border border-green-200  text-green-800'  :
                        booking.status === 'session_done'    ? 'bg-indigo-50 border border-indigo-200 text-indigo-800' :
                        booking.status === 'completed'       ? 'bg-blue-50   border border-blue-200   text-blue-800'   :
                                                               'bg-red-50    border border-red-200    text-red-800'
                    }`}>
                        {meta.tip}
                    </div>

                    {/* ── DISPUTE SECTION ── */}
                    {isDisputeBooking && (
                        <div className={`rounded-xl border p-4 mb-4 space-y-3 ${
                            disputeResolved
                                ? resolution?.decision === 'refund_student' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                : 'bg-orange-50 border-orange-300'
                        }`}>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide mb-1 text-orange-600">⚖️ Your Dispute Reason</p>
                                <p className="text-xs text-gray-700 leading-relaxed italic">"{disputeReason(booking)}"</p>
                            </div>

                            {disputeResolved && (
                                <div className="border-t pt-3 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Admin Decision</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-600">Outcome</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${resolution.decision === 'refund_student' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                                            {resolution.decision === 'refund_student' ? '💰 Refund Issued to You' : '📤 Payment Released to Counsellor'}
                                        </span>
                                    </div>
                                    {resolution.note && (
                                        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Admin Note</p>
                                            <p className="text-xs text-gray-700 leading-relaxed">"{resolution.note}"</p>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-400">Resolved on {fmtDate(resolution.resolvedAt)}</p>
                                    {resolution.decision === 'refund_student' && (
                                        <p className="text-xs text-green-700 font-medium">✅ Refund of ₹{booking.feePaid} will be credited in 5–7 business days.</p>
                                    )}
                                    {resolution.decision === 'release_counsellor' && (
                                        <p className="text-xs text-gray-600">Contact <a href="mailto:support@mindcare.com" className="text-indigo-600 underline">support@mindcare.com</a> if you have further questions.</p>
                                    )}
                                </div>
                            )}

                            {!disputeResolved && (
                                <div className="flex items-center gap-2 text-xs text-orange-700">
                                    <RefreshCw size={11} className="animate-spin flex-shrink-0"/>
                                    <span>Admin is reviewing your case — typically resolved within 24 hours.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* session_done CTA */}
                    {needsReview && (
                        <div className="bg-indigo-600 rounded-xl p-4 mb-4 text-white">
                            <p className="font-semibold text-sm mb-1">📋 Action required</p>
                            <p className="text-xs text-indigo-200 mb-3">
                                {booking.counselor?.fullName} has marked the session as done. Confirm and leave a review to release their payment.
                            </p>
                            <button onClick={() => setShowReview(true)}
                                className="w-full py-2 bg-white text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2">
                                <Star size={14} className="fill-yellow-400 text-yellow-400" /> Confirm & Leave Review
                            </button>
                        </div>
                    )}

                    {/* Completed review */}
                    {booking.status === 'completed' && booking.reviewId && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-4">
                            <div className="flex items-center gap-1 mb-0.5">
                                {[1,2,3,4,5].map(s => (
                                    <Star key={s} size={14} className={s <= (booking.reviewId?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                                ))}
                                <span className="text-xs text-blue-700 ml-1 font-medium">Your review</span>
                            </div>
                            {booking.reviewId?.comment && <p className="text-xs text-blue-700 mt-0.5">"{booking.reviewId.comment}"</p>}
                        </div>
                    )}

                    {/* Auto-confirmed */}
                    {booking.status === 'completed' && booking.autoConfirmed && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4 text-xs text-amber-800">
                            ⏰ Auto-confirmed after 48 hours.
                            {!booking.reviewId && <button onClick={() => setShowReview(true)} className="ml-1 underline">Leave a review now</button>}
                        </div>
                    )}

                    {/* Pay errors */}
                    {payError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-800 mb-4 flex items-center justify-between">
                            <span>⚠️ {payError}</span>
                            <button onClick={() => { setPayError(''); setPayState('idle'); }} className="text-red-600 underline ml-2">Dismiss</button>
                        </div>
                    )}
                    {(payState === 'creating' || payState === 'verifying') && (
                        <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 mb-4">
                            <RefreshCw size={12} className="animate-spin" />
                            {payState === 'creating' ? 'Creating payment order…' : 'Verifying payment…'}
                        </div>
                    )}

                    {/* Meeting link */}
                    {booking.meetingLink && booking.status === 'confirmed' && isUpcoming && (
                        <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 mb-3 font-medium">
                            <ExternalLink size={13} /> Join Meeting
                        </a>
                    )}

                    {/* Expanded */}
                    {expanded && (
                        <div className="border-t border-gray-100 pt-4 mb-4 space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Reason for booking</p>
                                <p className="text-gray-700">{booking.reason}</p>
                            </div>
                            {booking.notes && (
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Your notes</p>
                                    <p className="text-gray-700">{booking.notes}</p>
                                </div>
                            )}
                            {booking.feePaid > 0 && (
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <IndianRupee size={13} className="text-green-500" />
                                    <span>Fee paid: <strong className="text-gray-800">₹{booking.feePaid}</strong></span>
                                </div>
                            )}
                            {booking.cancellationReason && !isDisputeBooking && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                                    <p className="text-xs text-red-500 font-medium mb-0.5">Cancellation reason</p>
                                    <p className="text-red-800 text-sm">{booking.cancellationReason}</p>
                                </div>
                            )}
                            <p className="text-xs text-gray-400">Booked on {fmtDate(booking.createdAt)}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <button onClick={() => setExpanded(e => !e)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {expanded ? 'Hide' : 'Details'}
                        </button>
                        <div className="flex items-center gap-2">
                            {needsPayment && (
                                <button onClick={handleRetryPayment}
                                    disabled={payState === 'creating' || payState === 'paying' || payState === 'verifying'}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                                    {payState !== 'idle' ? <RefreshCw size={11} className="animate-spin" /> : <CreditCard size={11} />}
                                    Pay Now
                                </button>
                            )}
                            {booking.status === 'confirmed' && booking.meetingLink && isUpcoming && (
                                <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
                                    <Video size={11} /> Join
                                </a>
                            )}
                            {canCancel && (
                                <button onClick={() => setShowCancel(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200">
                                    <X size={11} /> Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showReview && (
                <ReviewModal booking={booking} onConfirm={handleConfirmReview} onDispute={handleDispute}
                    onClose={() => setShowReview(false)} loading={actionLoading} />
            )}
            {showCancel && (
                <CancelModal booking={booking} onConfirm={handleCancelConfirm}
                    onClose={() => setShowCancel(false)} loading={actionLoading} />
            )}
        </>
    );
}
