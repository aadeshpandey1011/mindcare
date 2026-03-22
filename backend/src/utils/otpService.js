import twilio from "twilio";

// ── Twilio Verify client — lazy init ───────────────────────────────────────
let twilioClient = null;

const getClient = () => {
    if (!twilioClient) {
        const sid  = process.env.TWILIO_ACCOUNT_SID;
        const auth = process.env.TWILIO_AUTH_TOKEN;
        if (!sid || !auth) {
            throw new Error("TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing in .env");
        }
        twilioClient = twilio(sid, auth);
    }
    return twilioClient;
};

const getServiceSid = () => {
    const sid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!sid) throw new Error("TWILIO_VERIFY_SERVICE_SID missing in .env");
    return sid;
};

// ── Normalise Indian phone numbers to E.164 (+91XXXXXXXXXX) ───────────────
export const normalisePhone = (raw) => {
    let phone = String(raw).replace(/[\s\-().]/g, "");
    if (/^\d{10}$/.test(phone))      return "+91" + phone;
    if (/^0\d{10}$/.test(phone))     return "+91" + phone.slice(1);
    if (/^91\d{10}$/.test(phone))    return "+"   + phone;
    if (/^\+91\d{10}$/.test(phone))  return phone;
    return phone.startsWith("+") ? phone : "+" + phone;
};

// ── Send OTP via Twilio Verify (no phone number needed on your account) ───
export const sendOtpSms = async (toPhone) => {
    const to = normalisePhone(toPhone);
    const verification = await getClient()
        .verify.v2.services(getServiceSid())
        .verifications.create({ to, channel: "sms" });
    return { status: verification.status, to };
};

// ── Verify OTP code submitted by user ────────────────────────────────────
export const verifyOtpCode = async (toPhone, code) => {
    const to = normalisePhone(toPhone);
    const result = await getClient()
        .verify.v2.services(getServiceSid())
        .verificationChecks.create({ to, code: String(code) });
    // result.status === "approved" means correct
    return result.status === "approved";
};

// ── Masked phone helper ───────────────────────────────────────────────────
export const maskPhone = (phone) => {
    if (!phone) return null;
    const normalised = normalisePhone(phone);
    return normalised.replace(/(\+\d{2})\d{6}(\d{4})/, "$1******$2");
};
