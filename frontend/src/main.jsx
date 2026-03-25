import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import './index.css';

// PWA install/update banner — lazy so it never delays the first render
const PWAInstallPrompt = lazy(() => import("./components/PWAInstallPrompt.jsx"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        {/* PWA install + SW update banner — rendered outside the router layout */}
        <Suspense fallback={null}>
          <PWAInstallPrompt />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
