import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// This page is the landing spot after Google OAuth redirect.
// The backend redirects to /auth/google/success?token=...&user=...
// We read those params, store them, and send the user into the app.

export default function GoogleAuthSuccess() {
    const [searchParams] = useSearchParams();
    const { login }      = useAuth();
    const navigate       = useNavigate();

    useEffect(() => {
        const token   = searchParams.get("token");
        const userRaw = searchParams.get("user");

        if (!token || !userRaw) {
            // Something went wrong — send to login with an error flag
            navigate("/login?error=google_failed", { replace: true });
            return;
        }

        try {
            const user = JSON.parse(userRaw);

            // Store in localStorage (same keys as normal login)
            localStorage.setItem("dpi_token", token);
            localStorage.setItem("token",     token);
            localStorage.setItem("user",       JSON.stringify(user));

            // Update AuthContext
            login(token, user);

            // Clean the URL (remove sensitive params) then navigate
            if (user.role === "admin") {
                navigate("/dashboard", { replace: true });
            } else {
                navigate("/newhome", { replace: true });
            }
        } catch {
            navigate("/login?error=google_failed", { replace: true });
        }
    }, []); // run once on mount

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Signing you in with Google…</p>
            </div>
        </div>
    );
}
