import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter, Routes, Route, Navigate,
  useNavigate, useLocation,
} from "react-router-dom";

import Header          from "./components/Header";
import Sidebar         from "./components/Sidebar";
import LoadingScreen   from "./components/LoadingScreen";
import LoginPage       from "./views/LoginPage";
import AdminDashboard  from "./views/admin/AdminDashboard";
import UserDashboard   from "./views/user/UserDashboard";
import AnunciosPage    from "./views/AnunciosPage";
import TestimoniosAdmin   from "./views/admin/TestimoniosAdmin";
import TestimoniosUsuario from "./views/user/TestimoniosUsuario";
import SettingsView    from "./views/SettingsPanel";
import AgendaPage from "./views/eventos/AgendaPage";
// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL;

// ── Token store ───────────────────────────────────────────────────────────────
const TokenStore = {
  save:  (t) => { try { localStorage.setItem("auth_token", t);    } catch {} },
  load:  ()  => { try { return localStorage.getItem("auth_token"); } catch { return null; } },
  clear: ()  => { try { localStorage.removeItem("auth_token");     } catch {} },
};

// ── Fetch autenticado con timeout de 8 s ──────────────────────────────────────
async function authFetch(endpoint, token, options = {}) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    return res;
  } finally {
    clearTimeout(tid);
  }
}

// ── Normaliza sesión ──────────────────────────────────────────────────────────
function normalizeUser(token, user) {
  return {
    token,
    name:     user.name,
    email:    user.email,
    role:     user.role,
    photo:    user.photo    ?? null,
    currency: user.currency ?? "PEN",
    cargo:    user.cargo    ?? null,
  };
}

// ── Layout principal ──────────────────────────────────────────────────────────
function AppLayout({ session, onLogout, onUpdateUser }) {
  const [collapsed,             setCollapsed]             = useState(false);
  const [mobileOpen,            setMobileOpen]            = useState(false);
  const [pendientesTestimonios, setPendientesTestimonios] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Badge de testimonios pendientes — visible desde cualquier vista
  useEffect(() => {
    if (session.role !== "admin") return;
    authFetch("/admin/testimonios?estado=pendiente", session.token)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPendientesTestimonios(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [session.token, session.role]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        user={session}
        onLogout={onLogout}
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => setCollapsed(c => !c)}
        onMobileMenuToggle={() => setMobileOpen(o => !o)}
        onOpenSettings={() => navigate("/ajustes")}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          role={session.role}
          activePage={location.pathname}
          onNavigate={(path) => { navigate(path); setMobileOpen(false); }}
          pendientesTestimonios={pendientesTestimonios}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route
              path="/dashboard"
              element={
                session.role === "admin"
                  ? <AdminDashboard user={session} onLogout={onLogout} />
                  : <UserDashboard  user={session} onLogout={onLogout} />
              }
            />
            <Route
              path="/anuncios"
              element={<AnunciosPage user={session} />}
            />
            <Route
  path="/agenda"
  element={<AgendaPage user={session} />}
/>
            <Route
              path="/testimonios"
              element={
                session.role === "admin"
                  ? <TestimoniosAdmin   user={session} onPendientesChange={setPendientesTestimonios} />
                  : <TestimoniosUsuario user={session} />
              }
            />
            <Route
              path="/ajustes"
              element={<SettingsView user={session} onUpdateUser={onUpdateUser} />}
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ── Inner App ─────────────────────────────────────────────────────────────────
function InnerApp() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = TokenStore.load();
    if (!token) { setLoading(false); return; }

    let cancelled = false;

    authFetch("/me", token)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const user = await res.json();
        if (!cancelled) setSession(normalizeUser(token, user));
      })
      .catch(() => {
        if (!cancelled) { TokenStore.clear(); setSession(null); }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const handleLogin = useCallback((data) => {
    TokenStore.save(data.token);
    setSession(normalizeUser(data.token, data));
    navigate("/dashboard", { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    const token = TokenStore.load();
    if (token) {
      try { await authFetch("/logout", token, { method: "POST" }); } catch {}
    }
    TokenStore.clear();
    setSession(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleUpdateUser = useCallback((patch) => {
    setSession(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={!session ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/*"
        element={
          session
            ? <AppLayout key={session.role} session={session} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  );
}