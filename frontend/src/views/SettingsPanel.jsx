import { useState, useRef } from "react";

// ── Icons ──────────────────────────────────────────────────────────────────────
const CameraIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const SaveIcon     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const UserIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const MailIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const LockIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const MoneyIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrashIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const BuildingIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const InfoIcon     = () => <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const Spinner      = () => <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>;

const CURRENCIES = [
  { code: "PEN", label: "Sol peruano",     symbol: "S/" },
  { code: "USD", label: "Dólar americano", symbol: "$"  },
  { code: "EUR", label: "Euro",            symbol: "€"  },
  { code: "CLP", label: "Peso chileno",    symbol: "$"  },
  { code: "COP", label: "Peso colombiano", symbol: "$"  },
  { code: "MXN", label: "Peso mexicano",   symbol: "$"  },
  { code: "ARS", label: "Peso argentino",  symbol: "$"  },
  { code: "BRL", label: "Real brasileño",  symbol: "R$" },
  { code: "GBP", label: "Libra esterlina", symbol: "£"  },
  { code: "JPY", label: "Yen japonés",     symbol: "¥"  },
];

const API_BASE = import.meta.env.VITE_API_URL;

const apiJson = async (token, method, path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Error en la solicitud.");
  return data;
};

const apiMultipart = async (token, method, path, formData) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Error al subir archivo.");
  return data;
};

const apiDelete = async (token, path) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? "Error en la solicitud.");
  return data;
};

export default function SettingsPanel({ user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState("perfil");
  const [name,      setName]      = useState(user?.name     ?? "");
  const [email,     setEmail]     = useState(user?.email    ?? "");
  const [cargo,     setCargo]     = useState(user?.cargo    ?? "");  // ← nuevo
  const [currency,  setCurrency]  = useState(user?.currency ?? "PEN");
  const [photoUrl,  setPhotoUrl]  = useState(user?.photo    ?? null);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew,     setPwNew]     = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const fileRef = useRef();

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const syncSession = (patch) => onUpdateUser?.(patch);

  // ── Foto ──────────────────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("La imagen no debe superar 2 MB.", "error"); return; }

    const localPreview = URL.createObjectURL(file);
    setPhotoUrl(localPreview);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const data = await apiMultipart(user.token, "POST", "/me/photo", formData);
      setPhotoUrl(data.photo);
      syncSession({ photo: data.photo });
      showToast("Foto guardada.");
    } catch (err) {
      setPhotoUrl(user?.photo ?? null);
      showToast(err.message, "error");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const removePhoto = async () => {
    setSaving(true);
    try {
      await apiDelete(user.token, "/me/photo");
      setPhotoUrl(null);
      syncSession({ photo: null });
      showToast("Foto eliminada.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Perfil (nombre + email + cargo) ───────────────────────────────────────
  const saveProfile = async () => {
    if (!name.trim() || !email.trim()) { showToast("Nombre y email son obligatorios.", "error"); return; }
    setSaving(true);
    try {
      const data = await apiJson(user.token, "PUT", "/me", {
        name:  name.trim(),
        email: email.trim(),
        cargo: cargo.trim() || null,
      });
      syncSession({ name: data.name, email: data.email, cargo: data.cargo });
      showToast("Perfil actualizado.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Moneda ────────────────────────────────────────────────────────────────
  const saveCurrency = async () => {
    setSaving(true);
    try {
      const data = await apiJson(user.token, "PUT", "/me", { currency });
      syncSession({ currency: data.currency });
      showToast("Moneda guardada.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Contraseña ────────────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!pwCurrent || !pwNew || !pwConfirm) { showToast("Completa todos los campos.", "error"); return; }
    if (pwNew.length < 6)    { showToast("Mínimo 6 caracteres.", "error"); return; }
    if (pwNew !== pwConfirm) { showToast("Las contraseñas no coinciden.", "error"); return; }
    setSaving(true);
    try {
      await apiJson(user.token, "PUT", "/me/password", {
        current_password:      pwCurrent,
        password:              pwNew,
        password_confirmation: pwConfirm,
      });
      showToast("Contraseña actualizada.");
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const initials = (name ?? "U").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const tabs = [
    { id: "perfil",   label: "Mi Perfil",  icon: <UserIcon />  },
    { id: "moneda",   label: "Moneda",     icon: <MoneyIcon /> },
    { id: "password", label: "Contraseña", icon: <LockIcon />  },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <p className="text-sm text-gray-400 mt-1">Administra tu perfil y preferencias</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition
                  ${activeTab === t.id
                    ? "text-purple-600 border-b-2 border-purple-600 bg-purple-50/40"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}>
                <span className="hidden sm:block">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Perfil ── */}
          {activeTab === "perfil" && (
            <div className="p-6 space-y-6">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  {photoUrl
                    ? <img src={photoUrl} alt="Avatar" className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-md" />
                    : <div className="w-28 h-28 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-md border-4 border-white">{initials}</div>
                  }
                  <button onClick={() => fileRef.current.click()} disabled={saving}
                    className="absolute -bottom-2 -right-2 w-9 h-9 bg-white border border-gray-200 rounded-xl shadow flex items-center justify-center text-gray-500 hover:text-purple-600 hover:border-purple-300 transition disabled:opacity-50">
                    {saving ? <Spinner /> : <CameraIcon />}
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handlePhotoChange} />
                <div className="flex gap-2 items-center">
                  <button onClick={() => fileRef.current.click()} disabled={saving}
                    className="text-xs text-purple-600 font-medium hover:underline disabled:opacity-50">
                    Cambiar foto
                  </button>
                  {photoUrl && (
                    <>
                      <span className="text-gray-300">·</span>
                      <button onClick={removePhoto} disabled={saving}
                        className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1 disabled:opacity-50">
                        <TrashIcon /> Eliminar
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400">JPG, PNG, GIF o WEBP · Máx. 2 MB</p>
              </div>

              <hr className="border-gray-100" />

              <div className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre completo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserIcon /></span>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MailIcon /></span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" />
                  </div>
                </div>

                {/* Cargo ← nuevo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    Cargo o empresa
                    <span className="normal-case font-normal text-gray-400 ml-1">(aparecerá en tu testimonio)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><BuildingIcon /></span>
                    <input type="text" value={cargo} onChange={e => setCargo(e.target.value)}
                      maxLength={100} placeholder="Ej: Gerente General · Empresa S.A.C."
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" />
                  </div>
                  {/* Aviso informativo */}
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                    <InfoIcon />
                    Este cargo se usará automáticamente al publicar un testimonio.
                  </div>
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Rol</label>
                  <div className="px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${user?.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-200 text-gray-600"}`}>
                      {user?.role === "admin" ? "Administrador" : "Usuario"}
                    </span>
                    <span className="text-xs text-gray-400">· No editable</span>
                  </div>
                </div>
              </div>

              <button onClick={saveProfile} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 active:scale-[0.98] transition disabled:opacity-60">
                {saving ? <Spinner /> : <SaveIcon />}
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          )}

          {/* ── Moneda ── */}
          {activeTab === "moneda" && (
            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-500">La moneda se guarda en tu cuenta y aplica a todos los reportes.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Moneda principal</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MoneyIcon /></span>
                  <select value={currency} onChange={e => setCurrency(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition appearance-none bg-white">
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>{c.symbol} — {c.label} ({c.code})</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </div>
              </div>
              <button onClick={saveCurrency} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 active:scale-[0.98] transition disabled:opacity-60">
                {saving ? <Spinner /> : <SaveIcon />}
                {saving ? "Guardando..." : "Guardar moneda"}
              </button>
            </div>
          )}

          {/* ── Contraseña ── */}
          {activeTab === "password" && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Tu contraseña debe tener al menos 6 caracteres.</p>
              {[
                { label: "Contraseña actual",    val: pwCurrent, set: setPwCurrent },
                { label: "Nueva contraseña",     val: pwNew,     set: setPwNew     },
                { label: "Confirmar contraseña", val: pwConfirm, set: setPwConfirm },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><LockIcon /></span>
                    <input type="password" value={val} onChange={e => set(e.target.value)} placeholder="••••••••"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition" />
                  </div>
                </div>
              ))}
              {pwNew && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Seguridad</span>
                    <span>{pwNew.length < 6 ? "Débil" : pwNew.length < 10 ? "Media" : "Fuerte"}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${pwNew.length < 6 ? "bg-red-400 w-1/4" : pwNew.length < 10 ? "bg-amber-400 w-2/4" : "bg-green-500 w-full"}`} />
                  </div>
                </div>
              )}
              <button onClick={changePassword} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 active:scale-[0.98] transition disabled:opacity-60 mt-2">
                {saving ? <Spinner /> : <LockIcon />}
                {saving ? "Cambiando..." : "Cambiar contraseña"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium
          ${toast.type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}>
          {toast.type === "error"
            ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            : <SaveIcon />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}