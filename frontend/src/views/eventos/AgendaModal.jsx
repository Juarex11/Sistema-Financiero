import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const API = import.meta.env.VITE_API_URL;

const apiFetch = (url, token, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  });

const XIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>;

const TIPOS = [
  { value: "cita",         label: "Cita",        emoji: "🩺" },
  { value: "reunion",      label: "Reunión",      emoji: "👥" },
  { value: "evento",       label: "Evento",       emoji: "📅" },
  { value: "recordatorio", label: "Recordatorio", emoji: "🔔" },
  { value: "tarea",        label: "Tarea",        emoji: "✅" },
];

const ESTADOS = [
  { value: "pendiente",  label: "Pendiente"  },
  { value: "confirmada", label: "Confirmada" },
  { value: "en_proceso", label: "En proceso" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada",  label: "Cancelada"  },
];

const PRIORIDADES = [
  { value: "baja",  label: "Baja",  color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "media", label: "Media", color: "text-amber-600 bg-amber-50 border-amber-200"       },
  { value: "alta",  label: "Alta",  color: "text-red-600 bg-red-50 border-red-200"             },
];

const RECORDATORIOS = [
  { value: "",     label: "Sin recordatorio" },
  { value: "0",    label: "Al momento"       },
  { value: "15",   label: "15 minutos antes" },
  { value: "30",   label: "30 minutos antes" },
  { value: "60",   label: "1 hora antes"     },
  { value: "120",  label: "2 horas antes"    },
  { value: "1440", label: "1 día antes"      },
];

const REPETICIONES = [
  { value: "ninguna",  label: "Sin repetición" },
  { value: "diaria",   label: "Diaria"         },
  { value: "semanal",  label: "Semanal"        },
  { value: "mensual",  label: "Mensual"        },
  { value: "anual",    label: "Anual"          },
];

const COLORES = ["#6366f1","#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4"];

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fechaParaInput(fecha) {
  if (!fecha) return "";
  const d = new Date(fecha);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T08:00`;
}

export default function AgendaModal({ editando, fechaInicial, token, onClose, onGuardado }) {
  const [form, setForm] = useState({
    tipo:                 editando?.tipo                 ?? "cita",
    titulo:               editando?.titulo               ?? "",
    descripcion:          editando?.descripcion          ?? "",
    lugar:                editando?.lugar                ?? "",
    link_reunion:         editando?.link_reunion         ?? "",
    fecha_inicio:         editando ? toLocalInput(editando.fecha_inicio) : fechaParaInput(fechaInicial),
    fecha_fin:            editando ? toLocalInput(editando.fecha_fin)    : "",
    todo_el_dia:          editando?.todo_el_dia          ?? false,
    recordatorio_minutos: editando?.recordatorio_minutos != null ? String(editando.recordatorio_minutos) : "",
    estado:               editando?.estado               ?? "pendiente",
    motivo_cancelacion:   editando?.motivo_cancelacion   ?? "",
    color:                editando?.color                ?? "#6366f1",
    prioridad:            editando?.prioridad            ?? "media",
    repeticion:           editando?.repeticion           ?? "ninguna",
    repeticion_hasta:     editando?.repeticion_hasta     ?? "",
  });

  const [contactos, setContactos] = useState(
    editando?.contactos?.map(c => ({ ...c })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [tab,    setTab]    = useState("general"); // "general" | "contactos" | "opciones"

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addContacto = () => setContactos(prev => [...prev, { nombre: "", email: "", telefono: "", empresa: "", cargo: "", rol: "cliente" }]);
  const removeContacto = (i) => setContactos(prev => prev.filter((_, idx) => idx !== i));
  const setContacto = (i, key, val) => setContactos(prev => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setError("El título es obligatorio."); return; }
    if (!form.fecha_inicio)  { setError("La fecha de inicio es obligatoria."); return; }
    setSaving(true);
    setError(null);

    const payload = {
      tipo:        form.tipo,
      titulo:      form.titulo,
      descripcion: form.descripcion || undefined,
      lugar:       form.lugar       || undefined,
      link_reunion:form.link_reunion || undefined,
      fecha_inicio:form.fecha_inicio,
      fecha_fin:   form.fecha_fin   || undefined,
      todo_el_dia: form.todo_el_dia,
      recordatorio_minutos: form.recordatorio_minutos !== "" ? Number(form.recordatorio_minutos) : undefined,
      estado:      form.estado,
      motivo_cancelacion: form.estado === "cancelada" ? form.motivo_cancelacion : undefined,
      color:       form.color,
      prioridad:   form.prioridad,
      repeticion:  form.repeticion,
      repeticion_hasta: form.repeticion !== "ninguna" ? form.repeticion_hasta || undefined : undefined,
      contactos:   contactos.filter(c => c.nombre.trim()),
    };

    try {
      const url    = editando ? `/agenda/${editando.id}` : "/agenda/";
      const method = editando ? "PUT" : "POST";
      const res    = await apiFetch(url, token, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Error al guardar.");
      onGuardado(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition";
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onTouchEnd={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: form.color + "22" }}>
              {TIPOS.find(t => t.value === form.tipo)?.emoji ?? "📅"}
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                {editando ? "Editar evento" : "Nuevo evento"}
              </h2>
              <p className="text-xs text-gray-400">Completa la información del evento</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition">
            <XIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {[
            { key: "general",   label: "General"   },
            { key: "contactos", label: `Contactos${contactos.length > 0 ? ` (${contactos.length})` : ""}` },
            { key: "opciones",  label: "Opciones"  },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 transition ${
                tab === t.key ? "border-purple-600 text-purple-700" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} id="agenda-form">
            <div className="p-6 space-y-5">

              {/* ── Tab General ── */}
              {tab === "general" && (
                <>
                  {/* Tipo */}
                  <div>
                    <label className={labelCls}>Tipo de evento</label>
                    <div className="grid grid-cols-5 gap-2">
                      {TIPOS.map(t => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => set("tipo", t.value)}
                          className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition ${
                            form.tipo === t.value
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-lg">{t.emoji}</span>
                          <span className="text-[10px]">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Título */}
                  <div>
                    <label className={labelCls}>Título *</label>
                    <input
                      type="text"
                      value={form.titulo}
                      onChange={e => set("titulo", e.target.value)}
                      maxLength={255}
                      placeholder="¿De qué trata este evento?"
                      className={inputCls}
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className={labelCls}>Descripción <span className="font-normal text-gray-400">(opcional)</span></label>
                    <textarea
                      value={form.descripcion}
                      onChange={e => set("descripcion", e.target.value)}
                      rows={3}
                      maxLength={5000}
                      placeholder="Detalles adicionales..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Fecha y hora inicio *</label>
                      <input
                        type="datetime-local"
                        value={form.fecha_inicio}
                        onChange={e => set("fecha_inicio", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Fecha y hora fin <span className="font-normal text-gray-400">(opcional)</span></label>
                      <input
                        type="datetime-local"
                        value={form.fecha_fin}
                        onChange={e => set("fecha_fin", e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Todo el día */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => set("todo_el_dia", !form.todo_el_dia)}
                      className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${form.todo_el_dia ? "bg-purple-600" : "bg-gray-300"}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.todo_el_dia ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <span className="text-sm text-gray-600">Todo el día</span>
                  </div>

                  {/* Lugar / Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Lugar <span className="font-normal text-gray-400">(opcional)</span></label>
                      <input
                        type="text"
                        value={form.lugar}
                        onChange={e => set("lugar", e.target.value)}
                        placeholder="Dirección o sala"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Link reunión <span className="font-normal text-gray-400">(opcional)</span></label>
                      <input
                        type="url"
                        value={form.link_reunion}
                        onChange={e => set("link_reunion", e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Estado (solo citas) */}
                  {form.tipo === "cita" && (
                    <div>
                      <label className={labelCls}>Estado de la cita</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {ESTADOS.map(e => (
                          <button
                            key={e.value}
                            type="button"
                            onClick={() => set("estado", e.value)}
                            className={`py-2 rounded-xl text-xs font-semibold border transition ${
                              form.estado === e.value
                                ? "bg-purple-600 text-white border-purple-600"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-purple-300"
                            }`}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                      {form.estado === "cancelada" && (
                        <div className="mt-3">
                          <label className={labelCls}>Motivo de cancelación</label>
                          <textarea
                            value={form.motivo_cancelacion}
                            onChange={e => set("motivo_cancelacion", e.target.value)}
                            rows={2}
                            maxLength={1000}
                            placeholder="¿Por qué se canceló?"
                            className={`${inputCls} resize-none`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ── Tab Contactos ── */}
              {tab === "contactos" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Agrega clientes o participantes del evento</p>
                    <button
                      type="button"
                      onClick={addContacto}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      <PlusIcon /> Agregar
                    </button>
                  </div>

                  {contactos.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                      <p className="text-sm">Sin contactos aún</p>
                      <p className="text-xs mt-1">Haz clic en "Agregar" para añadir uno</p>
                    </div>
                  )}

                  {contactos.map((c, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-4 space-y-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-gray-600">Contacto {i + 1}</p>
                        <button type="button" onClick={() => removeContacto(i)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition">
                          <TrashIcon />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Nombre *</label>
                          <input type="text" value={c.nombre} onChange={e => setContacto(i, "nombre", e.target.value)}
                            placeholder="Nombre completo" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Email</label>
                          <input type="email" value={c.email} onChange={e => setContacto(i, "email", e.target.value)}
                            placeholder="correo@ejemplo.com" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Teléfono</label>
                          <input type="text" value={c.telefono} onChange={e => setContacto(i, "telefono", e.target.value)}
                            placeholder="+51 999 999 999" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Empresa</label>
                          <input type="text" value={c.empresa} onChange={e => setContacto(i, "empresa", e.target.value)}
                            placeholder="Empresa S.A.C." className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Cargo</label>
                          <input type="text" value={c.cargo} onChange={e => setContacto(i, "cargo", e.target.value)}
                            placeholder="Gerente, Director..." className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Rol</label>
                          <select value={c.rol} onChange={e => setContacto(i, "rol", e.target.value)} className={inputCls}>
                            <option value="cliente">Cliente</option>
                            <option value="participante">Participante</option>
                            <option value="organizador">Organizador</option>
                            <option value="invitado">Invitado</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Tab Opciones ── */}
              {tab === "opciones" && (
                <div className="space-y-5">

                  {/* Prioridad */}
                  <div>
                    <label className={labelCls}>Prioridad</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRIORIDADES.map(p => (
                        <button key={p.value} type="button" onClick={() => set("prioridad", p.value)}
                          className={`py-2 rounded-xl text-xs font-semibold border transition ${
                            form.prioridad === p.value ? p.color : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                          }`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recordatorio */}
                  <div>
                    <label className={labelCls}>Recordatorio</label>
                    <select value={form.recordatorio_minutos} onChange={e => set("recordatorio_minutos", e.target.value)} className={inputCls}>
                      {RECORDATORIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>

                  {/* Repetición */}
                  <div>
                    <label className={labelCls}>Repetición</label>
                    <select value={form.repeticion} onChange={e => set("repeticion", e.target.value)} className={inputCls}>
                      {REPETICIONES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {form.repeticion !== "ninguna" && (
                      <div className="mt-3">
                        <label className={labelCls}>Repetir hasta</label>
                        <input type="date" value={form.repeticion_hasta}
                          onChange={e => set("repeticion_hasta", e.target.value)} className={inputCls} />
                      </div>
                    )}
                  </div>

                  {/* Color */}
                  <div>
                    <label className={labelCls}>Color de etiqueta</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {COLORES.map(c => (
                        <button key={c} type="button" onClick={() => set("color", c)}
                          className={`w-8 h-8 rounded-full transition-transform ${form.color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button form="agenda-form" type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Guardando…
              </>
            ) : editando ? "Guardar cambios" : "Crear evento"}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}