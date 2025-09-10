// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { signup as apiSignup } from "../api/authApi";
// import { useAuth } from "../context/AuthContext";

// // Import assets
// import Logo from "../assets/logo.png";

// export default function Signup() {
//   const [form, setForm] = useState({
//     fullName: "",
//     email: "",
//     password: "",
//     confirmPassword: "",
//     role: "Student",
//     institution: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const navigate = useNavigate();
//   const { login } = useAuth(); // If you want to auto-login after signup

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     if (form.password !== form.confirmPassword) {
//       return setError("Passwords do not match.");
//     }

//     setLoading(true);
//     try {
//       const res = await apiSignup({
//         fullName: form.fullName,
//         email: form.email,
//         password: form.password,
//         role: form.role,
//         institution: form.institution,
//       });

//       const { token, user } = res.data.data;

//       // Optionally auto-login user right after signup
//       login(token, user);

//       navigate("/dashboard");
//     } catch (err) {
//       console.error(err);
//       setError(err.response?.data?.message || "Signup failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div 
//       className="min-h-screen flex flex-col items-center justify-center"
//       style={{ 
//         width: '100%', 
//         minHeight: '100vh',
//         display: 'flex',
//         flexDirection: 'column',
//         alignItems: 'center',
//         justifyContent: 'center',
//         backgroundColor: '#f9fafb',
//         padding: '1rem'
//       }}
//     >
//       <div 
//         className="bg-white rounded-lg shadow-xl p-10"
//         style={{
//           width: '85%',
//           maxWidth: '450px',
//           backgroundColor: 'white',
//           borderRadius: '8px',
//           boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
//           padding: '2.5rem'
//         }}
//       >
//         {/* Header */}
//         <div 
//           className="text-3xl mb-6"
//           style={{ 
//             fontSize: '1.875rem', 
//             fontWeight: 'bold', 
//             marginBottom: '1.5rem',
//             color: '#1f2937',
//             textAlign: 'center'
//           }}
//         >
//           Create Account
//         </div>
        
//         {/* Logo */}
//         {Logo && (
//           <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
//             <img 
//               src={Logo} 
//               alt="App Logo" 
//               style={{ width: '4rem', height: '4rem' }}
//             />
//           </div>
//         )}

//         {/* Error Message */}
//         {error && (
//           <div style={{
//             backgroundColor: '#fee2e2',
//             color: '#dc2626',
//             padding: '0.75rem',
//             borderRadius: '0.5rem',
//             marginBottom: '1rem',
//             fontSize: '0.875rem',
//             textAlign: 'center'
//           }}>
//             {error}
//           </div>
//         )}

//         {/* Signup Form */}
//         <form onSubmit={handleSubmit}>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
//             {/* Full Name */}
//             <div>
//               <label 
//                 htmlFor="fullName"
//                 style={{ 
//                   display: 'block',
//                   fontSize: '0.875rem',
//                   fontWeight: '500',
//                   color: '#374151',
//                   marginBottom: '0.25rem'
//                 }}
//               >
//                 Full Name
//               </label>
//               <input
//                 type="text"
//                 name="fullName"
//                 id="fullName"
//                 value={form.fullName}
//                 onChange={handleChange}
//                 placeholder="Enter your name"
//                 required
//                 style={{
//                   width: '100%',
//                   fontSize: '1.125rem',
//                   border: '2px solid #d1d5db',
//                   borderRadius: '0.5rem',
//                   padding: '0.5rem 1.25rem',
//                   outline: 'none'
//                 }}
//                 onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//                 onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
//               />
//             </div>

//             {/* Email */}
//             <div>
//               <label 
//                 htmlFor="email"
//                 style={{ 
//                   display: 'block',
//                   fontSize: '0.875rem',
//                   fontWeight: '500',
//                   color: '#374151',
//                   marginBottom: '0.25rem'
//                 }}
//               >
//                 Email
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 id="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 placeholder="Enter your email"
//                 required
//                 style={{
//                   width: '100%',
//                   fontSize: '1.125rem',
//                   border: '2px solid #d1d5db',
//                   borderRadius: '0.5rem',
//                   padding: '0.5rem 1.25rem',
//                   outline: 'none'
//                 }}
//                 onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//                 onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label 
//                 htmlFor="password"
//                 style={{ 
//                   display: 'block',
//                   fontSize: '0.875rem',
//                   fontWeight: '500',
//                   color: '#374151',
//                   marginBottom: '0.25rem'
//                 }}
//               >
//                 Password
//               </label>
//               <input
//                 type="password"
//                 name="password"
//                 id="password"
//                 value={form.password}
//                 onChange={handleChange}
//                 placeholder="Create a password"
//                 required
//                 style={{
//                   width: '100%',
//                   fontSize: '1.125rem',
//                   border: '2px solid #d1d5db',
//                   borderRadius: '0.5rem',
//                   padding: '0.5rem 1.25rem',
//                   outline: 'none'
//                 }}
//                 onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//                 onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
//               />
//             </div>

//             {/* Confirm Password */}
//             <div>
//               <label 
//                 htmlFor="confirmPassword"
//                 style={{ 
//                   display: 'block',
//                   fontSize: '0.875rem',
//                   fontWeight: '500',
//                   color: '#374151',
//                   marginBottom: '0.25rem'
//                 }}
//               >
//                 Confirm Password
//               </label>
//               <input
//                 type="password"
//                 name="confirmPassword"
//                 id="confirmPassword"
//                 value={form.confirmPassword}
//                 onChange={handleChange}
//                 placeholder="Confirm your password"
//                 required
//                 style={{
//                   width: '100%',
//                   fontSize: '1.125rem',
//                   border: '2px solid #d1d5db',
//                   borderRadius: '0.5rem',
//                   padding: '0.5rem 1.25rem',
//                   outline: 'none'
//                 }}
//                 onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//                 onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
//               />
//             </div>

//             {/* Role Selection */}
//             <div>
//               <label 
//                 htmlFor="role"
//                 style={{ 
//                   display: 'block',
//                   fontSize: '0.875rem',
//                   fontWeight: '500',
//                   color: '#374151',
//                   marginBottom: '0.25rem'
//                 }}
//               >
//                 Role
//               </label>
//               <select
//                 name="role"
//                 id="role"
//                 value={form.role}
//                 onChange={handleChange}
//                 style={{
//                   width: '100%',
//                   fontSize: '1.125rem',
//                   border: '2px solid #d1d5db',
//                   borderRadius: '0.5rem',
//                   padding: '0.5rem 1.25rem',
//                   outline: 'none',
//                   backgroundColor: 'white'
//                 }}
//                 onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//                 onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
//               >
//                 <option value="Student">Student</option>
//                 <option value="Counsellor">Counsellor</option>
//                 <option value="Admin">Admin</option>
//               </select>
//             </div>

//             {/* Institution */}
//             <div>
//               <label 
//                 htmlFor="institution"
//                 style={{ 
//                   display: 'block',
//                   fontSize: '0.875rem',
//                   fontWeight: '500',
//                   color: '#374151',
//                   marginBottom: '0.25rem'
//                 }}
//               >
//                 Institution
//               </label>
//               <input
//                 type="text"
//                 name="institution"
//                 id="institution"
//                 value={form.institution}
//                 onChange={handleChange}
//                 placeholder="Your school, college, or organization"
//                 style={{
//                   width: '100%',
//                   fontSize: '1.125rem',
//                   border: '2px solid #d1d5db',
//                   borderRadius: '0.5rem',
//                   padding: '0.5rem 1.25rem',
//                   outline: 'none'
//                 }}
//                 onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
//                 onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
//               />
//             </div>

//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loading}
//               style={{
//                 width: '100%',
//                 backgroundColor: loading ? '#fca5a5' : '#f87171',
//                 color: 'white',
//                 padding: '0.75rem 1rem',
//                 borderRadius: '0.75rem',
//                 fontSize: '1.125rem',
//                 fontWeight: '500',
//                 cursor: loading ? 'not-allowed' : 'pointer',
//                 border: 'none',
//                 marginTop: '0.5rem',
//                 transition: 'background-color 0.2s',
//                 opacity: loading ? 0.5 : 1
//               }}
//               onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#ef4444')}
//               onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#f87171')}
//             >
//               {loading ? "Creating Account..." : "Sign Up"}
//             </button>
//           </div>
//         </form>
//       </div>
      
//       {/* Login link - outside the box */}
//       <div style={{ marginTop: '1rem', marginBottom: '3.5rem', color: '#374151', textAlign: 'center' }}>
//         Already have an account?{" "}
//         <Link 
//           to="/login" 
//           style={{ 
//             color: '#f87171',
//             textDecoration: 'none'
//           }}
//           onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
//           onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
//         >
//           Login
//         </Link>
//       </div>
//     </div>
//   );
// }







import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup as apiSignup } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

// Import assets
import Logo from "../assets/logo.png";

export default function Signup() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Student",
    institution: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth(); // If you want to auto-login after signup

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      const res = await apiSignup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
        institution: form.institution,
      });

      const { token, user } = res.data.data;

      // Optionally auto-login user right after signup
      login(token, user);

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[30%] max-w-lg bg-white rounded-lg shadow-xl p-10">
        {/* Header */}
        <div className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Create Account
        </div>
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="App Logo" className="w-16 h-16" />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              id="role"
              value={form.role}
              onChange={handleChange}
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none bg-white"
            >
              <option value="Student">Student</option>
              <option value="Counsellor">Counsellor</option>
              <option value="Admin">Admin</option>
            </select>
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
              placeholder="Your school, college, or organization"
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-lg font-medium cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
      </div>
      
      {/* Login link - outside the box */}
      <div className="mt-4 mb-14 text-gray-700 text-center">
        Already have an account?{" "}
        <Link 
          to="/login" 
          className="text-red-400 hover:underline"
        >
          Login
        </Link>
      </div>
    </div>
  );
}