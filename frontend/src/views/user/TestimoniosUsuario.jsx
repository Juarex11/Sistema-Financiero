import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL;

const apiFetch = (url, token, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
  });

// ── Iconos ────────────────────────────────────────────────────────────────────
const CheckIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const XIcon       = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const TrashIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const ClockIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const InfoIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BuildingIcon= () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const SettingsIcon= () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const StarBadge   = () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          className={`text-2xl transition-all duration-100 ${onChange ? "hover:scale-110 cursor-pointer" : "cursor-default"} ${n <= value ? "text-amber-400" : "text-slate-200"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const map = {
    pendiente: { bg: "bg-amber-50 border-amber-200 text-amber-700",     Icon: ClockIcon,  label: "Pendiente" },
    aprobado:  { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", Icon: CheckIcon, label: "Publicado" },
    rechazado: { bg: "bg-red-50 border-red-200 text-red-700",            Icon: XIcon,      label: "Rechazado" },
  };
  const s = map[estado] ?? map.pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${s.bg}`}>
      <s.Icon />{s.label}
    </span>
  );
}

function Avatar({ foto, nombre }) {
  return foto ? (
    <img src={foto} alt={nombre} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
      <span className="text-white font-bold text-sm">{nombre?.[0]?.toUpperCase()}</span>
    </div>
  );
}

function TestimonioCard({ t }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition hover:-translate-y-0.5 hover:shadow-md ${t.destacado ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-100"}`}>
      {t.destacado && (
        <div className="flex items-center gap-1 text-amber-600 text-[11px] font-bold mb-3">
          <StarBadge /> Destacado
        </div>
      )}
      <Stars value={t.estrellas ?? 5} />
      <p className="mt-3 text-slate-600 text-sm leading-relaxed italic">"{t.contenido}"</p>
      <div className="mt-4 flex items-center gap-3">
        <Avatar foto={t.foto} nombre={t.nombre} />
        <div>
          <p className="font-semibold text-slate-800 text-sm">{t.nombre}</p>
          {t.cargo_empresa && (
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <BuildingIcon />{t.cargo_empresa}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function TestimoniosUsuario({ user }) {
  const [testimonio, setTestimonio] = useState(null);
  const [publicos,   setPublicos]   = useState([]);
  const [form,       setForm]       = useState({ contenido: "", estrellas: 5 }); // ← sin cargo_empresa
  const [editando,   setEditando]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [msg,        setMsg]        = useState(null);
  const [tab,        setTab]        = useState("ver");

  useEffect(() => {
    Promise.all([
      apiFetch("/testimonios/mio", user.token).then(r => r.json()).catch(() => null),
      fetch(`${API}/testimonios`, { headers: { Accept: "application/json" } }).then(r => r.json()).catch(() => []),
    ]).then(([mio, lista]) => {
      const t = mio && mio.id ? mio : null;
      setTestimonio(t);
      if (t) setForm({ contenido: t.contenido ?? "", estrellas: t.estrellas ?? 5 }); // ← sin cargo
      setPublicos(Array.isArray(lista) ? lista : []);
    }).finally(() => setLoading(false));
  }, [user.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      // Solo enviamos contenido y estrellas — cargo lo toma el backend del perfil
      const res  = await apiFetch("/testimonios", user.token, { method: "POST", body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al guardar.");
      setTestimonio(data.testimonio ?? null);
      setEditando(false);
      setMsg({ type: "ok", text: data.message ?? "Guardado correctamente." });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async () => {
    if (!confirm("¿Eliminar tu testimonio?")) return;
    await apiFetch("/testimonios/mio", user.token, { method: "DELETE" });
    setTestimonio(null);
    setForm({ contenido: "", estrellas: 5 });
    setMsg({ type: "ok", text: "Testimonio eliminado." });
  };

  const contenido = form.contenido ?? "";
  const estrellas = form.estrellas ?? 5;

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  const destacados = publicos.filter(t => t.destacado);
  const resto      = publicos.filter(t => !t.destacado);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header + tabs */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Testimonios</h1>
          <p className="text-slate-500 text-sm mt-1">Lo que dicen nuestros usuarios.</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { key: "ver", label: "Ver todos"     },
            { key: "mio", label: "Mi testimonio" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
              {t.key === "mio" && testimonio && (
                <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  testimonio.estado === "aprobado"  ? "bg-emerald-100 text-emerald-700" :
                  testimonio.estado === "rechazado" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"}`}>
                  {testimonio.estado}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: VER TODOS ── */}
      {tab === "ver" && (
        publicos.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <UserIcon />
            </div>
            <p className="font-medium text-slate-500">Aún no hay testimonios publicados.</p>
            <p className="text-sm mt-1">Sé el primero en compartir tu experiencia.</p>
            <button onClick={() => setTab("mio")}
              className="mt-4 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm transition">
              Escribir testimonio
            </button>
          </div>
        ) : (
          <>
            {destacados.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <StarBadge /> Destacados
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {destacados.map(t => <TestimonioCard key={t.id} t={t} />)}
                </div>
              </div>
            )}
            {resto.length > 0 && (
              <div className="space-y-3">
                {destacados.length > 0 && (
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Todos</p>
                )}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resto.map(t => <TestimonioCard key={t.id} t={t} />)}
                </div>
              </div>
            )}
          </>
        )
      )}

      {/* ── TAB: MI TESTIMONIO ── */}
      {tab === "mio" && (
        <div className="max-w-2xl space-y-5">

          {/* Alerta */}
          {msg && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${msg.type === "ok" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              {msg.type === "ok" ? <CheckIcon /> : <XIcon />}
              {msg.text}
            </div>
          )}

          {/* Formulario */}
          {(!testimonio || editando) ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">
                  {testimonio ? "Editar testimonio" : "Escribe tu testimonio"}
                </h2>
                <p className="text-slate-500 text-xs mt-1">Máximo 500 caracteres. El equipo lo revisará antes de publicarlo.</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">

                {/* Cargo del perfil — solo lectura */}
                {user.cargo && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <BuildingIcon />
                    <span className="text-sm text-slate-600 font-medium">{user.cargo}</span>
                    <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                      <SettingsIcon /> desde tu perfil
                    </span>
                  </div>
                )}
                {!user.cargo && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                    <InfoIcon />
                    <span>
                      No tienes cargo configurado. Ve a{" "}
                      <strong>Ajustes → Mi Perfil</strong> para agregarlo — aparecerá en tu testimonio.
                    </span>
                  </div>
                )}

                {/* Contenido */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tu experiencia *
                  </label>
                  <textarea
                    value={contenido}
                    onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                    rows={5} required minLength={10} maxLength={500}
                    placeholder="Cuéntanos cómo ha sido tu experiencia..."
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 resize-none transition"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-slate-400">Mínimo 10 caracteres</span>
                    <span className={`text-xs ${contenido.length > 450 ? "text-amber-500" : "text-slate-400"}`}>
                      {contenido.length}/500
                    </span>
                  </div>
                </div>

                {/* Estrellas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Calificación *
                  </label>
                  <Stars value={estrellas} onChange={n => setForm(f => ({ ...f, estrellas: n }))} />
                  <p className="text-xs text-slate-400 mt-1">
                    {["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"][estrellas] ?? ""}
                  </p>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition">
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enviando…
                      </span>
                    ) : testimonio ? "Actualizar" : "Enviar testimonio"}
                  </button>
                  {editando && (
                    <button type="button" onClick={() => { setEditando(false); setMsg(null); }}
                      className="px-5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-sm transition">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            /* Vista del testimonio existente */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-800">Tu testimonio</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {testimonio.created_at
                      ? `Enviado el ${new Date(testimonio.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}`
                      : "Enviado recientemente"}
                  </p>
                </div>
                <EstadoBadge estado={testimonio.estado ?? "pendiente"} />
              </div>
              <div className="p-6 space-y-4">
                <Stars value={testimonio.estrellas ?? 5} />
                <blockquote className="pl-4 border-l-4 border-purple-200">
                  <p className="text-slate-700 text-sm leading-relaxed italic">"{testimonio.contenido ?? ""}"</p>
                </blockquote>
                {testimonio.cargo_empresa && (
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <BuildingIcon />{testimonio.cargo_empresa}
                  </p>
                )}
                {testimonio.estado === "pendiente" && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                    <ClockIcon /><span>Tu testimonio está en revisión. Será publicado una vez aprobado.</span>
                  </div>
                )}
                {testimonio.estado === "rechazado" && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
                    <XIcon /><span>Tu testimonio no fue aprobado. Puedes editarlo y reenviarlo.</span>
                  </div>
                )}
                {testimonio.estado === "aprobado" && (
                  <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700">
                    <CheckIcon /><span>Tu testimonio está publicado. Si lo editas volverá a revisión.</span>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setEditando(true); setMsg(null); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-semibold rounded-xl text-xs transition">
                    <EditIcon /> Editar
                  </button>
                  <button onClick={handleEliminar}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-xs transition">
                    <TrashIcon /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3.5 text-sm text-purple-700 flex gap-3">
            <span className="shrink-0 mt-0.5"><InfoIcon /></span>
            <p>
              <strong>¿Cómo funciona?</strong> Envías tu testimonio, el equipo lo revisa y si es aprobado aparece en la sección pública. El cargo mostrado se toma automáticamente de tu perfil.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}