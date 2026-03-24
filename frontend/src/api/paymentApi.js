import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
    withCredentials: true,
});

const authHeader = () => {
    const token = localStorage.getItem('dpi_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ─────────────────────────────────────────────────────────────────────────────
//  PAYMENT FLOW
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 1 — Create a Cashfree order for a booking.
 * Returns: { paymentSessionId, cfOrderId, orderId, amount, appId, bookingId, feeRupees, environment }
 * If feeRupees === 0 returns: { free: true, bookingId, bookingStatus: "pending" }
 */
export const createPaymentOrder = (bookingId) =>
    API.post('/payments/create-order', { bookingId }, { headers: authHeader() });

/**
 * Step 2 — After Cashfree redirects back, verify the payment.
 * Body: { orderId, bookingId }
 */
export const verifyPayment = (data) =>
    API.post('/payments/verify', data, { headers: authHeader() });

/**
 * Initiate a refund for a booking.
 */
export const initiateRefund = (bookingId, reason) =>
    API.post(`/payments/refund/${bookingId}`, { reason }, { headers: authHeader() });

// ─────────────────────────────────────────────────────────────────────────────
//  HISTORY & STATS
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentHistory = (page = 1, limit = 10) =>
    API.get(`/payments/history?page=${page}&limit=${limit}`, { headers: authHeader() });

export const getPaymentStats = () =>
    API.get('/payments/stats', { headers: authHeader() });

// ─────────────────────────────────────────────────────────────────────────────
//  AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────
export const getAuditLogs = (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    return API.get(`/payments/audit?${q}`, { headers: authHeader() });
};

export const getMyAuditLogs = (page = 1, limit = 10) =>
    API.get(`/payments/my-audit?page=${page}&limit=${limit}`, { headers: authHeader() });

// ─────────────────────────────────────────────────────────────────────────────
//  CASHFREE CHECKOUT LAUNCHER
//  Requires Cashfree JS SDK loaded in index.html
//  Docs: https://docs.cashfree.com/docs/web-integration
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opens the Cashfree Drop-in checkout.
 *
 * @param {object}   orderData  — from createPaymentOrder response
 * @param {function} onSuccess  — ({ orderId, bookingId }) => void
 * @param {function} onFailure  — (error) => void
 */
export const openCashfreeCheckout = (orderData, onSuccess, onFailure) => {
    if (!window.Cashfree) {
        onFailure(new Error('Cashfree SDK not loaded'));
        return;
    }

    const cashfree = window.Cashfree({
        mode: orderData.environment === 'production' ? 'production' : 'sandbox',
    });

    const checkoutOptions = {
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget:   '_modal', // opens as modal overlay — no page redirect
    };

    cashfree.checkout(checkoutOptions).then(result => {
        if (result.error) {
            onFailure(new Error(result.error.message || 'Payment failed'));
        } else if (result.redirect) {
            // Payment is processing — verify on return_url page
            console.log('[Cashfree] Redirecting to payment page...');
        } else if (result.paymentDetails) {
            onSuccess({
                orderId:   orderData.orderId,
                bookingId: orderData.bookingId,
                ...result.paymentDetails,
            });
        }
    }).catch(err => {
        onFailure(new Error(err.message || 'Checkout failed'));
    });
};

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export const formatRupees  = (amount) => `₹${Number(amount).toFixed(2)}`;

export const paymentStatusColor = (status) => ({
    pending:  'bg-yellow-100 text-yellow-800',
    success:  'bg-green-100  text-green-800',
    failed:   'bg-red-100    text-red-800',
    refunded: 'bg-blue-100   text-blue-800',
}[status] || 'bg-gray-100 text-gray-800');

export const auditActionLabel = (action) => ({
    USER_REGISTERED:       'Registered',
    USER_LOGIN:            'Logged in',
    USER_LOGOUT:           'Logged out',
    USER_LOGIN_FAILED:     'Login failed',
    BOOKING_INITIATED:     'Booking created',
    BOOKING_CONFIRMED:     'Session confirmed',
    BOOKING_REJECTED:      'Session rejected',
    BOOKING_CANCELLED:     'Booking cancelled',
    SESSION_COMPLETED:     'Session completed',
    PAYMENT_ORDER_CREATED: 'Payment order created',
    PAYMENT_SUCCESS:       'Payment successful',
    PAYMENT_FAILED:        'Payment failed',
    PAYMENT_WEBHOOK:       'Webhook received',
    REFUND_INITIATED:      'Refund initiated',
    REFUND_SUCCESS:        'Refund completed',
    SCREENING_SUBMITTED:   'Screening submitted',
    COUNSELLOR_APPROVED:   'Counsellor approved',
    COUNSELLOR_REJECTED:   'Counsellor rejected',
}[action] || action);
