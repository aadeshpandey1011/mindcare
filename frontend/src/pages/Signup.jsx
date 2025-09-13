import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export default function Signup() {
  const navigate = useNavigate();   // ✅ initialize navigate
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "student", // Match backend enum values
    institution: "",
  });

  const [files, setFiles] = useState({
    avatar: null,
    coverImage: null
  });

  const [previews, setPreviews] = useState({
    avatar: null,
    coverImage: null
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];

    if (file) {
      setFiles(prev => ({ ...prev, [name]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };
   const handleJoinNow = () => {
    // setShowSignup(true);
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (form.password !== form.confirmPassword) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    if (!files.avatar) {
      showMessage("Profile picture (avatar) is required.", "error");
      return;
    }

    // Check if username is unique format
    if (form.username.includes(" ")) {
      showMessage("Username cannot contain spaces.", "error");
      return;
    }

    if (!form.fullName || !form.email || !form.username || !form.password) {
      showMessage("All required fields must be filled.", "error");
      return;
    }

    setLoading(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("email", form.email);
      formData.append("username", form.username.toLowerCase());
      formData.append("password", form.password);
      formData.append("role", form.role);
      if (form.institution) {
        formData.append("institution", form.institution);
      }
      formData.append("avatar", files.avatar);
      
      if (files.coverImage) {
        formData.append("coverImage", files.coverImage);
      }

      // Simulate API call (replace with actual API endpoint)

      const url = `${API_BASE}/users/register`;  // ✅ fixed: use API_BASE
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      showMessage("Account created successfully!", "success");
      
      // If user is auto-approved (student), show success message
      if (form.role === "student") {
        showMessage("Account created! You can now login.", "success");
      } else {
        showMessage("Account created! Please wait for admin approval.", "info");
      }

      setTimeout(() => {
        navigate("/");   // redirect to home page (change to "/login" if you prefer login page)
      }, 2000);

      // Reset form after successful submission
      setForm({
        fullName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "student",
        institution: "",
      });
      setFiles({ avatar: null, coverImage: null });
      setPreviews({ avatar: null, coverImage: null });

    } catch (err) {
      console.error(err);
      showMessage(err.message || "Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[90%] md:w-[50%] lg:w-[40%] max-w-2xl bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Create Account
        </div>
        
        {/* Logo placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
            MC
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm text-center ${
            messageType === "success" ? "bg-green-100 text-green-700" :
            messageType === "error" ? "bg-red-100 text-red-700" :
            messageType === "info" ? "bg-blue-100 text-blue-700" : ""
          }`}>
            {message}
          </div>
        )}

        {/* Signup Form */}
        <div className="space-y-4">
          
          {/* Personal Information Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Choose a unique username"
                  required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">No spaces allowed, will be converted to lowercase</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Institution */}
              <div>
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  name="institution"
                  id="institution"
                  value={form.institution}
                  onChange={handleChange}
                  placeholder="Your school/college/organization"
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Account Security</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="mt-4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                id="role"
                value={form.role}
                onChange={handleChange}
                className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="student">Student</option>
                <option value="counsellor">Counsellor</option>
                <option value="admin">Admin</option>
              </select>
              {form.role === "counsellor" && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Counsellor accounts require admin approval</p>
              )}
            </div>
          </div>

          {/* Profile Images Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Profile Images</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Avatar) *
                </label>
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                    {previews.avatar ? (
                      <img src={previews.avatar} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs text-center">Upload Avatar</span>
                    )}
                  </div>
                  <input
                    type="file"
                    name="avatar"
                    id="avatar"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image (Optional)
                </label>
                <div className="flex flex-col items-center">
                  <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                    {previews.coverImage ? (
                      <img src={previews.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs text-center">Upload Cover</span>
                    )}
                  </div>
                  <input
                    type="file"
                    name="coverImage"
                    id="coverImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-lg font-medium cursor-pointer mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      </div>
      
      {/* Login link - outside the box */}
      <div className="mt-4 mb-14 text-gray-700 text-center">
        Already have an account?{" "}
       <button 
          onClick={handleJoinNow}
          className="text-red-400 hover:underline cursor-pointer bg-none border-none"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

