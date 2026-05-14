import { useState, useRef } from "react";
import { createPortal } from "react-dom";

const API = import.meta.env.VITE_API_URL;

const apiFetch = (url, token, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  });

const XIcon      = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
const EditIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const TrashIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;
const PlusIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>;
const UploadIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>;
const LinkIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>;
const PinIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;

const TIPOS = [
  { value: "cita",         label: "Cita",        emoji: "🩺", color: "bg-blue-500",    light: "bg-blue-50 text-blue-700"      },
  { value: "reunion",      label: "Reunión",      emoji: "👥", color: "bg-violet-500",  light: "bg-violet-50 text-violet-700"  },
  { value: "evento",       label: "Evento",       emoji: "📅", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700"},
  { value: "recordatorio", label: "Recordatorio", emoji: "🔔", color: "bg-amber-500",   light: "bg-amber-50 text-amber-700"   },
  { value: "tarea",        label: "Tarea",        emoji: "✅", color: "bg-rose-500",    light: "bg-rose-50 text-rose-700"     },
];

const ESTADOS = [
  { value: "pendiente",  label: "Pendiente",  cls: "bg-gray-100 text-gray-600",      dot: "bg-gray-400"    },
  { value: "confirmada", label: "Confirmada", cls: "bg-blue-100 text-blue-700",       dot: "bg-blue-500"    },
  { value: "en_proceso", label: "En proceso", cls: "bg-amber-100 text-amber-700",     dot: "bg-amber-500"   },
  { value: "finalizada", label: "Finalizada", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  { value: "cancelada",  label: "Cancelada",  cls: "bg-red-100 text-red-600",         dot: "bg-red-500"     },
];

const PRIORIDADES = {
  baja:  { label: "Baja",  cls: "text-emerald-600 bg-emerald-50" },
  media: { label: "Media", cls: "text-amber-600 bg-amber-50"     },
  alta:  { label: "Alta",  cls: "text-red-600 bg-red-50"         },
};

function getTipo(tipo)  { return TIPOS.find(t => t.value === tipo)  ?? TIPOS[0];  }
function getEstado(est) { return ESTADOS.find(e => e.value === est) ?? ESTADOS[0]; }

function abrirEnGoogleCalendar(evento) {
  const fmt = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action:   "TEMPLATE",
    text:     evento.titulo,
    dates:    `${fmt(evento.fecha_inicio)}/${fmt(evento.fecha_fin ?? evento.fecha_inicio)}`,
    details:  evento.descripcion ?? "",
    location: evento.lugar ?? "",
  });
  window.open(`https://calendar.google.com/calendar/render?${params}`, "_blank");
}

function formatFechaLarga(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}
function formatHora(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}
function tiempoAtras(iso) {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d >= 1) return `hace ${d}d`;
  if (h >= 1) return `hace ${h}h`;
  if (m >= 1) return `hace ${m}m`;
  return "ahora";
}

function Seccion({ titulo, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
      >
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{titulo}</p>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

export default function AgendaDetalle({ evento, token, onClose, onEditar, onEliminar, onActualizado }) {
  const [ev,           setEv]           = useState(evento);
  const [cambiandoEst, setCambiandoEst] = useState(false);
  const [motivoCancel, setMotivoCancel] = useState("");
  const [notaTexto,    setNotaTexto]    = useState("");
  const [savingNota,   setSavingNota]   = useState(false);
  const [subiendo,     setSubiendo]     = useState(false);
  const fileRef = useRef();

  const tipo   = getTipo(ev.tipo);
  const estado = getEstado(ev.estado);
  const prior  = PRIORIDADES[ev.prioridad] ?? PRIORIDADES.media;

  const handleCambiarEstado = async (nuevoEstado) => {
    const payload = { estado: nuevoEstado };
    if (motivoCancel.trim()) payload.motivo_cancelacion = motivoCancel;
    const res = await apiFetch(`/agenda/${ev.id}/estado`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      console.log("Error estado:", JSON.stringify(err, null, 2));
      return;
    }
    const data = await res.json();
    const actualizado = { ...ev, estado: data.estado, motivo_cancelacion: data.motivo_cancelacion };
    setEv(actualizado);
    onActualizado(actualizado);
    setCambiandoEst(false);
    setMotivoCancel("");
  };

  const handleNota = async () => {
    if (!notaTexto.trim()) return;
    setSavingNota(true);
    const res = await apiFetch(`/agenda/${ev.id}/notas`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido: notaTexto }),
    });
    if (res.ok) {
      const nota = await res.json();
      const actualizado = { ...ev, notas: [...(ev.notas ?? []), nota] };
      setEv(actualizado);
      onActualizado(actualizado);
      setNotaTexto("");
    }
    setSavingNota(false);
  };

  const handleEliminarNota = async (notaId) => {
    await apiFetch(`/agenda/${ev.id}/notas/${notaId}`, token, { method: "DELETE" });
    const actualizado = { ...ev, notas: ev.notas.filter(n => n.id !== notaId) };
    setEv(actualizado);
    onActualizado(actualizado);
  };

  const handleArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    const fd = new FormData();
    fd.append("archivo", file);
    const res = await fetch(`${API}/agenda/${ev.id}/archivos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      body: fd,
    });
    if (res.ok) {
      const archivo = await res.json();
      const actualizado = { ...ev, archivos: [...(ev.archivos ?? []), archivo] };
      setEv(actualizado);
      onActualizado(actualizado);
    }
    setSubiendo(false);
    fileRef.current.value = "";
  };

  const handleEliminarArchivo = async (archId) => {
    await apiFetch(`/agenda/${ev.id}/archivos/${archId}`, token, { method: "DELETE" });
    const actualizado = { ...ev, archivos: ev.archivos.filter(a => a.id !== archId) };
    setEv(actualizado);
    onActualizado(actualizado);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-stretch justify-end bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onTouchEnd={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:w-[420px] h-[92dvh] sm:h-full flex flex-col shadow-2xl overflow-hidden rounded-t-2xl sm:rounded-none">

        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-100">
          {/* Handle móvil */}
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: ev.color + "22" }}
              >
                {tipo.emoji}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight truncate">{ev.titulo}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tipo.light}`}>{tipo.label}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${prior.cls}`}>{prior.label}</span>
                  {ev.vencido && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Vencido</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => abrirEnGoogleCalendar(ev)}
                title="Abrir en Google Calendar"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-green-600 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V9h14v10zM5 7V5h14v2H5z"/>
                </svg>
              </button>
              <button
                onClick={() => onEditar(ev)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => onEliminar(ev.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
              >
                <TrashIcon />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
              >
                <XIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          <Seccion titulo="Fecha y hora">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-start gap-2 text-gray-700">
                <span className="text-gray-400 mt-0.5">📅</span>
                <span className="capitalize">{formatFechaLarga(ev.fecha_inicio)}</span>
              </div>
              {!ev.todo_el_dia && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">🕐</span>
                  <span>{formatHora(ev.fecha_inicio)}{ev.fecha_fin && ` — ${formatHora(ev.fecha_fin)}`}</span>
                </div>
              )}
              {ev.todo_el_dia && <p className="text-xs text-gray-400 ml-6">Todo el día</p>}
              {ev.lugar && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400"><PinIcon /></span>
                  <span>{ev.lugar}</span>
                </div>
              )}
              {ev.link_reunion && (
                <a href={ev.link_reunion} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-purple-600 hover:underline">
                  <LinkIcon /> <span className="text-sm truncate">{ev.link_reunion}</span>
                </a>
              )}
              {ev.repeticion && ev.repeticion !== "ninguna" && (
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <span>🔁</span> Repite {ev.repeticion}
                  {ev.repeticion_hasta && ` hasta ${ev.repeticion_hasta}`}
                </div>
              )}
              {ev.recordatorio_minutos != null && (
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <span>🔔</span>
                  {ev.recordatorio_minutos === 0 ? "Al momento" : `${ev.recordatorio_minutos} min antes`}
                </div>
              )}
            </div>
          </Seccion>

          {ev.tipo === "cita" && (
            <Seccion titulo="Estado de la cita">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${estado.dot}`} />
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estado.cls}`}>{estado.label}</span>
                <button
                  onClick={() => setCambiandoEst(o => !o)}
                  className="ml-auto text-xs text-purple-600 hover:underline font-medium"
                >
                  {cambiandoEst ? "Cancelar" : "Cambiar"}
                </button>
              </div>

              {cambiandoEst && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {ESTADOS.filter(e => e.value !== "cancelada").map(e => (
                      <button
                        key={e.value}
                        type="button"
                        onClick={() => handleCambiarEstado(e.value)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          ev.estado === e.value
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-600 hover:border-purple-300"
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <textarea
                      value={motivoCancel}
                      onChange={e => setMotivoCancel(e.target.value)}
                      rows={2}
                      placeholder="Motivo de cancelación (opcional)..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
                    />
                    <button
                      onClick={() => handleCambiarEstado("cancelada")}
                      className="w-full mt-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition"
                    >
                      Marcar como cancelada
                    </button>
                  </div>
                </div>
              )}

              {ev.motivo_cancelacion && (
                <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-2 rounded-xl">
                  <span className="font-semibold">Motivo:</span> {ev.motivo_cancelacion}
                </p>
              )}
            </Seccion>
          )}

          {ev.descripcion && (
            <Seccion titulo="Descripción">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ev.descripcion}</p>
            </Seccion>
          )}

          {ev.contactos?.length > 0 && (
            <Seccion titulo={`Contactos (${ev.contactos.length})`}>
              <div className="space-y-3">
                {ev.contactos.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-purple-600">{c.nombre?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800">{c.nombre}</p>
                      {c.cargo && <p className="text-xs text-gray-400">{c.cargo}{c.empresa ? ` · ${c.empresa}` : ""}</p>}
                      {c.email && <p className="text-xs text-blue-600 truncate">{c.email}</p>}
                      {c.telefono && <p className="text-xs text-gray-500">{c.telefono}</p>}
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 capitalize">{c.rol}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Seccion>
          )}

          <Seccion titulo="Notas">
            <div className="space-y-2 mb-3">
              {(ev.notas ?? []).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">Sin notas todavía</p>
              )}
              {(ev.notas ?? []).map(n => (
                <div key={n.id} className="bg-gray-50 rounded-xl p-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap flex-1">{n.contenido}</p>
                    <button
                      onClick={() => handleEliminarNota(n.id)}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 transition"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">{n.autor} · {tiempoAtras(n.created_at)}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={notaTexto}
                onChange={e => setNotaTexto(e.target.value)}
                rows={2}
                placeholder="Añade una nota..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none"
              />
              <button
                onClick={handleNota}
                disabled={savingNota || !notaTexto.trim()}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition flex items-center justify-center"
              >
                <PlusIcon />
              </button>
            </div>
          </Seccion>

          <Seccion titulo="Archivos">
            <div className="space-y-2 mb-3">
              {(ev.archivos ?? []).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-3">Sin archivos adjuntos</p>
              )}
              {(ev.archivos ?? []).map(a => (
                <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 group">
                  <span className="text-lg shrink-0">
                    {a.tipo_mime?.startsWith("image/") ? "🖼️" : a.tipo_mime?.includes("pdf") ? "📄" : "📎"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <a href={a.url} target="_blank" rel="noreferrer"
                      className="text-sm text-purple-600 hover:underline truncate block">
                      {a.nombre_original}
                    </a>
                    <p className="text-[10px] text-gray-400">{a.tamanio}</p>
                  </div>
                  <button
                    onClick={() => handleEliminarArchivo(a.id)}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 transition"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current.click()}
              disabled={subiendo}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-purple-300 text-gray-400 hover:text-purple-500 rounded-xl py-3 text-xs font-medium transition disabled:opacity-50"
            >
              <UploadIcon /> {subiendo ? "Subiendo..." : "Adjuntar archivo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={handleArchivo}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt"
            />
          </Seccion>

          <div className="px-5 py-4">
            <p className="text-xs text-gray-400">
              Creado por <span className="font-medium text-gray-500">{ev.creador}</span> · {tiempoAtras(ev.created_at)}
            </p>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}