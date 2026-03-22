import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

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

export default function Profile() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [verifyStatus,   setVerifyStatus]   = useState(null);
    const [loadingStatus,  setLoadingStatus]  = useState(true);

    // ── Phone update state ──────────────────────────────────────────────────
    const [phoneMode,      setPhoneMode]      = useState("view"); // "view" | "edit" | "saving"
    const [newPhone,       setNewPhone]       = useState("");
    const [phoneError,     setPhoneError]     = useState("");
    const [phoneSaveMsg,   setPhoneSaveMsg]   = useState("");

    // ── Govt ID edit state ──────────────────────────────────────────────────
    const [govtIdMode,     setGovtIdMode]     = useState("view"); // "view" | "edit" | "saving"
    const [govtIdForm,     setGovtIdForm]     = useState({ aadharNumber: "", panNumber: "" });
    const [govtIdErrors,   setGovtIdErrors]   = useState({ aadharNumber: "", panNumber: "" });
    const [govtIdSaveMsg,  setGovtIdSaveMsg]  = useState("");

    useEffect(() => {
        if (!token) return;
        loadVerifyStatus();
    }, [token]);

    const loadVerifyStatus = () => {
        setLoadingStatus(true);
        fetch(`${API_BASE}/verify/status`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
        })
            .then((r) => r.json())
            .then((d) => setVerifyStatus(d.data ?? null))
            .catch(() => setVerifyStatus(null))
            .finally(() => setLoadingStatus(false));
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-500">Loading profile…</p>
            </div>
        );
    }

    const getRoleBadge = (role) => ({
        admin:      "bg-red-100 text-red-700 border-red-200",
        counsellor: "bg-green-100 text-green-700 border-green-200",
        student:    "bg-blue-100 text-blue-700 border-blue-200",
    }[role] || "bg-gray-100 text-gray-700 border-gray-200");

    // ─────────────────────────────────────────────────────────────────────────
    //  PHONE HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    const handlePhoneEdit = () => {
        setNewPhone("");
        setPhoneError("");
        setPhoneSaveMsg("");
        setPhoneMode("edit");
    };

    const handlePhoneSave = async () => {
        const cleaned = newPhone.replace(/[\s\-().]/g, "");
        if (!/^\d{10}$/.test(cleaned)) {
            setPhoneError("Enter a valid 10-digit Indian mobile number.");
            return;
        }
        setPhoneMode("saving");
        setPhoneError("");
        try {
            await apiFetch("/verify/update-phone", {
                method: "PATCH",
                body: JSON.stringify({ phone: cleaned }),
            }, token);
            setPhoneSaveMsg("Phone updated. Please re-verify.");
            setPhoneMode("view");
            loadVerifyStatus(); // refresh verification status
        } catch (err) {
            setPhoneError(err.message);
            setPhoneMode("edit");
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    //  GOVT ID HANDLERS
    // ─────────────────────────────────────────────────────────────────────────
    const handleGovtIdEdit = () => {
        setGovtIdForm({ aadharNumber: "", panNumber: "" });
        setGovtIdErrors({ aadharNumber: "", panNumber: "" });
        setGovtIdSaveMsg("");
        setGovtIdMode("edit");
    };

    const handleGovtIdChange = (e) => {
        const { name, value } = e.target;
        if (name === "panNumber") {
            const upper = value.toUpperCase();
            setGovtIdForm((p) => ({ ...p, panNumber: upper }));
            setGovtIdErrors((p) => ({
                ...p,
                panNumber: upper && !/^[A-Z]{0,5}[0-9]{0,4}[A-Z]{0,1}$/.test(upper) ? "Format: ABCDE1234F" : "",
            }));
            return;
        }
        if (name === "aadharNumber") {
            setGovtIdForm((p) => ({ ...p, aadharNumber: value }));
            setGovtIdErrors((p) => ({
                ...p,
                aadharNumber: value && !/^\d{0,12}$/.test(value) ? "Digits only"
                    : value.length > 0 && value.length !== 12 ? `${value.length}/12 digits` : "",
            }));
            return;
        }
        setGovtIdForm((p) => ({ ...p, [name]: value }));
    };

    const handleGovtIdSave = async () => {
        const { aadharNumber, panNumber } = govtIdForm;
        if (!aadharNumber.trim() && !panNumber.trim()) {
            setGovtIdErrors({ aadharNumber: "", panNumber: "Enter at least one ID." });
            return;
        }
        if (aadharNumber && !/^\d{12}$/.test(aadharNumber.trim())) {
            setGovtIdErrors((p) => ({ ...p, aadharNumber: "Must be exactly 12 digits." }));
            return;
        }
        if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.trim())) {
            setGovtIdErrors((p) => ({ ...p, panNumber: "Format: ABCDE1234F" }));
            return;
        }
        setGovtIdMode("saving");
        try {
            const body = {};
            if (aadharNumber.trim()) body.aadharNumber = aadharNumber.trim();
            if (panNumber.trim())    body.panNumber    = panNumber.trim().toUpperCase();
            await apiFetch("/users/govt-id", {
                method: "PATCH",
                body: JSON.stringify(body),
            }, token);
            setGovtIdSaveMsg("Government ID saved successfully.");
            setGovtIdMode("view");
            loadVerifyStatus();
        } catch (err) {
            setGovtIdErrors((p) => ({ ...p, panNumber: err.message }));
            setGovtIdMode("edit");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto space-y-5">

                {/* ── Cover + Avatar ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-red-400">
                        {user.coverImage && <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover" />}
                    </div>
                    <div className="px-6 pb-6 relative">
                        <div className="flex items-end justify-between">
                            <div className="-mt-10">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.fullName}
                                        className="w-20 h-20 rounded-full border-4 border-white object-cover shadow" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full border-4 border-white bg-purple-500 flex items-center justify-center shadow">
                                        <span className="text-white text-2xl font-bold">{user.fullName?.[0]?.toUpperCase() ?? "U"}</span>
                                    </div>
                                )}
                            </div>
                            {verifyStatus?.isVerified && (
                                <span className="mt-2 inline-flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1 rounded-full">
                                    ✓ Identity Verified
                                </span>
                            )}
                        </div>
                        <div className="mt-3">
                            <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border capitalize ${getRoleBadge(user.role)}`}>
                                    {user.role}
                                </span>
                                {user.authProvider === "google" && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200 flex items-center gap-1">
                                        <svg width="10" height="10" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                                        Google account
                                    </span>
                                )}
                                {user.isApproved === false && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-100 text-amber-700 border-amber-200">
                                        Pending Approval
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Account Details ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">Account Details</h2>
                    <div className="space-y-3">
                        <DetailRow label="Full Name"  value={user.fullName} />
                        <DetailRow label="Email"      value={user.email} />
                        <DetailRow label="Username"   value={`@${user.username}`} />
                        {user.institution && <DetailRow label="Institution" value={user.institution} />}
                        {user.dob && (
                            <DetailRow label="Date of Birth"
                                value={new Date(user.dob).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} />
                        )}
                    </div>
                </div>

                {/* ── Phone Number ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-800">Mobile Number</h2>
                        {phoneMode === "view" && (
                            <button onClick={handlePhoneEdit}
                                className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors">
                                {verifyStatus?.hasPhone ? "Change Number" : "Add Number"}
                            </button>
                        )}
                    </div>

                    {phoneMode === "view" && (
                        <div className="space-y-2">
                            {verifyStatus?.hasPhone ? (
                                <div className="flex items-center justify-between">
                                    <span className="font-mono text-gray-800">{verifyStatus.phoneMasked}</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                        verifyStatus.phoneVerified
                                            ? "bg-green-100 text-green-700"
                                            : "bg-amber-100 text-amber-700"
                                    }`}>
                                        {verifyStatus.phoneVerified ? "✓ Verified" : "Not verified"}
                                    </span>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No phone number added yet.</p>
                            )}
                            {/* Show reverify button if phone exists but not verified */}
                            {verifyStatus?.hasPhone && !verifyStatus?.phoneVerified && (
                                <Link to="/verify-identity"
                                    className="inline-block text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors mt-2">
                                    Verify Now →
                                </Link>
                            )}
                            {/* Show reverify button if number was changed (verified=false after update) */}
                            {verifyStatus?.hasPhone && verifyStatus?.phoneVerified === false && phoneSaveMsg && (
                                <Link to="/verify-identity"
                                    className="inline-block text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors mt-2">
                                    Re-verify New Number →
                                </Link>
                            )}
                            {phoneSaveMsg && <p className="text-xs text-amber-600 mt-1">{phoneSaveMsg}</p>}
                        </div>
                    )}

                    {(phoneMode === "edit" || phoneMode === "saving") && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500">
                                Enter your new 10-digit mobile number. Your current verification will be reset and you'll need to re-verify.
                            </p>
                            <div className="flex gap-2">
                                <span className="inline-flex items-center px-3 border-2 border-gray-300 rounded-l-lg bg-gray-100 text-gray-600 text-sm">+91</span>
                                <input
                                    type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder="10-digit number" maxLength={10} inputMode="numeric"
                                    className="flex-1 text-sm border-2 border-gray-300 rounded-r-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                                    disabled={phoneMode === "saving"}
                                />
                            </div>
                            {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
                            <div className="flex gap-2">
                                <button onClick={handlePhoneSave} disabled={phoneMode === "saving" || newPhone.length !== 10}
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                                    {phoneMode === "saving" ? "Saving…" : "Save Number"}
                                </button>
                                <button onClick={() => setPhoneMode("view")} disabled={phoneMode === "saving"}
                                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Government ID ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-800">Government ID</h2>
                        {govtIdMode === "view" && (
                            <button onClick={handleGovtIdEdit}
                                className="text-xs text-purple-600 hover:text-purple-700 font-medium border border-purple-200 px-3 py-1 rounded-lg hover:bg-purple-50 transition-colors">
                                {verifyStatus?.hasAadhar || verifyStatus?.hasPan ? "Update IDs" : "Add IDs"}
                            </button>
                        )}
                    </div>

                    {govtIdMode === "view" && (
                        <div className="space-y-3">
                            <GovtIdRow label="Aadhar" has={verifyStatus?.hasAadhar} masked={verifyStatus?.aadharMasked} />
                            <GovtIdRow label="PAN"    has={verifyStatus?.hasPan}    masked={verifyStatus?.panMasked} />
                            {govtIdSaveMsg && <p className="text-xs text-green-600">{govtIdSaveMsg}</p>}
                            <p className="text-xs text-gray-400 pt-1">
                                🔒 ID numbers are stored encrypted and only shown in masked form.
                            </p>
                        </div>
                    )}

                    {(govtIdMode === "edit" || govtIdMode === "saving") && (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-500">
                                Enter or update your government ID numbers. Changing IDs will reset your verification status.
                            </p>

                            {/* Aadhar */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Card Number</label>
                                <input type="text" name="aadharNumber" value={govtIdForm.aadharNumber}
                                    onChange={handleGovtIdChange} placeholder="12-digit Aadhar number"
                                    maxLength={12} inputMode="numeric" disabled={govtIdMode === "saving"}
                                    className={`w-full text-sm border-2 rounded-lg px-3 py-2 focus:outline-none ${
                                        govtIdErrors.aadharNumber ? "border-amber-400" :
                                        govtIdForm.aadharNumber.length === 12 ? "border-green-400" : "border-gray-300 focus:border-purple-500"
                                    }`} />
                                {govtIdErrors.aadharNumber && <p className="text-xs text-amber-600 mt-1">{govtIdErrors.aadharNumber}</p>}
                                {govtIdForm.aadharNumber.length === 12 && <p className="text-xs text-green-600 mt-1">✓ Valid format</p>}
                            </div>

                            {/* PAN */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card Number</label>
                                <input type="text" name="panNumber" value={govtIdForm.panNumber}
                                    onChange={handleGovtIdChange} placeholder="e.g. ABCDE1234F"
                                    maxLength={10} disabled={govtIdMode === "saving"}
                                    className={`w-full text-sm border-2 rounded-lg px-3 py-2 focus:outline-none uppercase ${
                                        govtIdErrors.panNumber && govtIdForm.panNumber.length > 0 ? "border-amber-400" :
                                        govtIdForm.panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(govtIdForm.panNumber) ? "border-green-400" :
                                        "border-gray-300 focus:border-purple-500"
                                    }`} />
                                {govtIdErrors.panNumber && <p className="text-xs text-amber-600 mt-1">{govtIdErrors.panNumber}</p>}
                                {govtIdForm.panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(govtIdForm.panNumber) && (
                                    <p className="text-xs text-green-600 mt-1">✓ Valid format</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">5 letters · 4 digits · 1 letter</p>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={handleGovtIdSave}
                                    disabled={govtIdMode === "saving" || (!govtIdForm.aadharNumber.trim() && !govtIdForm.panNumber.trim())}
                                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                                    {govtIdMode === "saving" ? "Saving…" : "Save IDs"}
                                </button>
                                <button onClick={() => setGovtIdMode("view")} disabled={govtIdMode === "saving"}
                                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Identity Verification Status ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-800">Identity Verification</h2>
                        {!loadingStatus && !verifyStatus?.isVerified && (
                            <Link to="/verify-identity"
                                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                                Verify Now →
                            </Link>
                        )}
                    </div>
                    {loadingStatus ? (
                        <p className="text-sm text-gray-400">Loading…</p>
                    ) : verifyStatus ? (
                        <div className="space-y-3">
                            <VerifyRow label="Phone"  done={verifyStatus.phoneVerified} value={verifyStatus.phoneMasked} />
                            <VerifyRow label="Aadhar" done={verifyStatus.hasAadhar}     value={verifyStatus.aadharMasked} />
                            <VerifyRow label="PAN"    done={verifyStatus.hasPan}        value={verifyStatus.panMasked} />
                            {verifyStatus.isVerified && verifyStatus.verifiedAt && (
                                <p className="text-xs text-green-600 pt-1">
                                    ✓ Verified on {new Date(verifyStatus.verifiedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">Could not load verification status.</p>
                    )}
                </div>

                {/* ── Quick Links ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Links</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {user.role === "student"    && <QuickLink to="/booking"              label="📅 Book Session" />}
                        {user.role === "student"    && <QuickLink to="/all-bookings"         label="📋 My Bookings" />}
                        {user.role === "counsellor" && <QuickLink to="/counsellorDashboard"  label="🩺 My Sessions" />}
                        {user.role === "admin"      && <QuickLink to="/dashboard"            label="🔐 Admin Dashboard" />}
                        <QuickLink to="/screening"      label="🧪 Screening" />
                        <QuickLink to="/verify-identity" label="🪪 Verify Identity" />
                    </div>
                </div>

                {/* ── Sign Out ── */}
                <div className="pb-6">
                    <button
                        onClick={() => { logout(); localStorage.clear(); navigate("/"); }}
                        className="w-full py-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-sm">
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
        </div>
    );
}

function VerifyRow({ label, done, value }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs text-gray-400 font-mono">{value}</span>}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {done ? "✓ done" : "not added"}
                </span>
            </div>
        </div>
    );
}

function GovtIdRow({ label, has, masked }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <div className="flex items-center gap-2">
                {masked && <span className="text-xs text-gray-400 font-mono">{masked}</span>}
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${has ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}>
                    {has ? "✓ added" : "not added"}
                </span>
            </div>
        </div>
    );
}

function QuickLink({ to, label }) {
    return (
        <Link to={to}
            className="flex items-center justify-center p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-200 rounded-xl text-sm text-gray-700 hover:text-purple-700 font-medium transition-colors">
            {label}
        </Link>
    );
}
