import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Banknote, CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp,
    Send, XCircle, AlertCircle, Filter,
    Calendar, User, ArrowLeft, Smartphone, ExternalLink, Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtRupees = (n) => `₹${Number(n || 0).toLocaleString()}`;

// ─────────────────────────────────────────────────────────────────────────────
//  PAY & MARK-PAID MODAL
// ─────────────────────────────────────────────────────────────────────────────
function PayModal({ booking, counsellorName, counsellorUpi, onConfirm, onClose }) {
    const [reference, setReference] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [step, setStep] = useState(counsellorUpi ? 'pay' : 'manual'); // 'pay' → 'confirm'

    const upiLink = counsellorUpi
        ? `upi://pay?pa=${encodeURIComponent(counsellorUpi)}&pn=${encodeURIComponent(counsellorName)}&am=${booking.feePaid}&cu=INR&tn=${encodeURIComponent(`MindCare payout - session ${fmtDate(booking.date)}`)}`
        : null;

    const handleCopyUpi = () => {
        navigator.clipboard.writeText(counsellorUpi).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        await onConfirm(booking._id, reference, note);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">
                            {step === 'pay' ? 'Pay Counsellor' : 'Confirm Payment'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={20} /></button>
                    </div>
                </div>
                <div className="p-6">
                    {/* Amount display */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-center">
                        <p className="text-sm text-green-700 mb-1">Paying to <strong>{counsellorName}</strong></p>
                        <p className="text-3xl font-bold text-green-800">{fmtRupees(booking.feePaid)}</p>
                        <p className="text-xs text-green-600 mt-1">
                            Session on {fmtDate(booking.date)} · {booking.timeSlot}
                        </p>
                    </div>

                    {/* Step 1: Pay via UPI */}
                    {step === 'pay' && (
                        <div className="space-y-4">
                            {/* UPI ID display + copy */}
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                <p className="text-xs text-indigo-600 font-medium mb-2">Counsellor's UPI ID</p>
                                <div className="flex items-center gap-2">
                                    <span className="flex-1 font-mono text-lg font-bold text-indigo-900">{counsellorUpi}</span>
                                    <button onClick={handleCopyUpi}
                                        className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors"
                                        title="Copy UPI ID">
                                        {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                {copied && <p className="text-xs text-green-600 mt-1">Copied!</p>}
                            </div>

                            {/* Pay via UPI app button */}
                            <a href={upiLink}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
                                target="_blank" rel="noopener noreferrer">
                                <Smartphone size={16} /> Open UPI App to Pay {fmtRupees(booking.feePaid)}
                            </a>

                            <p className="text-xs text-gray-500 text-center">
                                This will open your default UPI app (GPay, PhonePe, Paytm) with the amount pre-filled.
                                <br />After paying, come back and click "I've Paid" below.
                            </p>

                            <div className="border-t border-gray-200 pt-4 flex gap-3">
                                <button onClick={onClose}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm">
                                    Cancel
                                </button>
                                <button onClick={() => setStep('confirm')}
                                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 flex items-center justify-center gap-2 text-sm">
                                    <CheckCircle size={14} /> I've Paid — Confirm
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Enter reference & confirm OR Manual mode */}
                    {(step === 'confirm' || step === 'manual') && (
                        <div className="space-y-4">
                            {step === 'manual' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                                    <p className="font-semibold">No UPI ID on file</p>
                                    <p>This counsellor hasn't added their UPI ID. Transfer the amount manually via NEFT/IMPS using their bank details, then enter the reference below.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Reference <span className="text-gray-400">(UPI ref / NEFT ref / UTR)</span>
                                </label>
                                <input
                                    type="text" value={reference}
                                    onChange={e => setReference(e.target.value)}
                                    placeholder="e.g. UPI ref 412345678901"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Note <span className="text-gray-400">(optional)</span>
                                </label>
                                <textarea
                                    value={note} onChange={e => setNote(e.target.value)}
                                    placeholder="e.g. Paid via Google Pay"
                                    rows={2}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => step === 'confirm' ? setStep('pay') : onClose()}
                                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 text-sm">
                                    {step === 'confirm' ? 'Back' : 'Cancel'}
                                </button>
                                <button onClick={handleSubmit} disabled={submitting}
                                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                                    {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                                    {submitting ? 'Saving…' : 'Confirm Payment Done'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  COUNSELLOR CARD (expandable)
// ─────────────────────────────────────────────────────────────────────────────
function CounsellorPayoutCard({ data, onMarkPaid }) {
    const [expanded, setExpanded] = useState(false);
    const [payTarget, setPayTarget] = useState(null);
    const c = data.counsellor;

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
            >
                {c.avatar ? (
                    <img src={c.avatar} alt={c.fullName} className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-indigo-100" />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {c.fullName[0]}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{c.fullName}</p>
                    <p className="text-sm text-gray-500">{c.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-emerald-600">{c.specialization || 'General Counselling'}</span>
                        {c.upiId && (
                            <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-mono">{c.upiId}</span>
                        )}
                        {!c.upiId && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">No UPI ID</span>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0 text-right mr-3">
                    {data.totalOwed > 0 && (
                        <div className="mb-1">
                            <span className="text-xs text-gray-500">Pending</span>
                            <p className="text-lg font-bold text-orange-600">{fmtRupees(data.totalOwed)}</p>
                            <span className="text-xs text-orange-500">{data.pendingCount} session{data.pendingCount !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                    {data.totalPaid > 0 && (
                        <div>
                            <span className="text-xs text-gray-500">Paid</span>
                            <p className="text-sm font-semibold text-green-600">{fmtRupees(data.totalPaid)}</p>
                        </div>
                    )}
                </div>
                {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {/* Expanded session list */}
            {expanded && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {data.bookings.map(b => (
                        <div key={b._id} className={`px-5 py-4 flex items-center gap-4 ${b.adminPayoutDone ? 'bg-green-50/50' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <User size={13} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-800">{b.student?.fullName || 'Student'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar size={11} />{fmtDate(b.date)}</span>
                                    <span>{b.timeSlot}</span>
                                    <span className="capitalize">{b.mode}</span>
                                </div>
                                {b.adminPayoutDone && b.adminPayoutRef && (
                                    <p className="text-xs text-green-600 mt-1">Ref: {b.adminPayoutRef}</p>
                                )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                                <p className="text-sm font-bold text-gray-900">{fmtRupees(b.feePaid)}</p>
                                {b.adminPayoutDone ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium mt-1">
                                        <CheckCircle size={11} /> Paid {fmtDate(b.adminPayoutDate)}
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => setPayTarget(b)}
                                        className="mt-1 inline-flex items-center gap-1.5 text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg font-semibold transition-colors shadow-sm"
                                    >
                                        {c.upiId ? <><Smartphone size={12} /> Pay via UPI</> : <><Send size={11} /> Mark Paid</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pay modal */}
            {payTarget && (
                <PayModal
                    booking={payTarget}
                    counsellorName={c.fullName}
                    counsellorUpi={c.upiId}
                    onConfirm={async (bookingId, reference, note) => {
                        await onMarkPaid(bookingId, reference, note);
                        setPayTarget(null);
                    }}
                    onClose={() => setPayTarget(null)}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPayouts() {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [error, setError] = useState('');

    const fetchPayouts = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/admin/payouts?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.success) setData(json.data);
            else setError(json.message || 'Failed to fetch');
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [token, filter]);

    useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

    const handleMarkPaid = async (bookingId, reference, note) => {
        try {
            const res = await fetch(`${API_BASE}/admin/payouts/${bookingId}/mark-paid`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reference, note }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed');
            fetchPayouts();
        } catch (e) {
            alert(`Error: ${e.message}`);
        }
    };

    const s = data?.summary || {};

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/dashboard')}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Banknote size={26} className="text-green-600" /> Counsellor Payouts
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Pay counsellors via UPI after sessions are completed
                    </p>
                </div>
            </div>

            {/* Summary cards */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-xs text-orange-600 font-medium mb-1">Pending Payouts</p>
                        <p className="text-2xl font-bold text-orange-700">{fmtRupees(s.totalPendingAmount)}</p>
                        <p className="text-xs text-orange-500">{s.totalPendingCount} session{s.totalPendingCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-xs text-green-600 font-medium mb-1">Total Paid Out</p>
                        <p className="text-2xl font-bold text-green-700">{fmtRupees(s.totalPaidAmount)}</p>
                        <p className="text-xs text-green-500">{s.totalPaidCount} session{s.totalPaidCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <p className="text-xs text-emerald-600 font-medium mb-1">Counsellors</p>
                        <p className="text-2xl font-bold text-emerald-700">{s.counsellorCount}</p>
                        <p className="text-xs text-emerald-600">with payouts</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs text-blue-600 font-medium mb-1">Net Revenue</p>
                        <p className="text-2xl font-bold text-blue-700">
                            {fmtRupees((s.totalPendingAmount || 0) + (s.totalPaidAmount || 0))}
                        </p>
                        <p className="text-xs text-blue-500">total from students</p>
                    </div>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex items-center gap-2 mb-6">
                {[
                    { key: 'pending', label: 'Pending', icon: Clock },
                    { key: 'paid',    label: 'Paid',    icon: CheckCircle },
                    { key: 'all',     label: 'All',     icon: Filter },
                ].map(({ key, label, icon: Icon }) => (
                    <button key={key} onClick={() => setFilter(key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === key
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
                <button onClick={fetchPayouts}
                    className="ml-auto p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                    title="Refresh">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-gray-400">
                    <RefreshCw size={20} className="animate-spin mr-3" /> Loading payouts…
                </div>
            ) : error ? (
                <div className="text-center py-16">
                    <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
                    <p className="text-red-600 text-sm">{error}</p>
                    <button onClick={fetchPayouts} className="mt-3 text-indigo-600 text-sm underline">Retry</button>
                </div>
            ) : data?.counsellors?.length === 0 ? (
                <div className="text-center py-16">
                    <Banknote size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter} payouts found</p>
                    <p className="text-gray-400 text-sm mt-1">
                        {filter === 'pending'
                            ? 'All counsellors have been paid! 🎉'
                            : 'Payouts will appear here after sessions are completed.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {data.counsellors.map(c => (
                        <CounsellorPayoutCard
                            key={c.counsellor._id}
                            data={c}
                            onMarkPaid={handleMarkPaid}
                        />
                    ))}
                </div>
            )}

            {/* How-it-works note */}
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
                <p className="font-semibold mb-2">📋 How payouts work</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-700">
                    <li>Student pays → money goes to your Cashfree account → Cashfree settles to your bank (T+2 days)</li>
                    <li>After session is completed and confirmed, the counsellor's share appears here as "Pending"</li>
                    <li>Click <strong>"Pay via UPI"</strong> → your UPI app opens with the counsellor's UPI ID and amount pre-filled → approve payment</li>
                    <li>Come back and enter the UPI transaction reference → counsellor gets a confirmation email</li>
                    <li>If counsellor hasn't added UPI ID, you can transfer manually via NEFT/IMPS and enter the reference</li>
                </ol>
            </div>

            {/* Tip about UPI IDs */}
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                <p className="font-semibold mb-1">💡 Tip: Ask counsellors to add their UPI ID</p>
                <p className="text-xs text-emerald-600">
                    Counsellors can add their UPI ID in Settings &amp; Ads → Bank Account section. Once added, you'll see a "Pay via UPI" button that opens your payment app with everything pre-filled — one-tap payouts!
                </p>
            </div>
        </div>
    );
}
