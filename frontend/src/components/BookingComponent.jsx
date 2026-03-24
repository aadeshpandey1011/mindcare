import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Clock, Phone, Video, MapPin,
    CheckCircle, AlertCircle, ChevronRight, IndianRupee, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createPaymentOrder, verifyPayment, openCashfreeCheckout } from '../api/paymentApi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const ALL_SLOTS = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '14:00-15:00', '15:00-16:00', '16:00-17:00',
];

const MODE_SURCHARGE = {
    'online':    0,
    'phone':     0,
    'in-person': 100,
};

const MODE_OPTIONS = [
    { value: 'online',    label: 'Online',    Icon: Video,  note: 'No extra charge' },
    { value: 'phone',     label: 'Phone',     Icon: Phone,  note: 'No extra charge' },
    { value: 'in-person', label: 'In-Person', Icon: MapPin, note: '+₹100 surcharge'  },
];

const calcFee = (baseFee, mode) => {
    if (baseFee === 0) return 0;
    return baseFee + (MODE_SURCHARGE[mode] || 0);
};

function Row({ label, value }) {
    return (
        <div className="flex justify-between items-center py-0.5">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className="text-gray-900 font-medium text-sm">{value}</span>
        </div>
    );
}

function StepBar({ step, preselected }) {
    // If a counsellor was preselected from an ad, step 1 is skipped — show condensed bar
    const steps = preselected
        ? ['Counsellor ✓', 'Date & Slot', 'Details', 'Confirm']
        : ['Counsellor', 'Date & Slot', 'Details', 'Confirm'];

    return (
        <div className="flex items-center gap-2 mb-8">
            {steps.map((label, i) => {
                const n       = i + 1;
                const done    = step > n;
                const current = step === n;
                // Step 1 is auto-done when preselected
                const autoDone = preselected && n === 1;
                return (
                    <React.Fragment key={n}>
                        <div className="flex flex-col items-center gap-1 min-w-[52px]">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                                done || autoDone ? 'bg-green-500 text-white'  :
                                current         ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
                            }`}>
                                {done || autoDone ? '✓' : n}
                            </div>
                            <span className={`text-[10px] font-medium ${current ? 'text-indigo-600' : 'text-gray-400'}`}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-4 ${(step > n || autoDone) ? 'bg-green-400' : 'bg-gray-200'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
//
//  Props:
//    onBookingCreated       — callback after booking is created
//    preselectedCounsellorId — when coming from a forum ad, skip step 1
// ─────────────────────────────────────────────────────────────────────────────
export default function BookingComponent({ onBookingCreated, preselectedCounsellorId }) {
    const { user, token } = useAuth();

    // If a counsellor was pre-selected (ad click), start at step 2
    const initialStep = preselectedCounsellorId ? 2 : 1;

    const [step,       setStep]       = useState(initialStep);
    const [loading,    setLoading]    = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [payState,   setPayState]   = useState('idle');

    const [counselors,   setCounselors]   = useState([]);
    const [slotData,     setSlotData]     = useState(null);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [payError,     setPayError]     = useState('');

    const [formData, setFormData] = useState({
        counselorId: preselectedCounsellorId || '',
        date:        '',
        timeSlot:    '',
        mode:        'online',
        reason:      '',
        notes:       '',
    });

    const minDate = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
    const maxDate = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })();

    const selectedCounsellor = counselors.find(c => c._id === formData.counselorId);
    const baseFee  = selectedCounsellor?.sessionFee ?? 299;
    const totalFee = calcFee(baseFee, formData.mode);

    // ── Load counsellors ───────────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res  = await fetch(`${API_BASE}/bookings/counselors`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setCounselors(data.data);
            } catch (e) { console.error('Counselors fetch failed', e); }
            finally { setLoading(false); }
        })();
    }, [token]);

    // ── If preselected ID but counsellor not yet in list, we still know their
    //    fee from the step-2 fetch. This is fine — selectedCounsellor may be
    //    undefined until counselors list loads, but formData.counselorId is set.
    // ── Also, if the ID changes after load (shouldn't happen), re-sync:
    useEffect(() => {
        if (preselectedCounsellorId && formData.counselorId !== preselectedCounsellorId) {
            setFormData(prev => ({ ...prev, counselorId: preselectedCounsellorId }));
        }
    }, [preselectedCounsellorId]);

    // ── Load slots ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!formData.counselorId || !formData.date) { setSlotData(null); return; }
        (async () => {
            setSlotsLoading(true);
            try {
                const res  = await fetch(`${API_BASE}/bookings/slots/${formData.counselorId}/${formData.date}`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setSlotData(data.data);
            } catch (e) { setSlotData(null); }
            finally { setSlotsLoading(false); }
        })();
    }, [formData.counselorId, formData.date, token]);

    const setField         = useCallback((field, value) => setFormData(prev => ({ ...prev, [field]: value })), []);
    const handleDateChange = useCallback((value) => setFormData(prev => ({ ...prev, date: value, timeSlot: '' })), []);
    const handleReasonChange = useCallback((e) => setFormData(prev => ({ ...prev, reason: e.target.value })), []);
    const handleNotesChange  = useCallback((e) => setFormData(prev => ({ ...prev, notes:  e.target.value })), []);

    const reset = () => {
        const resetCounsellorId = preselectedCounsellorId || '';
        setFormData({ counselorId: resetCounsellorId, date: '', timeSlot: '', mode: 'online', reason: '', notes: '' });
        setSlotData(null);
        setStep(preselectedCounsellorId ? 2 : 1);
        setPayState('idle');
        setPayError('');
    };

    const available = slotData?.availableSlots || [];
    const booked    = slotData?.bookedSlots    || [];

    // ─────────────────────────────────────────────────────────────────────────
    //  SUBMIT + PAYMENT FLOW
    // ─────────────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setSubmitting(true);
        setPayError('');
        try {
            const bookingRes  = await fetch(`${API_BASE}/bookings`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body:    JSON.stringify(formData),
            });
            const bookingData = await bookingRes.json();
            if (!bookingRes.ok) throw new Error(bookingData.message || 'Booking creation failed');

            const booking    = bookingData.data?.booking;
            const bookingId  = booking?._id;
            const serverFee  = bookingData.data?.sessionFee ?? 0;

            if (serverFee === 0) {
                if (onBookingCreated) onBookingCreated(booking);
                setStep(5);
                setSubmitting(false);
                return;
            }

            setPayState('creating');
            const orderRes  = await createPaymentOrder(bookingId);
            const orderData = orderRes.data?.data || orderRes.data;

            if (orderData?.free) {
                if (onBookingCreated) onBookingCreated(booking);
                setStep(5);
                setSubmitting(false);
                setPayState('done');
                return;
            }

            if (!orderData?.paymentSessionId) {
                throw new Error('Payment gateway not configured yet. Please add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to your .env file and restart the server.');
            }

            setPayState('paying');
            setSubmitting(false);

            openCashfreeCheckout(
                orderData,
                async () => {
                    setPayState('verifying');
                    try {
                        await verifyPayment({ orderId: orderData.orderId, bookingId });
                        if (onBookingCreated) onBookingCreated(booking);
                        setPayState('done');
                        setStep(5);
                    } catch (verifyErr) {
                        setPayError(`Payment verification failed: ${verifyErr.message}`);
                        setPayState('failed');
                    }
                },
                (err) => {
                    if (err.message === 'Payment cancelled by user') {
                        setPayState('idle');
                        setPayError('Payment was cancelled. Your booking slot is still reserved for 15 minutes — click "Confirm & Pay" to try again.');
                    } else {
                        setPayState('failed');
                        setPayError(`Payment failed: ${err.message}`);
                    }
                }
            );
        } catch (e) {
            setPayError(e.message);
            setPayState('failed');
            setSubmitting(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Book a Counselling Session</h1>
                <p className="text-gray-500 text-sm mt-1">Confidential, professional support — for you</p>
            </div>

            {step < 5 && <StepBar step={step} preselected={!!preselectedCounsellorId} />}

            {/* ── Pre-selected counsellor banner (shown on step 2+ when coming from ad) ── */}
            {preselectedCounsellorId && step <= 4 && selectedCounsellor && (
                <div className="mb-6 flex items-center gap-3 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3">
                    {selectedCounsellor.avatar ? (
                        <img src={selectedCounsellor.avatar} alt={selectedCounsellor.fullName}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-indigo-200" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                            {selectedCounsellor.fullName[0]}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-indigo-900">{selectedCounsellor.fullName}</p>
                        <p className="text-xs text-indigo-600">{selectedCounsellor.specialization || 'General Counselling'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        {selectedCounsellor.sessionFee === 0
                            ? <span className="text-sm font-bold text-green-600">Free</span>
                            : <span className="text-sm font-bold text-indigo-700">from ₹{selectedCounsellor.sessionFee}</span>
                        }
                    </div>
                    {/* Allow switching counsellor */}
                    <button onClick={() => { setFormData(prev => ({ ...prev, counselorId: '', date: '', timeSlot: '' })); setStep(1); }}
                        className="ml-2 text-xs text-indigo-500 hover:text-indigo-700 underline flex-shrink-0">
                        Change
                    </button>
                </div>
            )}

            {/* ── STEP 1 — Choose counsellor ── */}
            {step === 1 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Choose a Counsellor</h2>
                    <p className="text-sm text-gray-500 mb-6">Fees shown are base prices — in-person sessions have a ₹100 surcharge</p>
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-gray-400">
                            <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
                            Loading counsellors…
                        </div>
                    ) : counselors.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <AlertCircle size={32} className="mx-auto mb-3" />
                            <p>No counsellors available right now.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {counselors.map(c => (
                                <button key={c._id} onClick={() => setField('counselorId', c._id)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                        formData.counselorId === c._id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}>
                                    <div className="flex items-center gap-4">
                                        {c.avatar ? (
                                            <img src={c.avatar} alt={c.fullName} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {c.fullName[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900">{c.fullName}</p>
                                            <p className="text-sm text-gray-500 truncate">{c.specialization || 'General Counselling'}</p>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            {c.sessionFee === 0 ? (
                                                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">Free</span>
                                            ) : (
                                                <div>
                                                    <div className="flex items-center gap-0.5 justify-end text-indigo-700 font-semibold text-sm">
                                                        <IndianRupee size={12} />{c.sessionFee}<span className="text-gray-400 font-normal ml-0.5">online</span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 justify-end text-orange-600 text-xs mt-0.5">
                                                        <IndianRupee size={10} />{c.sessionFee + MODE_SURCHARGE['in-person']}<span className="text-gray-400 ml-0.5">in-person</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {formData.counselorId === c._id && <CheckCircle size={18} className="text-indigo-500 flex-shrink-0" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    <button onClick={() => setStep(2)} disabled={!formData.counselorId}
                        className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 flex items-center justify-center gap-2">
                        Next: Pick Date & Slot <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* ── STEP 2 — Date + slot grid ── */}
            {step === 2 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Select Date & Time</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        {selectedCounsellor
                            ? <>Booking with <strong>{selectedCounsellor.fullName}</strong>{baseFee === 0 ? ' · 🟢 Free session' : ` · from ₹${baseFee}`}</>
                            : 'Loading counsellor details…'
                        }
                    </p>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={14} className="inline mr-1 text-indigo-400" />Select Date
                        </label>
                        <input type="date" min={minDate} max={maxDate} value={formData.date}
                            onChange={e => handleDateChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm" />
                    </div>
                    {formData.date && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                <Clock size={14} className="inline mr-1 text-indigo-400" />
                                Time Slots — {new Date(formData.date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
                            </label>
                            {slotsLoading ? (
                                <div className="flex items-center gap-2 text-gray-400 text-sm py-4">
                                    <div className="animate-spin w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full" />Loading slots…
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-4 mb-3 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300 inline-block" />Available</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block" />Booked</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-600 inline-block" />Selected</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {ALL_SLOTS.map(slot => {
                                            const isBooked   = booked.includes(slot);
                                            const isSelected = formData.timeSlot === slot;
                                            return (
                                                <button key={slot} type="button" disabled={isBooked}
                                                    onClick={() => !isBooked && setField('timeSlot', slot)}
                                                    className={`relative px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                                        isBooked    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' :
                                                        isSelected  ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'         :
                                                        'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100'
                                                    }`}>
                                                    <span className="flex items-center justify-center gap-2"><Clock size={13} />{slot}</span>
                                                    {isBooked   && <span className="absolute top-1 right-1.5 text-[9px] font-bold text-gray-400 bg-gray-200 px-1 rounded">TAKEN</span>}
                                                    {isSelected && <span className="absolute top-1 right-1.5"><CheckCircle size={12} className="text-white" /></span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {slotData && <p className="mt-3 text-xs text-gray-400">{available.length} of {ALL_SLOTS.length} slots available on this date</p>}
                                </>
                            )}
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button type="button"
                            onClick={() => {
                                // Going back: if counsellor was preselected from ad, warn user they'll lose the pre-selection
                                if (preselectedCounsellorId) {
                                    setFormData(prev => ({ ...prev, date: '', timeSlot: '' }));
                                    setStep(1);
                                } else {
                                    setStep(1);
                                }
                            }}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
                            Back
                        </button>
                        <button type="button" onClick={() => setStep(3)} disabled={!formData.date || !formData.timeSlot}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 flex items-center justify-center gap-2">
                            Next: Session Details <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3 — Mode + reason + notes ── */}
            {step === 3 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Session Details</h2>
                    <p className="text-sm text-gray-500 mb-6">Choose your session mode — pricing varies by mode</p>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">Session Mode</label>
                        <div className="grid grid-cols-3 gap-3">
                            {MODE_OPTIONS.map(({ value, label, Icon }) => {
                                const modeFee      = calcFee(baseFee, value);
                                const isSelected   = formData.mode === value;
                                const hasSurcharge = MODE_SURCHARGE[value] > 0;
                                return (
                                    <button key={value} type="button" onClick={() => setField('mode', value)}
                                        className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                                            isSelected
                                                ? hasSurcharge ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}>
                                        <Icon size={20} />
                                        <span className="text-xs font-semibold">{label}</span>
                                        {baseFee === 0 ? (
                                            <span className="text-[10px] text-green-600 font-medium">Free</span>
                                        ) : (
                                            <>
                                                <span className="text-[11px] font-bold">₹{modeFee}</span>
                                                {hasSurcharge && <span className="text-[9px] text-orange-500 font-medium bg-orange-100 px-1.5 py-0.5 rounded-full">+₹{MODE_SURCHARGE[value]}</span>}
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {baseFee > 0 && (
                            <div className={`mt-3 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between ${
                                formData.mode === 'in-person' ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-indigo-50 border border-indigo-200 text-indigo-800'
                            }`}>
                                <span>{formData.mode === 'in-person' ? `₹${baseFee} base + ₹${MODE_SURCHARGE['in-person']} surcharge` : `₹${baseFee} for ${formData.mode} session`}</span>
                                <span className="font-bold text-base flex items-center gap-0.5"><IndianRupee size={14} />{totalFee}</span>
                            </div>
                        )}
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for booking <span className="text-red-400">*</span></label>
                        <textarea value={formData.reason} onChange={handleReasonChange}
                            placeholder="Briefly describe what you'd like to discuss…"
                            rows={3} maxLength={200}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        <p className="text-xs text-gray-400 mt-1 text-right">{formData.reason.length}/200</p>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional notes <span className="text-gray-400">(optional)</span></label>
                        <textarea value={formData.notes} onChange={handleNotesChange}
                            placeholder="Anything else the counsellor should know…"
                            rows={2} maxLength={500}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        <p className="text-xs text-gray-400 mt-1 text-right">{formData.notes.length}/500</p>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Back</button>
                        <button type="button" onClick={() => setStep(4)} disabled={!formData.reason.trim()}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-indigo-700 flex items-center justify-center gap-2">
                            Review Booking <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 4 — Confirm + Pay ── */}
            {step === 4 && (
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Confirm Booking</h2>
                    <p className="text-sm text-gray-500 mb-6">Please review the details before proceeding</p>

                    <div className="bg-gray-50 rounded-2xl p-5 space-y-2 mb-5">
                        <Row label="Counsellor"     value={selectedCounsellor?.fullName} />
                        <Row label="Specialisation" value={selectedCounsellor?.specialization || 'General'} />
                        <Row label="Date"           value={new Date(formData.date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} />
                        <Row label="Time"           value={formData.timeSlot} />
                        <Row label="Mode"           value={
                            <span className="flex items-center gap-1.5 capitalize">
                                {formData.mode === 'online'    && <Video  size={13} />}
                                {formData.mode === 'phone'     && <Phone  size={13} />}
                                {formData.mode === 'in-person' && <MapPin size={13} />}
                                {formData.mode}
                                {MODE_SURCHARGE[formData.mode] > 0 && (
                                    <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full font-medium ml-1">
                                        +₹{MODE_SURCHARGE[formData.mode]} surcharge
                                    </span>
                                )}
                            </span>
                        } />
                        <div className="border-t pt-2 mt-2">
                            {baseFee > 0 ? (
                                <>
                                    {MODE_SURCHARGE[formData.mode] > 0 && (
                                        <>
                                            <Row label="Base fee"            value={`₹${baseFee}`} />
                                            <Row label="In-person surcharge" value={`+₹${MODE_SURCHARGE[formData.mode]}`} />
                                        </>
                                    )}
                                    <Row label="Total fee" value={
                                        <span className="flex items-center gap-0.5 text-indigo-700 font-bold text-base">
                                            <IndianRupee size={14} />{totalFee}
                                        </span>
                                    } />
                                </>
                            ) : (
                                <Row label="Session fee" value={<span className="text-green-600 font-semibold">Free</span>} />
                            )}
                        </div>
                        <div className="border-t pt-2 mt-2">
                            <p className="text-gray-500 text-xs mb-0.5 font-medium">Reason</p>
                            <p className="text-gray-800 text-sm">{formData.reason}</p>
                        </div>
                        {formData.notes && (
                            <div>
                                <p className="text-gray-500 text-xs mb-0.5 font-medium">Notes</p>
                                <p className="text-gray-800 text-sm">{formData.notes}</p>
                            </div>
                        )}
                    </div>

                    {payState === 'creating' && (
                        <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl mb-4 text-sm text-indigo-800">
                            <RefreshCw size={16} className="animate-spin flex-shrink-0" />Creating payment order…
                        </div>
                    )}
                    {payState === 'verifying' && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-4 text-sm text-green-800">
                            <RefreshCw size={16} className="animate-spin flex-shrink-0" />Verifying payment…
                        </div>
                    )}
                    {payError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4 text-sm text-red-800">
                            <p className="font-medium mb-1">⚠️ {payState === 'failed' ? 'Payment Failed' : 'Notice'}</p>
                            <p>{payError}</p>
                            {payState === 'failed' && (
                                <button onClick={() => { setPayError(''); setPayState('idle'); }}
                                    className="mt-2 text-xs underline text-red-700">Try again</button>
                            )}
                        </div>
                    )}

                    {totalFee > 0 && payState === 'idle' && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4 text-sm text-indigo-800">
                            <p className="font-semibold mb-1">💳 Payment required</p>
                            <p>After confirming, a secure Cashfree checkout will open to pay <strong>₹{totalFee}</strong>.</p>
                            {formData.mode === 'in-person' && <p className="mt-1 text-orange-700 text-xs">🏢 Includes ₹{MODE_SURCHARGE['in-person']} in-person facility surcharge.</p>}
                        </div>
                    )}
                    {totalFee === 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-sm text-green-800">
                            <p className="font-semibold">🎉 This is a free session — no payment required!</p>
                        </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-xs text-amber-800">
                        <p className="font-semibold mb-1">📋 Important</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Your request goes to the counsellor for confirmation</li>
                            <li>Cancellations are free if made more than 24 hours before the session</li>
                            <li>All sessions are completely confidential</li>
                        </ul>
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={() => setStep(3)}
                            disabled={submitting || payState === 'creating' || payState === 'verifying'}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-40">
                            Edit
                        </button>
                        <button type="button" onClick={handleSubmit}
                            disabled={submitting || payState === 'creating' || payState === 'paying' || payState === 'verifying'}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-60 hover:bg-indigo-700 flex items-center justify-center gap-2">
                            {(submitting || payState === 'creating' || payState === 'verifying') && (
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            )}
                            {payState === 'creating'  ? 'Creating order…'         :
                             payState === 'verifying' ? 'Verifying…'               :
                             totalFee > 0             ? `Confirm & Pay ₹${totalFee} →` : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 5 — Success ── */}
            {step === 5 && (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Submitted!</h2>
                    <p className="text-gray-500 mb-6">
                        {baseFee === 0
                            ? 'Your free session request has been sent to the counsellor.'
                            : 'Payment confirmed! Your booking is awaiting counsellor approval.'}
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left text-sm text-green-800 mb-6 space-y-1">
                        <p>✅ Counsellor will approve within 24 hours</p>
                        <p>✅ You will receive a confirmation email</p>
                        <p>✅ Check My Bookings to track status</p>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => window.location.href = '/newhome'}
                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700">
                            Go to Home
                        </button>
                        <button type="button" onClick={reset}
                            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">
                            Book Another
                        </button>
                    </div>
                </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-6">🔒 All bookings are confidential and secure.</p>
        </div>
    );
}
