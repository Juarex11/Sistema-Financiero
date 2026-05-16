import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL;

async function loginFetch(body) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8_000);
  try {
    return await fetch(`${API_BASE}/login`, {  // ← antes decía API_URL (no existía)
      method:  "POST",
      signal:  controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:    JSON.stringify(body),
    });
  } finally {
    clearTimeout(tid);
  }
}

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7
           a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243
           M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532
           l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5
           c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0
           01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

const PARTICLES = [
  { top: "12%", left: "8%",  size: 3, delay: "0s",   dur: "6s"   },
  { top: "78%", left: "5%",  size: 2, delay: "1s",   dur: "8s"   },
  { top: "33%", left: "92%", size: 4, delay: "0.5s", dur: "7s"   },
  { top: "88%", left: "87%", size: 2, delay: "2s",   dur: "5s"   },
  { top: "55%", left: "96%", size: 3, delay: "1.5s", dur: "9s"   },
  { top: "20%", left: "75%", size: 2, delay: "0.3s", dur: "6.5s" },
  { top: "65%", left: "15%", size: 3, delay: "2.5s", dur: "7.5s" },
  { top: "42%", left: "3%",  size: 2, delay: "1.8s", dur: "5.5s" },
];

export default function LoginPage({ onLogin }) {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [show,    setShow]    = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res  = await loginFetch(form);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Credenciales incorrectas.");
        return;
      }

onLogin({
  token:                 data.token,
  name:                  data.user.name,
  email:                 data.user.email,
  role:                  data.user.role,
  photo:                 data.user.photo    ?? null,
  currency:              data.user.currency ?? "PEN",
  onboarding_completado: data.onboarding_completado, // ← agrega esto
});
    } catch (err) {
      setError(
        err.name === "AbortError"
          ? "El servidor tardó demasiado. Intenta de nuevo."
          : "No se pudo conectar al servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) =>
    setForm(
      role === "admin"
        ? { email: "admin@app.com", password: "password" }
        : { email: "user@app.com",  password: "password" }
    );

  return (
    <div className="min-h-screen bg-[#07080f] flex items-center justify-center p-4 overflow-hidden relative">

      {/* Fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(#818cf8 1px,transparent 1px),linear-gradient(90deg,#818cf8 1px,transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-indigo-700/20 blur-[130px]" />
        <div className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full bg-violet-700/15 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/8 blur-[80px]" />
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-indigo-400/40"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              animation: `floatY ${p.dur} ease-in-out ${p.delay} infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[400px]">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/30 via-transparent to-violet-500/20 blur-sm" />

        <div className="relative bg-[#0d0f1c]/90 backdrop-blur-xl border border-white/[0.07] rounded-3xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.8)]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

          <div className="px-8 pt-10 pb-8">
            {/* Header */}
            <div className="text-center mb-9">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 relative">
                <div className="absolute inset-0 rounded-2xl bg-indigo-600/20 blur-md" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-90" />
                <svg className="relative w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h1 className="text-[22px] font-bold text-white tracking-tight leading-none">
                Bienvenido de nuevo
              </h1>
              <p className="text-slate-500 text-[13px] mt-2">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.1em]">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors duration-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="email" name="email" value={form.email}
                    onChange={handleChange} placeholder="usuario@correo.com"
                    required autoComplete="email"
                    className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-all duration-200"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.1em]">
                  Contraseña
                </label>
                <div className="relative group">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors duration-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={show ? "text" : "password"} name="password" value={form.password}
                    onChange={handleChange} placeholder="••••••••"
                    required autoComplete="current-password"
                    className="w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.14] focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/40 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-slate-600 outline-none transition-all duration-200"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors duration-200">
                    <EyeIcon open={show} />
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] px-4 py-3 rounded-xl">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="relative w-full mt-2 py-3 rounded-xl font-semibold text-sm text-white overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed transition-opacity duration-200">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 group-hover:from-indigo-500 group-hover:to-violet-500 transition-all duration-300" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verificando…
                    </>
                  ) : (
                    <>
                      Iniciar sesión
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Demo */}
            <div className="mt-7 pt-6 border-t border-white/[0.06]">
              <p className="text-[11px] text-slate-600 text-center mb-3 uppercase tracking-wider">
                Acceso de prueba
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: "👑 Admin", role: "admin" }, { label: "👤 Usuario", role: "user" }].map(({ label, role }) => (
                  <button key={role} type="button" onClick={() => fillDemo(role)}
                    className="text-[12px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 rounded-xl px-3 py-2.5 transition-all duration-200">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
        </div>
      </div>

      <style>{`
        @keyframes floatY {
          from { transform: translateY(0px) scale(1);   opacity: 0.4;  }
          to   { transform: translateY(-18px) scale(1.3); opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}