import { useState } from "react";
import logo from "../assets/logo.png";
import loginImg from "../assets/login.png";
import {
  Eye, EyeOff, User, Lock,
  Loader2, DollarSign, Building2, Zap,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

async function loginFetch(body) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 20_000); // 20s timeout
  try {
    return await fetch(`${API_BASE}/login`, {
      method:  "POST",
      signal:  controller.signal,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body:    JSON.stringify(body),
    });
  } finally {
    clearTimeout(tid);
  }
}

const FEATURES = [
  { Icon: DollarSign,  text: "Registra tus movimientos financieros" },
  { Icon: Building2,   text: "Organiza tus ingresos, gastos y ahorros" },
  { Icon: Zap,         text: "Todo lo que necesitas para presupuestar" },
];

export default function LoginScotiabank({ onLogin }) {
  const [docNum, setDocNum]     = useState("");
  const [password, setPassword] = useState("");
  const [showDoc, setShowDoc]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [trust, setTrust]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const canSubmit = docNum.trim().length > 0 && password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    setError("");

    try {
      const res  = await loginFetch({ email: docNum.trim(), password });
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
        onboarding_completado: data.onboarding_completado,
      });
    } catch (err) {
      if (err.name === "AbortError") {
        setError("El servidor tardó demasiado. Intenta de nuevo.");
      } else if (err.message?.includes("fetch")) {
        setError("No se pudo conectar al servidor. Verifica tu conexión.");
      } else {
        setError("Ocurrió un error inesperado. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">

      {/* ── LEFT PANEL ── */}
      <div className="w-full lg:max-w-[560px] flex flex-col px-6 sm:px-10 lg:px-14 py-8 lg:py-12 lg:border-r border-gray-200">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 lg:mb-12">
          <img src={logo} alt="Logo" className="h-10 sm:h-14 w-auto object-contain" />
          <a href="#" className="text-sm sm:text-base font-semibold text-purple-600 hover:text-purple-800 hover:underline transition-colors">
            ¿Necesitas ayuda?
          </a>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
          Inicia sesión
        </h1>
        <p className="text-gray-500 text-sm sm:text-base mb-8 lg:mb-10">
          Ingresa tus datos para acceder a tu cuenta
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 lg:gap-7">

          {/* Email / documento */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Correo electrónico
            </label>
            <div className="flex items-center gap-3 border-b-2 border-gray-300 focus-within:border-purple-500 transition-colors">
              <User size={20} className="text-purple-400 shrink-0" strokeWidth={1.75} />
              <input
                type="text"
                value={docNum}
                onChange={(e) => { setDocNum(e.target.value); setError(""); }}
                placeholder="usuario@correo.com"
                autoComplete="username"
                className="flex-1 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 bg-transparent outline-none"
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowDoc((s) => !s)}
                className="text-gray-400 hover:text-purple-500 transition-colors p-1"
                aria-label="Mostrar u ocultar"
              >
                {showDoc ? <EyeOff size={20} strokeWidth={1.75} /> : <Eye size={20} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Contraseña
            </label>
            <div className="flex items-center gap-3 border-b-2 border-gray-300 focus-within:border-purple-500 transition-colors">
              <Lock size={20} className="text-purple-400 shrink-0" strokeWidth={1.75} />
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                className="flex-1 py-3 sm:py-3.5 text-sm sm:text-base text-gray-800 placeholder-gray-300 bg-transparent outline-none"
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowPass((s) => !s)}
                className="text-gray-400 hover:text-purple-500 transition-colors p-1"
                aria-label="Mostrar u ocultar contraseña"
              >
                {showPass ? <EyeOff size={20} strokeWidth={1.75} /> : <Eye size={20} strokeWidth={1.75} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              <span className="font-semibold">⚠</span> {error}
            </div>
          )}

          {/* Confiar + Recuperar */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm sm:text-base text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={trust}
                onChange={(e) => setTrust(e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 accent-purple-600 cursor-pointer"
              />
              Confiar
              <span
                title="Marcar este dispositivo como de confianza"
                className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-400 text-gray-400 text-xs font-bold cursor-default leading-none"
              >
                i
              </span>
            </label>
            <a href="#" className="text-sm sm:text-base font-semibold text-purple-600 hover:text-purple-800 hover:underline transition-colors">
              Recuperar contraseña
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={`mt-1 w-full py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition-all duration-200 ${
              canSubmit && !loading
                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200 cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Verificando…
              </span>
            ) : "Ingresar"}
          </button>

        </form>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 bg-gradient-to-br from-purple-50 via-white to-purple-100 relative overflow-hidden flex flex-col px-10 lg:px-16 py-10 lg:py-12">

        {/* Blobs decorativos */}
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-purple-200/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-40 h-40 rounded-full bg-purple-300/20 blur-2xl pointer-events-none" />

        {/* Contenido superior: texto + features */}
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-3">
            Toma el control<br />
            <span className="text-purple-600">de tu dinero</span><br />
            hoy mismo
          </h2>
          <p className="text-gray-500 text-base sm:text-lg mb-8">
            Regístrate gratis, rápido y sin hojas de cálculo complicadas.
          </p>

          <ul className="flex flex-col gap-4 lg:gap-5 mb-10">
            {FEATURES.map(({ Icon, text }, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="w-11 h-11 flex-shrink-0 rounded-2xl bg-purple-100 flex items-center justify-center p-2.5">
                  <Icon size={22} className="text-purple-600" strokeWidth={1.75} />
                </div>
                <p className="text-sm sm:text-base text-gray-700 leading-snug pt-2">{text}</p>
              </li>
            ))}
          </ul>

          <button className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 border-2 border-purple-700 rounded-full text-base sm:text-lg font-bold text-purple-700 hover:bg-purple-700 hover:text-white transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-purple-200">
            Abrir cuenta
          </button>
        </div>

        {/* Imagen — pegada abajo a la derecha, fuera del flujo del texto */}
        <img
          src={loginImg}
          alt="Cuenta Digital"
          className="absolute bottom-0 right-0 w-64 lg:w-80 xl:w-96 object-contain pointer-events-none select-none"
        />
      </div>

    </div>
  );
}