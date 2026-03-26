import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import {
    IndianRupee, Banknote, CheckCircle, AlertCircle,
    RefreshCw, Eye, EyeOff, CreditCard,
    Megaphone, Pause, Play, Edit3, XCircle,
    Clock, TrendingUp, MousePointer,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const AD_PLANS = [
    {
        key:           'basic',
        name:          'Basic',
        pricePerMonth: 499,
        description:   'Appear in the forum ad rotation alongside other counsellors.',
        features:      ['Forum sidebar placement', 'Rotation with other Basic ads', 'Your rating & sessions shown', 'Book session button'],
        color:         '#6366f1',
        light:         '#eef2ff',
    },
    {
        key:           'standard',
        name:          'Standard',
        pricePerMonth: 999,
        description:   'Priority placement — you appear more often than Basic ads.',
        features:      ['Priority sidebar placement', 'Seen 2× more than Basic', '✓ Verified badge', 'Specialty tag highlighted'],
        color:         '#0ea5e9',
        light:         '#f0f9ff',
        popular:       true,
    },
    {
        key:           'premium',
        name:          'Premium',
        pricePerMonth: 1999,
        description:   'Fixed top slot — always the first counsellor students see.',
        features:      ['Fixed top slot — always visible', '⭐ Top Rated badge', 'Highlighted card border', 'Impressions & clicks analytics', 'Priority support'],
        color:         '#8b5cf6',
        light:         '#f5f3ff',
    },
];

const STATUS_META = {
    draft:            { cls: 'bg-gray-100   text-gray-600   border-gray-200',   icon: <Edit3   size={13}/>, label: 'Draft'                },
    payment_pending:  { cls: 'bg-purple-100 text-purple-800 border-purple-200', icon: <Clock   size={13}/>, label: 'Awaiting Payment'     },
    payment_received: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock   size={13}/>, label: 'Under Review'         },
    active:           { cls: 'bg-green-100  text-green-800  border-green-200',  icon: <CheckCircle size={13}/>, label: '✅ Live on Forum' },
    paused:           { cls: 'bg-gray-100   text-gray-700   border-gray-200',   icon: <Pause   size={13}/>, label: '⏸ Paused'             },
    rejected:         { cls: 'bg-red-100    text-red-800    border-red-200',    icon: <XCircle size={13}/>, label: '❌ Rejected'          },
    expired:          { cls: 'bg-orange-100 text-orange-800 border-orange-200', icon: <Clock   size={13}/>, label: '⌛ Expired'           },
};

// ─────────────────────────────────────────────────────────────────────────────
//  CASHFREE PAYMENT LAUNCHER  (reuses existing SDK in index.html)
// ─────────────────────────────────────────────────────────────────────────────
const openCashfreeCheckout = (orderData, onSuccess, onFailure) => {
    if (!window.Cashfree) { onFailure(new Error('Cashfree SDK not loaded')); return; }
    const cashfree = window.Cashfree({ mode: orderData.environment === 'production' ? 'production' : 'sandbox' });
    cashfree.checkout({ paymentSessionId: orderData.paymentSessionId, redirectTarget: '_modal' })
        .then(result => {
            if (result.error)          onFailure(new Error(result.error.message || 'Payment failed'));
            else if (result.paymentDetails) onSuccess({ orderId: orderData.orderId, adId: orderData.adId });
        })
        .catch(err => onFailure(new Error(err.message || 'Checkout failed')));
};

// ─────────────────────────────────────────────────────────────────────────────
//  BANK DETAILS SECTION
// ─────────────────────────────────────────────────────────────────────────────
function BankDetailsSection({ token }) {
    const [details,  setDetails]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [editing,  setEditing]  = useState(false);
    const [saving,   setSaving]   = useState(false);
    const [showAcct, setShowAcct] = useState(false);
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState('');
    const [form, setForm] = useState({
        accountHolderName: '', accountNumber: '', ifscCode: '', bankName: '', upiId: '', accountType: 'savings',
    });

    useEffect(() => { fetchDetails(); }, []);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/ads/bank-details`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success && data.data?.hasDetails) {
                setDetails(data.data);
                setForm({ accountHolderName: data.data.accountHolderName || '', accountNumber: '', ifscCode: data.data.ifscCode || '', bankName: data.data.bankName || '', upiId: data.data.upiId || '', accountType: data.data.accountType || 'savings' });
            }
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setError(''); setSaving(true);
        try {
            const res  = await fetch(`${API_BASE}/ads/bank-details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess('Bank details saved! Verification within 1–2 business days.');
            setEditing(false);
            await fetchDetails();
            setTimeout(() => setSuccess(''), 5000);
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    if (loading) return <div className="flex justify-center py-8"><RefreshCw size={20} className="animate-spin text-indigo-400" /></div>;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><Banknote size={20} className="text-green-600" /></div>
                        <div>
                            <h3 className="font-bold text-gray-900">Bank Account for Payouts</h3>
                            <p className="text-xs text-gray-500">Where MindCare sends your session earnings</p>
                        </div>
                    </div>
                    {details?.hasDetails && !editing && (
                        <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-200">
                            <Edit3 size={14} /> Update
                        </button>
                    )}
                </div>
            </div>
            <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 text-sm text-blue-800">
                    <p className="font-semibold mb-2">💳 How payouts work</p>
                    <ol className="space-y-1 list-decimal list-inside text-xs">
                        <li>Student pays session fee via Cashfree → held in MindCare account</li>
                        <li>You mark session as done → student confirms + leaves review</li>
                        <li>MindCare transfers fee to your bank within <strong>3–5 business days</strong></li>
                    </ol>
                </div>
                {success && <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-green-800"><CheckCircle size={16} /> {success}</div>}
                {error   && <div className="bg-red-50    border border-red-200    rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-red-800"><AlertCircle   size={16} /> {error}</div>}

                {details?.hasDetails && !editing ? (
                    <div className="space-y-2.5">
                        {[
                            { label: 'Account Holder', value: details.accountHolderName },
                            { label: 'IFSC Code',      value: details.ifscCode, mono: true },
                            { label: 'Bank',           value: details.bankName },
                            { label: 'UPI ID',         value: details.upiId || 'Not provided', mono: true },
                            { label: 'Account Type',   value: details.accountType, cap: true },
                        ].map(({ label, value, mono, cap }) => (
                            <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-500">{label}</span>
                                <span className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono' : ''} ${cap ? 'capitalize' : ''}`}>{value}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-500">Account Number</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-900">{showAcct ? details.accountNumberMasked : '••••••••' + details.accountNumberMasked?.slice(-4)}</span>
                                <button onClick={() => setShowAcct(p => !p)} className="text-gray-400 hover:text-gray-600">{showAcct ? <EyeOff size={13}/> : <Eye size={13}/>}</button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-500">Verification</span>
                            {details.isVerified
                                ? <span className="flex items-center gap-1.5 text-sm text-green-700 font-medium"><CheckCircle size={13}/> Verified</span>
                                : <span className="text-sm text-amber-600">Pending verification</span>}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">{details?.hasDetails ? 'Update your bank details. Changing details resets verification.' : 'Add your bank account to receive session earnings.'}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'Account Holder Name', key: 'accountHolderName', placeholder: 'As on bank records' },
                                { label: 'Account Number',      key: 'accountNumber',     placeholder: '9–18 digit account number' },
                                { label: 'IFSC Code',           key: 'ifscCode',          placeholder: 'e.g. SBIN0001234', upper: true },
                                { label: 'Bank Name',           key: 'bankName',          placeholder: 'e.g. State Bank of India' },
                                { label: 'UPI ID',              key: 'upiId',             placeholder: 'e.g. yourname@okaxis' },
                            ].map(({ label, key, placeholder, upper }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label} <span className="text-red-400">*</span></label>
                                    <input type="text" value={form[key]} onChange={e => set(key, upper ? e.target.value.toUpperCase() : e.target.value)} placeholder={placeholder}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                                </div>
                            ))}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                                <select value={form.accountType} onChange={e => set('accountType', e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white">
                                    <option value="savings">Savings</option>
                                    <option value="current">Current</option>
                                </select>
                            </div>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                            🔒 Your bank details are stored securely and only used for payout transfers.
                        </div>
                        <div className="flex gap-3">
                            {editing && <button onClick={() => { setEditing(false); setError(''); }} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>}
                            <button onClick={handleSave} disabled={saving}
                                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Banknote size={14} />}
                                {saving ? 'Saving…' : 'Save Bank Details'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
//  AD MANAGEMENT SECTION  — now with real Cashfree payment
// ─────────────────────────────────────────────────────────────────────────────
function AdManagementSection({ token }) {
    const [searchParams] = useSearchParams();
    const [myAd,      setMyAd]      = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [view,      setView]      = useState('status'); // status | create
    const [payState,  setPayState]  = useState('idle');   // idle | creating | paying | verifying | done | failed
    const [toggling,  setToggling]  = useState(false);
    const [error,     setError]     = useState('');
    const [success,   setSuccess]   = useState('');
    const [form, setForm] = useState({ plan: 'basic', tagline: '', ctaText: 'Book a Session', durationMonths: 1 });

    useEffect(() => { fetchMyAd(); }, []);

    // ── Handle return from Cashfree redirect (if used instead of modal) ──────
    useEffect(() => {
        const adOrderId = searchParams.get('ad_order_id');
        const adId      = searchParams.get('ad_id');
        if (adOrderId && adId) {
            handleVerifyPayment(adOrderId, adId);
        }
    }, []);

    const fetchMyAd = async () => {
        setLoading(true);
        try {
            const res  = await fetch(`${API_BASE}/ads/my-ad`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setMyAd(data.data);
        } catch (e) { /* silent */ }
        finally { setLoading(false); }
    };

    // ── STEP 1: Create Cashfree order for ad ─────────────────────────────────
    const handleSubmitAd = async () => {
        if (!form.tagline.trim()) { setError('Tagline is required'); return; }
        setError(''); setPayState('creating');
        try {
            const res  = await fetch(`${API_BASE}/ads/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Dev mode (no Cashfree keys) — skip straight to pending
            if (data.data?.devMode) {
                setSuccess('Ad submitted for review! (Dev mode — no payment required)');
                setPayState('done');
                await fetchMyAd();
                setView('status');
                return;
            }

            // Open Cashfree modal checkout
            setPayState('paying');
            openCashfreeCheckout(
                { ...data.data, adId: data.data.adId, orderId: data.data.orderId },
                async ({ orderId, adId }) => {
                    setPayState('verifying');
                    await handleVerifyPayment(orderId, adId);
                },
                (err) => {
                    if (err.message === 'Payment cancelled by user') {
                        setPayState('idle');
                        setError('Payment cancelled. Your ad has not been submitted.');
                    } else {
                        setError(`Payment failed: ${err.message}`);
                        setPayState('failed');
                    }
                }
            );
        } catch (e) {
            setError(e.message);
            setPayState('idle');
        }
    };

    // ── STEP 2: Verify payment after Cashfree callback ───────────────────────
    const handleVerifyPayment = async (orderId, adId) => {
        setPayState('verifying');
        try {
            const res  = await fetch(`${API_BASE}/ads/verify-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ orderId, adId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess('Payment received! Your ad is now under admin review. You will receive an email once it goes live.');
            setPayState('done');
            await fetchMyAd();
            setView('status');
        } catch (e) {
            setError(`Verification failed: ${e.message}. Please contact support.`);
            setPayState('failed');
        }
    };

    // ── Pause / resume ────────────────────────────────────────────────────────
    const handleToggle = async () => {
        setToggling(true);
        try {
            const res  = await fetch(`${API_BASE}/ads/my-ad/toggle`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMyAd(data.data);
            setSuccess(data.data.status === 'active' ? 'Ad resumed!' : 'Ad paused.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (e) { setError(e.message); }
        finally { setToggling(false); }
    };

    const selectedPlan = AD_PLANS.find(p => p.key === form.plan);
    const totalCost    = (selectedPlan?.pricePerMonth || 0) * form.durationMonths;
    const isPaying     = payState === 'creating' || payState === 'paying' || payState === 'verifying';

    if (loading) return <div className="flex justify-center py-8"><RefreshCw size={20} className="animate-spin text-indigo-400" /></div>;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Megaphone size={20} className="text-indigo-600" /></div>
                        <div>
                            <h3 className="font-bold text-gray-900">Forum Advertisement</h3>
                            <p className="text-xs text-gray-500">Reach students who need your help</p>
                        </div>
                    </div>
                    {myAd && ['active','paused','rejected','expired'].includes(myAd.status) && view === 'status' && (
                        <button onClick={() => setView('create')} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-200">
                            <Edit3 size={14} /> New Ad
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6">
                {success && <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-green-800"><CheckCircle size={16} /> {success}</div>}
                {error   && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-start gap-2 text-sm text-red-800">
                        <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> <span className="flex-1">{error}</span>
                        <button onClick={() => { setError(''); setPayState('idle'); }} className="text-xs underline flex-shrink-0">Dismiss</button>
                    </div>
                )}

                {/* ── Payment progress indicator ── */}
                {isPaying && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4 flex items-center gap-3 text-sm text-indigo-800">
                        <RefreshCw size={16} className="animate-spin flex-shrink-0" />
                        <span>
                            {payState === 'creating'   && 'Setting up your ad and payment order…'}
                            {payState === 'paying'     && 'Cashfree checkout is open — complete your payment…'}
                            {payState === 'verifying'  && 'Verifying payment with Cashfree…'}
                        </span>
                    </div>
                )}

                {/* ── Current ad status view ── */}
                {myAd && view === 'status' && (
                    <div className="space-y-4">
                        {/* Status badge */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${STATUS_META[myAd.status]?.cls}`}>
                                {STATUS_META[myAd.status]?.icon}
                                {STATUS_META[myAd.status]?.label}
                            </span>
                            {myAd.adminNote && myAd.status === 'rejected' && (
                                <span className="text-xs text-red-600 italic">Admin note: {myAd.adminNote}</span>
                            )}
                        </div>

                        {/* Status explanation */}
                        {myAd.status === 'payment_received' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                                ⏳ Payment received (₹{myAd.amountPaid}). Your ad is under admin review and will go live within 24 hours of approval. You'll receive an email notification.
                            </div>
                        )}
                        {myAd.status === 'payment_pending' && (
                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-800">
                                💳 Payment order created but not completed. You can create a new ad to try again.
                            </div>
                        )}
                        {myAd.status === 'rejected' && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                                ❌ Your ad was rejected. A refund of ₹{myAd.amountPaid} has been initiated (5–7 business days). You may edit and resubmit.
                            </div>
                        )}

                        {/* Ad details card */}
                        <div className={`rounded-xl p-4 border ${myAd.status === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ad Details</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-semibold capitalize text-indigo-700">{myAd.plan}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="text-gray-800">{myAd.durationMonths} month{myAd.durationMonths > 1 ? 's' : ''}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold text-green-700">₹{myAd.amountPaid}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Tagline</span><span className="text-gray-800 text-right max-w-xs">{myAd.tagline}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">CTA Button</span><span className="text-gray-800">{myAd.ctaText}</span></div>
                                {myAd.startDate && myAd.endDate && (
                                    <div className="flex justify-between"><span className="text-gray-500">Active until</span><span className="text-gray-800">{new Date(myAd.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                                )}
                            </div>

                            {/* Analytics — shown when active */}
                            {myAd.status === 'active' && (
                                <div className="border-t border-green-200 pt-3 mt-3 grid grid-cols-2 gap-3 text-center">
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-xl font-bold text-indigo-700">{(myAd.impressions || 0).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><TrendingUp size={10}/> Impressions</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-2">
                                        <p className="text-xl font-bold text-green-700">{(myAd.clicks || 0).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1"><MousePointer size={10}/> Clicks</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pause / resume for active ads */}
                        {(myAd.status === 'active' || myAd.status === 'paused') && (
                            <button onClick={handleToggle} disabled={toggling}
                                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border transition-colors ${
                                    myAd.status === 'active' ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
                                }`}>
                                {toggling ? <RefreshCw size={14} className="animate-spin" /> : myAd.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                                {myAd.status === 'active' ? 'Pause Ad' : 'Resume Ad'}
                            </button>
                        )}
                    </div>
                )}

                {/* ── Create / configure ad form ── */}
                {(!myAd || view === 'create') && (
                    <div className="space-y-6">
                        {/* How it works — shown on first-time create */}
                        {!myAd && (
                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
                                <p className="font-semibold mb-2">📋 How forum advertising works</p>
                                <ol className="space-y-1 list-decimal list-inside text-xs">
                                    <li>Choose your plan and customise your ad</li>
                                    <li>Pay securely via Cashfree (UPI, card, net banking)</li>
                                    <li>Admin reviews your ad — usually within 24 hours</li>
                                    <li>Ad goes live on the forum — students can book directly</li>
                                    <li>If rejected, full refund in 5–7 business days</li>
                                </ol>
                            </div>
                        )}

                        {/* Plan selector */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Choose a Plan</label>
                            <div className="space-y-3">
                                {AD_PLANS.map(plan => (
                                    <button key={plan.key} type="button"
                                        onClick={() => setForm(p => ({ ...p, plan: plan.key }))}
                                        className="text-left w-full p-4 rounded-xl border-2 transition-all"
                                        style={{
                                            borderColor:     form.plan === plan.key ? plan.color : '#e5e7eb',
                                            backgroundColor: form.plan === plan.key ? plan.light : '#fff',
                                        }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-gray-900">{plan.name}</span>
                                                {plan.popular && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">POPULAR</span>}
                                            </div>
                                            <span className="font-bold text-sm" style={{ color: plan.color }}>
                                                ₹{plan.pricePerMonth.toLocaleString()}<span className="text-xs font-normal text-gray-400">/mo</span>
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2">{plan.description}</p>
                                        <ul className="space-y-0.5">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className="text-xs text-gray-600 flex items-center gap-1.5">
                                                    <span style={{ color: plan.color }}>✓</span> {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 3, 6, 12].map(m => (
                                    <button key={m} type="button"
                                        onClick={() => setForm(p => ({ ...p, durationMonths: m }))}
                                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${form.durationMonths === m ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-gray-200 text-gray-700 hover:border-indigo-300'}`}>
                                        {m}mo
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tagline */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Your Ad Tagline <span className="text-red-400">*</span>
                            </label>
                            <textarea value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value.slice(0, 120) }))}
                                placeholder="e.g. Specialising in anxiety, stress & exam pressure. Confidential sessions for students."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            <p className="text-xs text-gray-400 text-right mt-1">{form.tagline.length}/120</p>
                        </div>

                        {/* CTA text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                            <input type="text" value={form.ctaText} onChange={e => setForm(p => ({ ...p, ctaText: e.target.value.slice(0, 30) }))}
                                placeholder="Book a Session"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                        </div>

                        {/* Cost summary + pay button */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{selectedPlan?.name} plan × {form.durationMonths} month{form.durationMonths > 1 ? 's' : ''}</p>
                                    <p className="text-xs text-gray-500">₹{selectedPlan?.pricePerMonth}/mo × {form.durationMonths} = ₹{totalCost.toLocaleString()}</p>
                                </div>
                                <p className="text-2xl font-bold text-indigo-700">₹{totalCost.toLocaleString()}</p>
                            </div>
                            <div className="text-xs text-indigo-600 space-y-0.5">
                                <p>✓ Secure payment via Cashfree (UPI, Card, Net Banking)</p>
                                <p>✓ Full refund if admin rejects your ad</p>
                                <p>✓ Ad goes live within 24 hours of approval</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {view === 'create' && myAd && (
                                <button onClick={() => { setView('status'); setError(''); }}
                                    className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                                    Cancel
                                </button>
                            )}
                            <button onClick={handleSubmitAd} disabled={isPaying || !form.tagline.trim()}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                                {isPaying
                                    ? <><RefreshCw size={14} className="animate-spin" /> {payState === 'creating' ? 'Creating order…' : payState === 'verifying' ? 'Verifying…' : 'Processing…'}</>
                                    : <><CreditCard size={14} /> Pay ₹{totalCost.toLocaleString()} & Submit Ad</>
                                }
                            </button>
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
export default function CounsellorSettings() {
    const { token } = useAuth();
    return (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Settings & Monetisation</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your bank account and forum advertisement</p>
            </div>
            <BankDetailsSection  token={token} />
            <AdManagementSection token={token} />
        </div>
    );
}
