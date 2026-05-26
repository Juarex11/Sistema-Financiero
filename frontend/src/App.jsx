import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { TokenStore }                from "./router/TokenStore";
import { authFetch, normalizeUser }  from "./router/authFetch";
import AppLayout                     from "./layouts/AppLayout";
import LoadingScreen                 from "./components/LoadingScreen";
import LoginPage                     from "./views/LoginPage";
import OnboardingPage                from "./views/onboarding/OnboardingPage";

function InnerApp() {
  const navigate = useNavigate();
  const [session,           setSession]           = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [onboardingPending, setOnboardingPending] = useState(false);

  useEffect(() => {
    const token = TokenStore.load();
    if (!token) { setLoading(false); return; }

    let cancelled = false;

    authFetch("/me", token)
      .then(async (res) => {
        if (cancelled) return;

        // ✅ Solo 401 = token inválido → limpiar y mandar al login
        if (res.status === 401) {
          TokenStore.clear();
          setSession(null);
          setLoading(false);
          return;
        }

        // ✅ Cualquier otro error (500, red, timeout) → mantener sesión en loading=false
        // El usuario verá la app en blanco pero no perderá su sesión
        if (!res.ok) {
          // Intentar restaurar sesión mínima desde el token guardado
          // (no limpiamos — el token puede seguir siendo válido)
          setLoading(false);
          return;
        }

        const user = await res.json();
        if (cancelled) return;

        // Admin no necesita onboarding
        if (user.role === "admin") {
          setSession(normalizeUser(token, user));
          setOnboardingPending(false);
          setLoading(false);
          return;
        }

        // Usuario normal → verificar onboarding
        try {
          const ob     = await authFetch("/onboarding", token);
          const obData = await ob.json();
          if (cancelled) return;
          setSession(normalizeUser(token, user));
          setOnboardingPending(!obData.completado);
        } catch {
          // Si falla el onboarding, igual restauramos la sesión
          if (!cancelled) setSession(normalizeUser(token, user));
        }

        if (!cancelled) setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        // ✅ Error de red / timeout / CORS → NO limpiar token
        // El usuario sigue "logueado" — simplemente no pudimos verificar ahora
        // Intentamos cargar la app igual; si el token expiró, las peticiones darán 401
        setLoading(false);
      })
      .finally(() => {
        // Garantía: loading siempre termina
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const handleLogin = useCallback((data) => {
    TokenStore.save(data.token);
    setSession(normalizeUser(data.token, data));
    const pendiente = !data.onboarding_completado && data.role !== "admin";
    setOnboardingPending(pendiente);
    navigate(pendiente ? "/onboarding" : "/dashboard", { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    const token = TokenStore.load();
    if (token) {
      try { await authFetch("/logout", token, { method: "POST" }); } catch {}
    }
    TokenStore.clear();
    setSession(null);
    setOnboardingPending(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  const handleUpdateUser = useCallback((patch) => {
    setSession(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  const handleOnboardingComplete = useCallback((moneda) => {
    setOnboardingPending(false);
    handleUpdateUser({ currency: moneda });
    navigate("/dashboard", { replace: true });
  }, [navigate, handleUpdateUser]);

  if (loading) return <LoadingScreen />;

  if (!session) return (
    <Routes>
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="*"      element={<Navigate to="/login" replace />} />
    </Routes>
  );

  if (onboardingPending) return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingPage user={session} onComplete={handleOnboardingComplete} />} />
      <Route path="*"           element={<Navigate to="/onboarding" replace />} />
    </Routes>
  );

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/*"     element={<AppLayout key={session.role} session={session} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />} />
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