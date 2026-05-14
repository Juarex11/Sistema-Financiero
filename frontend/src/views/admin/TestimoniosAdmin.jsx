import { useState, useEffect, useCallback } from "react";

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

// ── Iconos SVG ────────────────────────────────────────────────────────────────
const CheckIcon    = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const XIcon        = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const UndoIcon     = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>;
const StarOnIcon   = () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
const StarOffIcon  = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
const TrashIcon    = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const BuildingIcon = () => <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const ChatIcon     = () => <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const AlertIcon    = () => <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const PulseIcon    = () => <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />;

// ── Componentes ───────────────────────────────────────────────────────────────
function Stars({ value }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`text-base ${n <= value ? "text-amber-400" : "text-slate-200"}`}>★</span>
      ))}
    </div>
  );
}

function EstadoBadge({ estado }) {
  const styles = {
    pendiente: "bg-amber-50 text-amber-700 border-amber-200",
    aprobado:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    rechazado: "bg-red-50 text-red-700 border-red-200",
  };
  const labels = { pendiente: "Pendiente", aprobado: "Aprobado", rechazado: "Rechazado" };
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${styles[estado] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {labels[estado] ?? estado}
    </span>
  );
}

function Avatar({ foto, nombre }) {
  return foto ? (
    <img src={foto} alt={nombre} className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
      <span className="text-white font-bold">{nombre?.[0]?.toUpperCase()}</span>
    </div>
  );
}

const TABS = [
  { key: "todos",     label: "Todos"      },
  { key: "pendiente", label: "Pendientes" },
  { key: "aprobado",  label: "Aprobados"  },
  { key: "rechazado", label: "Rechazados" },
];

// ═════════════════════════════════════════════════════════════════════════════
export default function TestimoniosAdmin({ user, onPendientesChange }) {
  const [testimonios, setTestimonios] = useState([]);
  const [tab,         setTab]         = useState("todos");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [accionando,  setAccionando]  = useState(null);

  const cargar = useCallback((estado = "todos") => {
    setLoading(true);
    setError(null);
    const qs = estado !== "todos" ? `?estado=${estado}` : "";

    apiFetch(`/admin/testimonios${qs}`, user.token)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);
        const lista = Array.isArray(data) ? data : [];
        setTestimonios(lista);
        const pendientes = estado === "todos"
          ? lista.filter(t => t.estado === "pendiente").length
          : estado === "pendiente" ? lista.length : 0;
        onPendientesChange?.(pendientes);
      })
      .catch(err => {
        setError(err.message ?? "Error al cargar testimonios.");
        setTestimonios([]);
      })
      .finally(() => setLoading(false));
  }, [user.token]);

  useEffect(() => { cargar(); }, [cargar]);

  const accion = async (id, fn) => {
    setAccionando(id);
    try { await fn(); } catch {}
    await cargar(tab);
    setAccionando(null);
  };

  const cambiarEstado  = (id, estado) => accion(id, () => apiFetch(`/admin/testimonios/${id}/estado`, user.token, { method: "PATCH", body: JSON.stringify({ estado }) }));
  const toggleDestacado = (id)        => accion(id, () => apiFetch(`/admin/testimonios/${id}/destacar`, user.token, { method: "PATCH" }));
  const eliminar = (id) => {
    if (!confirm("¿Eliminar este testimonio definitivamente?")) return;
    accion(id, () => apiFetch(`/admin/testimonios/${id}`, user.token, { method: "DELETE" }));
  };

  const handleTab = (key) => { setTab(key); cargar(key); };

  const counts = {
    todos:     testimonios.length,
    pendiente: testimonios.filter(t => t.estado === "pendiente").length,
    aprobado:  testimonios.filter(t => t.estado === "aprobado").length,
    rechazado: testimonios.filter(t => t.estado === "rechazado").length,
  };

  const lista = tab === "todos" ? testimonios : testimonios.filter(t => t.estado === tab);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Testimonios</h1>
          <p className="text-slate-500 text-sm mt-1">Aprueba, rechaza o destaca los testimonios de los usuarios.</p>
        </div>
        {counts.pendiente > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-xl shrink-0">
            <PulseIcon />
            {counts.pendiente} pendiente{counts.pendiente > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-4 text-sm space-y-2">
          <p className="font-semibold flex items-center gap-2"><AlertIcon /> Error al cargar testimonios</p>
          <p className="font-mono text-xs bg-red-100 px-3 py-2 rounded-lg">{error}</p>
          <p className="text-xs text-red-500">Revisa el log de Laravel: <code>storage/logs/laravel.log</code></p>
          <button onClick={() => cargar(tab)}
            className="mt-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition">
            Reintentar
          </button>
        </div>
      )}

      {/* Stats */}
      {!error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: "todos",     label: "Total",      color: "bg-slate-50   border-slate-200   text-slate-700"   },
            { key: "pendiente", label: "Pendientes", color: "bg-amber-50   border-amber-200   text-amber-700"   },
            { key: "aprobado",  label: "Aprobados",  color: "bg-emerald-50 border-emerald-200 text-emerald-700" },
            { key: "rechazado", label: "Rechazados", color: "bg-red-50     border-red-200     text-red-700"     },
          ].map(s => (
            <button key={s.key} onClick={() => handleTab(s.key)}
              className={`${s.color} border rounded-xl p-4 text-left transition hover:shadow-sm ${tab === s.key ? "ring-2 ring-purple-400 ring-offset-1" : ""}`}>
              <p className="text-2xl font-bold">{counts[s.key]}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-70">{s.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      {!error && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => handleTab(t.key)}
              className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === t.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
              {t.key === "pendiente" && counts.pendiente > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {counts.pendiente}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : !error && lista.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
            <ChatIcon />
          </div>
          <p className="font-medium text-slate-500">
            No hay testimonios {tab !== "todos" ? `en "${TABS.find(t => t.key === tab)?.label}"` : ""}
          </p>
        </div>
      ) : !error && (
        <div className="space-y-4">
          {lista.map(t => (
            <div key={t.id}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200 ${t.destacado ? "border-amber-300 ring-1 ring-amber-100" : "border-slate-200"} ${accionando === t.id ? "opacity-60 pointer-events-none" : ""}`}>

              {/* Cabecera */}
              <div className="px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-50">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar foto={t.foto} nombre={t.nombre} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{t.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{t.email}</p>
                    {t.cargo_empresa && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                        <BuildingIcon />{t.cargo_empresa}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.destacado && (
                    <span className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
                      <StarOnIcon /> Destacado
                    </span>
                  )}
                  <EstadoBadge estado={t.estado} />
                </div>
              </div>

              {/* Contenido */}
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Stars value={t.estrellas} />
                  <span className="text-xs text-slate-400">
                    {new Date(t.created_at).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>

                <blockquote className="border-l-4 border-purple-200 pl-4 text-slate-600 text-sm leading-relaxed italic">
                  "{t.contenido}"
                </blockquote>

                {/* Acciones */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {t.estado !== "aprobado" && (
                    <button onClick={() => cambiarEstado(t.id, "aprobado")}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-xl text-xs transition border border-emerald-200">
                      <CheckIcon /> Aprobar
                    </button>
                  )}
                  {t.estado !== "pendiente" && (
                    <button onClick={() => cambiarEstado(t.id, "pendiente")}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded-xl text-xs transition border border-amber-200">
                      <UndoIcon /> En revisión
                    </button>
                  )}
                  {t.estado !== "rechazado" && (
                    <button onClick={() => cambiarEstado(t.id, "rechazado")}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl text-xs transition border border-red-200">
                      <XIcon /> Rechazar
                    </button>
                  )}
                  {t.estado === "aprobado" && (
                    <button onClick={() => toggleDestacado(t.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 font-semibold rounded-xl text-xs transition border ${t.destacado ? "bg-amber-100 hover:bg-amber-200 text-amber-700 border-amber-300" : "bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border-slate-200 hover:border-amber-200"}`}>
                      {t.destacado ? <><StarOnIcon /> Quitar destacado</> : <><StarOffIcon /> Destacar</>}
                    </button>
                  )}
                  <button onClick={() => eliminar(t.id)}
                    className="ml-auto flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 font-semibold rounded-xl text-xs transition border border-slate-200 hover:border-red-200">
                    <TrashIcon /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}