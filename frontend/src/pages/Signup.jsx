import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

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
  const [govtIdErrors, setGovtIdErrors] = useState({ aadharNumber: "", panNumber: "" });

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

  const showMessage = (msg, type) => {
    setMessage(msg); setMsgType(type);
    setTimeout(() => { setMessage(""); setMsgType(""); }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) { showMessage("Passwords do not match.", "error"); return; }
    if (!files.avatar)                           { showMessage("Profile picture is required.", "error"); return; }
    if (form.username.includes(" "))             { showMessage("Username cannot contain spaces.", "error"); return; }
    if (!form.fullName || !form.email || !form.username || !form.password) {
      showMessage("All required fields must be filled.", "error"); return;
    }
    if (form.phone) {
      const cleaned = form.phone.replace(/[\s\-().]/g, "");
      if (!/^\d{10}$/.test(cleaned)) { showMessage("Phone must be a 10-digit Indian mobile number.", "error"); return; }
    }
    if (form.dob && (computedAge === null || computedAge < 5 || computedAge > 100)) {
      showMessage("Please enter a valid date of birth (age 5–100).", "error"); return;
    }
    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber)) {
      showMessage("Aadhar number must be exactly 12 digits.", "error"); return;
    }
    if (form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)) {
      showMessage("PAN must be in the format ABCDE1234F.", "error"); return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("fullName",  form.fullName);
      fd.append("email",     form.email);
      fd.append("username",  form.username.toLowerCase());
      fd.append("password",  form.password);
      fd.append("role",      form.role);
      if (form.institution)  fd.append("institution",  form.institution);
      if (form.phone.trim()) fd.append("phone",        form.phone.trim().replace(/[\s\-().]/g, ""));
      if (form.dob)          fd.append("dob",          form.dob);
      fd.append("avatar", files.avatar);
      if (files.coverImage)         fd.append("coverImage",    files.coverImage);
      if (form.aadharNumber.trim()) fd.append("aadharNumber",  form.aadharNumber.trim());
      if (form.panNumber.trim())    fd.append("panNumber",     form.panNumber.trim().toUpperCase());

      const res  = await fetch(`${API_BASE}/users/register`, { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      showMessage(
        form.role === "student" ? "Account created! You can now log in." : "Account created! Please wait for admin approval.",
        form.role === "student" ? "success" : "info"
      );
      setTimeout(() => navigate("/"), 2000);

      setForm({ fullName:"",email:"",username:"",password:"",confirmPassword:"",
                role:"student",institution:"",phone:"",dob:"",aadharNumber:"",panNumber:"" });
      setFiles({ avatar:null, coverImage:null });
      setPreviews({ avatar:null, coverImage:null });
      setGovtIdErrors({ aadharNumber:"", panNumber:"" });
    } catch (err) {
      showMessage(err.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[90%] md:w-[50%] lg:w-[40%] max-w-2xl bg-white rounded-lg shadow-xl p-8">

        <div className="text-3xl font-bold mb-6 text-gray-800 text-center">Create Account</div>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">MC</div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
            msgType === "success" ? "bg-green-100 text-green-700" :
            msgType === "error"   ? "bg-red-100 text-red-700"     : "bg-blue-100 text-blue-700"
          }`}>{message}</div>
        )}

        <div className="space-y-4">

          {/* ── Personal Information ── */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange}
                  placeholder="Enter your full name" required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input type="text" name="username" value={form.username} onChange={handleChange}
                  placeholder="Choose a unique username" required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none" />
                <p className="text-xs text-gray-500 mt-1">No spaces, converted to lowercase</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="Enter your email" required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input type="text" name="institution" value={form.institution} onChange={handleChange}
                  placeholder="School / College / Organization"
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-gray-400 font-normal">(for OTP verification)</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border-2 border-r-0 border-gray-300 rounded-l-lg bg-gray-100 text-gray-600 text-sm">+91</span>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="10-digit mobile number" maxLength={10} inputMode="numeric"
                    className="w-full text-sm border-2 border-gray-300 rounded-r-lg px-3 py-2 focus:border-blue-500 focus:outline-none" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Used to verify your identity via OTP</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input type="date" name="dob" value={form.dob} onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none" />
                {computedAge !== null && computedAge >= 5 && computedAge <= 100 && (
                  <p className="text-xs text-green-600 mt-1">Age: {computedAge} years</p>
                )}
                {computedAge !== null && (computedAge < 5 || computedAge > 100) && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid date of birth</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Account Security ── */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Account Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Create a strong password" required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                  placeholder="Confirm your password" required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select name="role" value={form.role} onChange={handleChange}
                className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none bg-white">
                <option value="student">Student</option>
                <option value="counsellor">Counsellor</option>
                {/* Admin is intentionally not in this dropdown.
                    Create the first admin via Postman: POST /api/v1/users/register with role:"admin" */}
              </select>
              {form.role === "counsellor" && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Counsellor accounts require admin approval before you can log in
                </p>
              )}
            </div>
          </div>

          {/* ── Government ID (Optional) ── */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <span className="text-blue-600 text-lg leading-none">🪪</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Government ID <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Helps verify your identity. Can be added or updated from your profile later.
                  Numbers are stored securely and only shown in masked form.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Card Number</label>
                <input type="text" name="aadharNumber" value={form.aadharNumber} onChange={handleChange}
                  placeholder="12-digit Aadhar number" maxLength={12} inputMode="numeric"
                  className={`w-full text-sm border-2 rounded-lg px-3 py-2 focus:outline-none ${
                    govtIdErrors.aadharNumber && form.aadharNumber.length !== 12 ? "border-amber-400" :
                    form.aadharNumber.length === 12 ? "border-green-400" : "border-gray-300 focus:border-blue-500"
                  }`} />
                {govtIdErrors.aadharNumber && <p className="text-xs text-amber-600 mt-1">{govtIdErrors.aadharNumber}</p>}
                {form.aadharNumber.length === 12 && <p className="text-xs text-green-600 mt-1">✓ Valid format</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Card Number</label>
                <input type="text" name="panNumber" value={form.panNumber} onChange={handleChange}
                  placeholder="e.g. ABCDE1234F" maxLength={10}
                  className={`w-full text-sm border-2 rounded-lg px-3 py-2 focus:outline-none uppercase ${
                    govtIdErrors.panNumber && form.panNumber.length > 0 ? "border-amber-400" :
                    form.panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber) ? "border-green-400" :
                    "border-gray-300 focus:border-blue-500"
                  }`} />
                {govtIdErrors.panNumber && <p className="text-xs text-amber-600 mt-1">{govtIdErrors.panNumber}</p>}
                {form.panNumber.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber) && (
                  <p className="text-xs text-green-600 mt-1">✓ Valid format</p>
                )}
                <p className="text-xs text-gray-400 mt-1">5 letters · 4 digits · 1 letter</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              🔒 Stored encrypted. Never shown in full. OTP verification available after login.
            </p>
          </div>

          {/* ── Profile Images ── */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Profile Images</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture (Avatar) *</label>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                    {previews.avatar
                      ? <img src={previews.avatar} alt="Avatar" className="w-full h-full object-cover" />
                      : <span className="text-gray-400 text-xs text-center">Upload Avatar</span>}
                  </div>
                  <input type="file" name="avatar" accept="image/*" onChange={handleFileChange} required className="text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                    {previews.coverImage
                      ? <img src={previews.coverImage} alt="Cover" className="w-full h-full object-cover" />
                      : <span className="text-gray-400 text-xs text-center">Upload Cover</span>}
                  </div>
                  <input type="file" name="coverImage" accept="image/*" onChange={handleFileChange} className="text-xs" />
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-lg font-medium cursor-pointer mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? "Creating Account…" : "Create Account"}
          </button>
        </div>
      </div>

      <div className="mt-4 mb-14 text-gray-700 text-center">
        Already have an account?{" "}
        <button onClick={() => navigate("/login")} className="text-red-400 hover:underline cursor-pointer bg-none border-none">
          Sign In
        </button>
      </div>
    </div>
  );
}
