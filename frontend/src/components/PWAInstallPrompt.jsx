/**
 * PWAInstallPrompt
 * ─────────────────
 * Handles two things:
 *  1. "Add to Home Screen" install banner using the native beforeinstallprompt event
 *  2. Service worker registration + update detection (no external package needed)
 *
 * Zero external dependencies — works with plain Vite + the /public/sw.js file.
 */
import { useState, useEffect } from "react";

export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [showInstall,  setShowInstall]  = useState(false);
  const [updateReady,  setUpdateReady]  = useState(false);
  const [swReg,        setSwReg]        = useState(null);

  // ── Register the service worker ───────────────────────────────────────────
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        setSwReg(reg);

        // Check for an update immediately then every 60 min
        reg.update();
        const interval = setInterval(() => reg.update(), 60 * 60 * 1000);

        // New SW waiting → show update banner
        if (reg.waiting) setUpdateReady(true);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });

        return () => clearInterval(interval);
      })
      .catch((err) => console.warn("[SW] Registration failed:", err.message));
  }, []);

  // ── Capture install prompt ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallEvent(e);
      // Show banner 3 s after page load, but only if not dismissed this session
      if (!sessionStorage.getItem("pwa_install_dismissed")) {
        setTimeout(() => setShowInstall(true), 3000);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setShowInstall(false);
    if (outcome === "accepted") setInstallEvent(null);
  };

  const handleDismissInstall = () => {
    sessionStorage.setItem("pwa_install_dismissed", "1");
    setShowInstall(false);
  };

  const handleUpdate = () => {
    if (swReg?.waiting) {
      swReg.waiting.postMessage("SKIP_WAITING");
    }
    window.location.reload();
  };

  // ── Update banner (highest priority) ─────────────────────────────────────
  if (updateReady) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-4 pointer-events-none">
        <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 max-w-sm w-full pointer-events-auto">
          <span className="text-xl flex-shrink-0">🔄</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Update available</p>
            <p className="text-xs text-white/60">Reload for the latest version of MindCare</p>
          </div>
          <button
            onClick={handleUpdate}
            className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors">
            Update
          </button>
        </div>
      </div>
    );
  }

  // ── Install banner ─────────────────────────────────────────────────────────
  if (!showInstall || !installEvent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6 pointer-events-none">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex items-center gap-3 max-w-sm w-full pointer-events-auto">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">💙</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">Install MindCare</p>
          <p className="text-xs text-gray-500">Add to your home screen for instant access</p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
            Install
          </button>
          <button
            onClick={handleDismissInstall}
            className="text-gray-400 hover:text-gray-600 text-xs text-center transition-colors">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
