import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleAuthSuccess() {
    const [searchParams] = useSearchParams();
    const { login }      = useAuth();
    const navigate       = useNavigate();

    useEffect(() => {
        const token   = searchParams.get("token");
        const userRaw = searchParams.get("user");

        if (!token || !userRaw) {
            navigate("/login?error=google_failed", { replace: true });
            return;
        }

        try {
            const user = JSON.parse(userRaw);

            // Single key — dpi_token only, consistent with the rest of the app
            localStorage.setItem("dpi_token", token);

            // Update AuthContext
            login(token, user);

            navigate(user.role === "admin" ? "/dashboard" : "/newhome", { replace: true });
        } catch {
            navigate("/login?error=google_failed", { replace: true });
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Signing you in with Google…</p>
            </div>
        </div>
    );
}
