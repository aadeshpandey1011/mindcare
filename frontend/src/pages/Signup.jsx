import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const SPECIALIZATIONS = [
  "Anxiety & Stress Management",
  "Depression & Mood Disorders",
  "Trauma & PTSD",
  "Relationship & Family Counselling",
  "Career & Academic Counselling",
  "Substance Abuse & Addiction",
  "Sleep Disorders",
  "Child & Adolescent Counselling",
  "Grief & Loss",
  "CBT (Cognitive Behavioural Therapy)",
  "Mindfulness & Wellness",
  "General Counselling",
];

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName:        "",
    email:           "",
    username:        "",
    password:        "",
    confirmPassword: "",
    role:            "student",
    institution:     "",
    specialization:  "",
    phone:           "",
    dob:             "",
    aadharNumber:    "",
    panNumber:       "",
  });

  const [files,    setFiles]    = useState({ avatar: null, coverImage: null });
  const [previews, setPreviews] = useState({ avatar: null, coverImage: null });
  const [loading,  setLoading]  = useState(false);
  const [message,  setMessage]  = useState("");
  const [msgType,  setMsgType]  = useState("");
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [govtIdErrors, setGovtIdErrors] = useState({ aadharNumber: "", panNumber: "" });

  const isCounsellor = form.role === "counsellor";

  const computedAge = (() => {
    if (!form.dob) return null;
    const birth = new Date(form.dob);
    if (isNaN(birth.getTime())) return null;
    return Math.floor((Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  })();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "panNumber") {
      const upper = value.toUpperCase();
      setForm((p) => ({ ...p, panNumber: upper }));
      setGovtIdErrors((p) => ({
        ...p,
        panNumber: upper && !/^[A-Z]{0,5}[0-9]{0,4}[A-Z]{0,1}$/.test(upper) ? "Format: ABCDE1234F" : "",
      }));
      return;
    }

    if (name === "aadharNumber") {
      setForm((p) => ({ ...p, aadharNumber: value }));
      setGovtIdErrors((p) => ({
        ...p,
        aadharNumber:
          value && !/^\d{0,12}$/.test(value)
            ? "Only digits allowed"
            : value.length > 0 && value.length !== 12
            ? `${value.length}/12 digits`
            : "",
      }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: sel } = e.target;
    const file = sel[0];
    if (file) {
      setFiles((p) => ({ ...p, [name]: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((p) => ({ ...p, [name]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const showMsg = (msg, type) => {
    setMessage(msg); setMsgType(type);
    setTimeout(() => { setMessage(""); setMsgType(""); }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Validation ────────────────────────────────────────────────────────────
    if (!form.fullName || !form.email || !form.username || !form.password) {
      showMsg("All required fields must be filled.", "error"); return;
    }
    if (form.password !== form.confirmPassword) { showMsg("Passwords do not match.", "error"); return; }
    if (!files.avatar) { showMsg("Profile picture is required.", "error"); return; }
    if (form.username.includes(" ")) { showMsg("Username cannot contain spaces.", "error"); return; }

    // Counsellor must pick a specialization
    if (isCounsellor && !form.specialization.trim()) {
      showMsg("Specialization is required for counsellors.", "error"); return;
    }

    if (form.phone) {
      const cleaned = form.phone.replace(/[\s\-().]/g, "");
      if (!/^\d{10}$/.test(cleaned)) { showMsg("Phone must be a 10-digit Indian mobile number.", "error"); return; }
    }
    if (form.dob && (computedAge === null || computedAge < 5 || computedAge > 100)) {
      showMsg("Please enter a valid date of birth (age 5–100).", "error"); return;
    }
    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber)) {
      showMsg("Aadhar number must be exactly 12 digits.", "error"); return;
    }
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)) {
      showMsg("PAN must be in the format ABCDE1234F.", "error"); return;
    }

    // ── Build FormData ────────────────────────────────────────────────────────
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("fullName",  form.fullName);
      fd.append("email",     form.email);
      fd.append("username",  form.username.toLowerCase());
      fd.append("password",  form.password);
      fd.append("role",      form.role);
      if (form.institution.trim())   fd.append("institution",   form.institution.trim());
      if (form.specialization.trim()) fd.append("specialization", form.specialization.trim());
      if (form.phone.trim())         fd.append("phone",         form.phone.trim().replace(/[\s\-().]/g, ""));
      if (form.dob)                  fd.append("dob",           form.dob);
      fd.append("avatar", files.avatar);
      if (files.coverImage)          fd.append("coverImage",    files.coverImage);
      if (form.aadharNumber.trim())  fd.append("aadharNumber",  form.aadharNumber.trim());
      if (form.panNumber.trim())     fd.append("panNumber",     form.panNumber.trim().toUpperCase());

      const res  = await fetch(`${API_BASE}/users/register`, { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      showMsg(
        form.role === "student"
          ? "Account created! You can now log in."
          : "Account created! Please wait for admin approval before logging in.",
        form.role === "student" ? "success" : "info"
      );
      setTimeout(() => navigate("/login"), 2000);

      setForm({ fullName:"", email:"", username:"", password:"", confirmPassword:"",
                role:"student", institution:"", specialization:"", phone:"", dob:"",
                aadharNumber:"", panNumber:"" });
      setFiles({ avatar:null, coverImage:null });
      setPreviews({ avatar:null, coverImage:null });
      setGovtIdErrors({ aadharNumber:"", panNumber:"" });
    } catch (err) {
      showMsg(err.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Password eye icon ─────────────────────────────────────────────────────
  const EyeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
  const EyeOffIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[90%] md:w-[55%] lg:w-[45%] max-w-2xl bg-white rounded-xl shadow-xl p-8">

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">MC</div>
          <h1 className="text-3xl font-bold text-gray-800">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join MindCare — Mental Health Platform</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center font-medium ${
            msgType === "success" ? "bg-green-100 text-green-700 border border-green-200" :
            msgType === "error"   ? "bg-red-100   text-red-700   border border-red-200"   :
                                    "bg-blue-100  text-blue-700  border border-blue-200"
          }`}>{message}</div>
        )}

        <div className="space-y-5">

          {/* ── Personal Information ───────────────────────────────────────── */}
          <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                <input type="text" name="username" value={form.username} onChange={handleChange}
                  placeholder="Unique username (no spaces)"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input type="text" name="institution" value={form.institution} onChange={handleChange}
                  placeholder="School / College / Organization"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 rounded-l-lg bg-gray-100 text-gray-600 text-sm">+91</span>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="10-digit number" maxLength={10} inputMode="numeric"
                    className="w-full text-sm border border-gray-300 rounded-r-lg px-3 py-2.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none" />
                {computedAge !== null && computedAge >= 5 && computedAge <= 100 && (
                  <p className="text-xs text-green-600 mt-1">Age: {computedAge} years</p>
                )}
              </div>
            </div>
          </section>

          {/* ── Account & Role ─────────────────────────────────────────────── */}
          <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Account & Role</h3>

            {/* Role selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">I am registering as <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "student",   label: "Student",    icon: "🎓", desc: "Book sessions & get support" },
                  { value: "counsellor", label: "Counsellor", icon: "🩺", desc: "Provide counselling sessions" },
                ].map(({ value, label, icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, role: value, specialization: "" }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      form.role === value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${form.role === value ? "text-indigo-700" : "text-gray-700"}`}>{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {isCounsellor && (
                <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-amber-500 mt-0.5">⚠️</span>
                  <p className="text-xs text-amber-700">Counsellor accounts require admin approval before you can log in.</p>
                </div>
              )}
            </div>

            {/* Specialization — only shown for counsellors */}
            {isCounsellor && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  className={`w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 bg-white ${
                    !form.specialization
                      ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                      : "border-green-400 focus:border-indigo-400 focus:ring-indigo-300"
                  }`}
                >
                  <option value="">— Select your specialization —</option>
                  {SPECIALIZATIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {!form.specialization && (
                  <p className="text-xs text-red-500 mt-1">Required for counsellor registration</p>
                )}
                {form.specialization && (
                  <p className="text-xs text-green-600 mt-1">✓ {form.specialization} selected</p>
                )}
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
                    placeholder="Create a strong password"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 focus:outline-none" />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                    placeholder="Repeat your password"
                    className={`w-full text-sm border rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-1 ${
                      form.confirmPassword && form.confirmPassword !== form.password
                        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                        : "border-gray-300 focus:border-indigo-400 focus:ring-indigo-300"
                    }`} />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <p className="text-xs text-green-600 mt-1">✓ Passwords match</p>
                )}
              </div>
            </div>
          </section>

          {/* ── Government ID (Optional) ───────────────────────────────────── */}
          <section className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
            <div className="flex items-start gap-2 mb-4">
              <span className="text-blue-600 text-lg">🪪</span>
              <div>
                <h3 className="text-base font-semibold text-gray-700">Government ID <span className="text-sm font-normal text-gray-500">(Optional)</span></h3>
                <p className="text-xs text-gray-500 mt-0.5">Stored encrypted. Shown only in masked form. Can be added from your profile later.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                <input type="text" name="aadharNumber" value={form.aadharNumber} onChange={handleChange}
                  placeholder="12-digit Aadhar number" maxLength={12} inputMode="numeric"
                  className={`w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none ${
                    govtIdErrors.aadharNumber && form.aadharNumber.length !== 12 ? "border-amber-400" :
                    form.aadharNumber.length === 12 ? "border-green-400" : "border-gray-300 focus:border-blue-400"
                  }`} />
                {govtIdErrors.aadharNumber && <p className="text-xs text-amber-600 mt-1">{govtIdErrors.aadharNumber}</p>}
                {form.aadharNumber.length === 12 && <p className="text-xs text-green-600 mt-1">✓ Valid format</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input type="text" name="panNumber" value={form.panNumber} onChange={handleChange}
                  placeholder="ABCDE1234F" maxLength={10}
                  className={`w-full text-sm border rounded-lg px-3 py-2.5 focus:outline-none uppercase ${
                    govtIdErrors.panNumber ? "border-amber-400" :
                    form.panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber) ? "border-green-400" :
                    "border-gray-300 focus:border-blue-400"
                  }`} />
                {govtIdErrors.panNumber && <p className="text-xs text-amber-600 mt-1">{govtIdErrors.panNumber}</p>}
                {form.panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber) && (
                  <p className="text-xs text-green-600 mt-1">✓ Valid format</p>
                )}
              </div>
            </div>
          </section>

          {/* ── Profile Images ─────────────────────────────────────────────── */}
          <section className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-base font-semibold text-gray-700 mb-4">Profile Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture <span className="text-red-500">*</span></label>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-2 overflow-hidden bg-white">
                    {previews.avatar
                      ? <img src={previews.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      : <span className="text-gray-400 text-xs text-center px-2">Upload Avatar</span>}
                  </div>
                  <input type="file" name="avatar" accept="image/*" onChange={handleFileChange} className="text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2 overflow-hidden bg-white">
                    {previews.coverImage
                      ? <img src={previews.coverImage} alt="Cover" className="w-full h-full object-cover" />
                      : <span className="text-gray-400 text-xs text-center px-2">Upload Cover</span>}
                  </div>
                  <input type="file" name="coverImage" accept="image/*" onChange={handleFileChange} className="text-xs" />
                </div>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (isCounsellor && !form.specialization)}
            className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-base font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating Account…" : `Create ${isCounsellor ? "Counsellor" : "Student"} Account`}
          </button>

        </div>
      </div>

      <p className="mt-4 mb-14 text-gray-700 text-center text-sm">
        Already have an account?{" "}
        <button onClick={() => navigate("/login")} className="text-red-400 hover:underline font-medium bg-transparent border-none cursor-pointer">
          Sign In
        </button>
      </p>
    </div>
  );
}
