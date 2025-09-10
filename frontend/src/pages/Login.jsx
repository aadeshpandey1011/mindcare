// import React, { useState } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { ToastContainer, toast } from "react-toastify";
// import { login as apiLogin } from "../api/authApi";
// import { useAuth } from "../context/AuthContext";
// import "react-toastify/dist/ReactToastify.css";

// // Import assets
// import Logo from "../assets/logo.png";
// import GoogleIcon from "../assets/icons/google-icon.png";

// export default function Login() {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();
//   const { login } = useAuth();

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!form.email || !form.password) {
//       toast.error("Please fill all fields.");
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await apiLogin(form);
//       const { token, user } = res.data.data;

//       // Save token and user to context
//       login(token, user);

//       toast.success("Login successful!");
//       navigate("/dashboard");
//     } catch (err) {
//       console.error(err);
//       toast.error(err.response?.data?.message || "Invalid login credentials");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoogleLogin = () => {
//     toast.info("Google login coming soon...");
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
//           maxWidth: '400px',
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
//             textAlign: 'center',
//             color: '#1f2937'
//           }}
//         >
//           Sign In
//         </div>
        
//         {/* Logo - if you want to show it */}
//         {Logo && (
//           <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
//             <img 
//               src={Logo} 
//               alt="App Logo" 
//               style={{ width: '4rem', height: '4rem' }}
//             />
//           </div>
//         )}
        
//         {/* Google Login Button */}
//         <div style={{ marginBottom: '1.25rem', marginTop: '1.25rem' }}>
//           <button
//             onClick={handleGoogleLogin}
//             style={{
//               width: '100%',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               gap: '0.5rem',
//               border: '2px solid #d1d5db',
//               borderRadius: '0.5rem',
//               padding: '0.75rem 1rem',
//               fontSize: '1.125rem',
//               backgroundColor: 'white',
//               cursor: 'pointer',
//               transition: 'background-color 0.2s'
//             }}
//             onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
//             onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
//           >
//             {GoogleIcon && <img src={GoogleIcon} alt="Google" style={{ width: '1.25rem', height: '1.25rem' }} />}
//             <span>Continue with Google</span>
//           </button>
//         </div>

//         {/* Divider */}
//         <div 
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: '0.5rem',
//             margin: '1.5rem 0'
//           }}
//         >
//           <div style={{ flex: '1', height: '1px', backgroundColor: '#d1d5db' }}></div>
//           <div style={{ color: '#6b7280' }}>or</div>
//           <div style={{ flex: '1', height: '1px', backgroundColor: '#d1d5db' }}></div>
//         </div>

//         {/* Login Form */}
//         <form onSubmit={handleSubmit}>
//           <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
//                 placeholder="Email"
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
//                 placeholder="Password"
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
//               {loading ? "Signing in..." : "Login"}
//             </button>
//           </div>
//         </form>

//         {/* Forgot Password Link */}
//         <div style={{ marginTop: '1rem', textAlign: 'center' }}>
//           <Link 
//             to="/forgot-password" 
//             style={{ 
//               color: '#f87171', 
//               fontSize: '0.875rem',
//               textDecoration: 'none'
//             }}
//             onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
//             onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
//           >
//             Forgot Password?
//           </Link>
//         </div>
//       </div>
      
//       {/* Sign up link - outside the box */}
//       <div style={{ marginTop: '1rem', marginBottom: '3.5rem', color: '#374151' }}>
//         New to MindCare?{" "}
//         <Link 
//           to="/signup" 
//           style={{ 
//             color: '#f87171',
//             textDecoration: 'none'
//           }}
//           onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
//           onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
//         >
//           Join Now
//         </Link>
//       </div>
      
//       <ToastContainer />
//     </div>
//   );
// }









import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { login as apiLogin } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import "react-toastify/dist/ReactToastify.css";

// Import assets
import Logo from "../assets/logo.png";
import GoogleIcon from "../assets/icons/google-icon.png";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiLogin(form);
      const { token, user } = res.data.data;

      // Save token and user to context
      login(token, user);

      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Invalid login credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast.info("Google login coming soon...");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-[85%] md:w-[28%] max-w-md bg-white rounded-lg shadow-xl p-10">
        {/* Header */}
        <div className="text-3xl font-bold mb-6 text-gray-800 text-center">
          Sign In
        </div>
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="App Logo" className="w-16 h-16" />
        </div>
        
        {/* Google Login Button */}
        <div className="my-5">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 rounded-lg py-3 px-4 text-lg hover:bg-gray-50 transition-colors"
          >
            <img src={GoogleIcon} alt="Google" className="w-5 h-5" />
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 my-6">
          <div className="flex-1 h-px bg-gray-400"></div>
          <div className="text-gray-400">or</div>
          <div className="flex-1 h-px bg-gray-400"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Email"
              required
            />
          </div>

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
              className="w-full text-lg border-2 border-gray-300 rounded-lg px-5 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="Password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-xl text-lg font-medium cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="mt-4 text-center">
          <Link 
            to="/forgot-password" 
            className="text-red-400 hover:underline text-sm"
          >
            Forgot Password?
          </Link>
        </div>
      </div>
      
      {/* Sign up link - outside the box */}
      <div className="mt-4 mb-14 text-gray-700">
        New to MindCare?{" "}
        <Link to="/signup" className="text-red-400 hover:underline">
          Join Now
        </Link>
      </div>
      
      <ToastContainer />
    </div>
  );
}