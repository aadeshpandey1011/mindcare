import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// ── helper ────────────────────────────────────────────────────────────────────
const apiFetch = async (path, options, token) => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options?.headers ?? {}),
        },
        credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
};

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = { STATUS: 0, SEND_OTP: 1, VERIFY_OTP: 2, DONE: 3 };

export default function VerifyIdentity() {
    const { token } = useAuth();
    const navigate  = useNavigate();

    const [step,         setStep]         = useState(STEPS.STATUS);
    const [status,       setStatus]       = useState(null);   // verification status from API
    const [loading,      setLoading]      = useState(true);
    const [actionLoading,setActionLoading]= useState(false);
    const [otp,          setOtp]          = useState("");
    const [message,      setMessage]      = useState({ text: "", type: "" });
    const [countdown,    setCountdown]    = useState(0);      // resend cooldown

    // ── Load current verification status on mount ─────────────────────────────
    useEffect(() => {
        loadStatus();
    }, []);

    // ── Countdown ticker for resend cooldown ──────────────────────────────────
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setInterval(() => setCountdown((c) => c - 1), 1000);
        return () => clearInterval(t);
    }, [countdown]);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/verify/status", {}, token);
            setStatus(data.data);
            // If already verified, jump to done
            if (data.data?.isVerified) {
                setStep(STEPS.DONE);
            } else if (!data.data?.hasPhone) {
                // No phone — user needs to add one first
                setStep(STEPS.SEND_OTP);
            } else {
                setStep(STEPS.SEND_OTP);
            }
        } catch (err) {
            showMsg(err.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (text, type = "info") => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: "", type: "" }), 6000);
    };

    // ── Send OTP ──────────────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        setActionLoading(true);
        try {
            const data = await apiFetch("/verify/send-otp", { method: "POST" }, token);
            showMsg(data.message, "success");
            setStep(STEPS.VERIFY_OTP);
            setCountdown(60); // 60s cooldown before resend
        } catch (err) {
            showMsg(err.message, "error");
        } finally {
            setActionLoading(false);
        }
    };

    // ── Verify OTP ────────────────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            showMsg("Please enter the 6-digit OTP.", "error");
            return;
        }
        setActionLoading(true);
        try {
            const data = await apiFetch(
                "/verify/verify-otp",
                { method: "POST", body: JSON.stringify({ otp }) },
                token
            );
            showMsg(data.message, "success");
            setStep(STEPS.DONE);
            setStatus((prev) => ({ ...prev, isVerified: true, phoneVerified: true }));
        } catch (err) {
            showMsg(err.message, "error");
            setOtp("");
        } finally {
            setActionLoading(false);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  RENDER
    // ─────────────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Checking verification status…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-start justify-center">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-8 text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-3xl">🪪</span>
                        </div>
                        <h1 className="text-xl font-bold">Identity Verification</h1>
                        <p className="text-purple-100 text-sm mt-1">
                            Verify your phone number to confirm your identity
                        </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex border-b border-gray-100">
                        {["Govt ID", "Send OTP", "Verify", "Done"].map((label, i) => (
                            <div
                                key={label}
                                className={`flex-1 py-3 text-center text-xs font-medium transition-colors ${
                                    step === i
                                        ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50"
                                        : step > i
                                        ? "text-green-600 bg-green-50"
                                        : "text-gray-400"
                                }`}
                            >
                                {step > i ? "✓ " : ""}{label}
                            </div>
                        ))}
                    </div>

                    <div className="p-6">
                        {/* Message banner */}
                        {message.text && (
                            <div
                                className={`mb-4 p-3 rounded-lg text-sm text-center ${
                                    message.type === "success"
                                        ? "bg-green-100 text-green-700"
                                        : message.type === "error"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                }`}
                            >
                                {message.text}
                            </div>
                        )}

                        {/* ── Step 0: Status / Govt ID summary ────────────────── */}
                        {step === STEPS.STATUS && status && (
                            <div className="space-y-3">
                                <StatusRow label="Aadhar" has={status.hasAadhar} masked={status.aadharMasked} />
                                <StatusRow label="PAN"    has={status.hasPan}    masked={status.panMasked}    />
                                <StatusRow label="Phone"  has={status.hasPhone}  masked={status.phoneMasked}  />
                                <button
                                    onClick={() => setStep(STEPS.SEND_OTP)}
                                    className="w-full mt-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Continue to Phone Verification →
                                </button>
                            </div>
                        )}

                        {/* ── Step 1: Send OTP ─────────────────────────────────── */}
                        {step === STEPS.SEND_OTP && (
                            <div className="space-y-4">
                                {status?.hasPhone ? (
                                    <div className="bg-gray-50 rounded-lg p-4 text-sm">
                                        <p className="text-gray-600 mb-1">OTP will be sent to your registered mobile:</p>
                                        <p className="font-mono font-semibold text-gray-900 text-base">
                                            {status.phoneMasked ?? "****"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                                        You haven't added a phone number yet. Please update your profile to add one, then come back.
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                                    A 6-digit OTP will be sent via SMS. It is valid for 10 minutes.
                                </div>

                                <button
                                    onClick={handleSendOtp}
                                    disabled={actionLoading || !status?.hasPhone}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Sending…</>
                                    ) : (
                                        "Send OTP via SMS"
                                    )}
                                </button>

                                <button
                                    onClick={() => navigate("/profile")}
                                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                                >
                                    ← Update profile first
                                </button>
                            </div>
                        )}

                        {/* ── Step 2: Verify OTP ───────────────────────────────── */}
                        {step === STEPS.VERIFY_OTP && (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Enter the 6-digit code sent to</p>
                                    <p className="font-mono font-bold text-gray-900 mt-1">
                                        {status?.phoneMasked ?? "your phone"}
                                    </p>
                                </div>

                                {/* OTP input — large digits */}
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    placeholder="• • • • • •"
                                    className="w-full text-center text-3xl tracking-[0.4em] font-mono border-2 border-gray-300 rounded-xl py-4 focus:border-purple-500 focus:outline-none"
                                />

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={actionLoading || otp.length !== 6}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? (
                                        <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Verifying…</>
                                    ) : (
                                        "Verify OTP"
                                    )}
                                </button>

                                {/* Resend */}
                                <div className="text-center text-sm">
                                    {countdown > 0 ? (
                                        <span className="text-gray-400">Resend OTP in {countdown}s</span>
                                    ) : (
                                        <button
                                            onClick={handleSendOtp}
                                            disabled={actionLoading}
                                            className="text-purple-600 hover:underline disabled:opacity-50"
                                        >
                                            Resend OTP
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => { setStep(STEPS.SEND_OTP); setOtp(""); }}
                                    className="w-full py-2 text-sm text-gray-400 hover:text-gray-600"
                                >
                                    ← Back
                                </button>
                            </div>
                        )}

                        {/* ── Step 3: Done ─────────────────────────────────────── */}
                        {step === STEPS.DONE && (
                            <div className="text-center space-y-4 py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-4xl">✅</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Identity Verified</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Your phone number is confirmed and your identity is verified.
                                    </p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                                    A green "Verified" badge will now appear on your profile.
                                </div>
                                <button
                                    onClick={() => navigate("/profile")}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
                                >
                                    Go to Profile
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info footer */}
                <p className="text-xs text-gray-400 text-center mt-4">
                    🔒 Your data is encrypted. OTPs expire after 10 minutes and are never stored in plain text.
                </p>
            </div>
        </div>
    );
}

function StatusRow({ label, has, masked }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {has ? (
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono">{masked ?? "added"}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ added</span>
                </div>
            ) : (
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">not added</span>
            )}
        </div>
    );
}
