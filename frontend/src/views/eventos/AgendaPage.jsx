import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import AgendaModal from "./AgendaModal";
import AgendaDetalle from "./AgendaDetalle";

const API = import.meta.env.VITE_API_URL;

const apiFetch = (url, token, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  });

// ── Iconos ────────────────────────────────────────────────────────────────────
const PlusIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>;
const CalIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
const ListIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>;
const ChevronL    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>;
const ChevronR    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>;
const FilterIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/></svg>;

// ── Constantes ────────────────────────────────────────────────────────────────
const TIPOS = [
  { value: "cita",         label: "Cita",         color: "bg-blue-500",   light: "bg-blue-50 text-blue-700 border-blue-200"   },
  { value: "reunion",      label: "Reunión",       color: "bg-violet-500", light: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "evento",       label: "Evento",        color: "bg-emerald-500",light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "recordatorio", label: "Recordatorio",  color: "bg-amber-500",  light: "bg-amber-50 text-amber-700 border-amber-200"  },
  { value: "tarea",        label: "Tarea",         color: "bg-rose-500",   light: "bg-rose-50 text-rose-700 border-rose-200"    },
];

const ESTADOS = [
  { value: "pendiente",   label: "Pendiente",   cls: "bg-gray-100 text-gray-600"       },
  { value: "confirmada",  label: "Confirmada",  cls: "bg-blue-100 text-blue-700"       },
  { value: "en_proceso",  label: "En proceso",  cls: "bg-amber-100 text-amber-700"     },
  { value: "finalizada",  label: "Finalizada",  cls: "bg-emerald-100 text-emerald-700" },
  { value: "cancelada",   label: "Cancelada",   cls: "bg-red-100 text-red-600"         },
];

export { TIPOS, ESTADOS };

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTipoInfo(tipo) {
  return TIPOS.find(t => t.value === tipo) ?? TIPOS[0];
}
function getEstadoInfo(estado) {
  return ESTADOS.find(e => e.value === estado) ?? ESTADOS[0];
}
function formatHora(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}
function formatFechaCorta(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
}
function isSameDay(iso, year, month, day) {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
}
function isToday(year, month, day) {
  const t = new Date();
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day;
}

// ── Badge estado ──────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const info = getEstadoInfo(estado);
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${info.cls}`}>
      {info.label}
    </span>
  );
}

// ── Card evento en lista ──────────────────────────────────────────────────────
function EventoRow({ evento, onClick }) {
  const tipo = getTipoInfo(evento.tipo);
  return (
    <button
      onClick={() => onClick(evento)}
      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition rounded-xl group"
    >
      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${tipo.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-800 truncate">{evento.titulo}</p>
          {evento.tipo === "cita" && <EstadoBadge estado={evento.estado} />}
          {evento.vencido && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              Vencido
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${tipo.light}`}>
            {tipo.label}
          </span>
          <span className="text-xs text-gray-400">
            {formatFechaCorta(evento.fecha_inicio)} · {formatHora(evento.fecha_inicio)}
            {evento.fecha_fin && ` — ${formatHora(evento.fecha_fin)}`}
          </span>
          {evento.lugar && <span className="text-xs text-gray-400 truncate">📍 {evento.lugar}</span>}
        </div>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  );
}

// ── Vista lista ───────────────────────────────────────────────────────────────
function VistaLista({ eventos, onClickEvento, onNuevo }) {
  const grupos = {};
  eventos.forEach(e => {
    const d = new Date(e.fecha_inicio);
    const key = d.toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(e);
  });

  if (eventos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
          <CalIcon />
        </div>
        <p className="font-medium text-gray-500 text-sm">No hay eventos</p>
        <p className="text-xs mt-1 mb-4">Crea tu primer evento para comenzar</p>
        <button
          onClick={onNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition"
        >
          <PlusIcon /> Nuevo evento
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grupos).map(([fecha, evs]) => (
        <div key={fecha}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-2 capitalize">
            {fecha}
          </p>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-50">
            {evs.map(e => <EventoRow key={e.id} evento={e} onClick={onClickEvento} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Vista calendario ──────────────────────────────────────────────────────────
function VistaCalendario({ eventos, onClickEvento, onClickDia }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventosDia = (day) =>
    eventos.filter(e => isSameDay(e.fecha_inicio, year, month, day));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header mes */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
          <ChevronL />
        </button>
        <h2 className="text-sm font-bold text-gray-800">{MESES[month]} {year}</h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
          <ChevronR />
        </button>
      </div>

      {/* Días semana */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-2">{d}</div>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-50" />;
          const evsDia = getEventosDia(day);
          const today  = isToday(year, month, day);
          return (
            <div
              key={day}
              onClick={() => onClickDia(new Date(year, month, day), evsDia)}
              className="min-h-[80px] border-b border-r border-gray-50 p-1.5 cursor-pointer hover:bg-gray-50 transition"
            >
              <div className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                today ? "bg-purple-600 text-white" : "text-gray-700"
              }`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {evsDia.slice(0, 2).map(e => {
                  const tipo = getTipoInfo(e.tipo);
                  return (
                    <div
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); onClickEvento(e); }}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer ${tipo.light} border`}
                    >
                      {e.titulo}
                    </div>
                  );
                })}
                {evsDia.length > 2 && (
                  <div className="text-[10px] text-gray-400 px-1">+{evsDia.length - 2} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal día ─────────────────────────────────────────────────────────────────
function ModalDia({ fecha, eventos, onClose, onClickEvento, onNuevo }) {
  const label = fecha.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" });
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 capitalize">{label}</p>
            <p className="text-sm font-bold text-gray-800">{eventos.length} evento{eventos.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); onNuevo(fecha); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
            >
              <PlusIcon /> Nuevo
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {eventos.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <p className="text-sm">Sin eventos este día</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {eventos.map(e => <EventoRow key={e.id} evento={e} onClick={(ev) => { onClose(); onClickEvento(ev); }} />)}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Resumen stats ─────────────────────────────────────────────────────────────
function ResumenCards({ resumen }) {
  const cards = [
    { label: "Hoy",        value: resumen.hoy,        color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Esta semana",value: resumen.proximos,    color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Pendientes", value: resumen.pendientes,  color: "text-amber-600",  bg: "bg-amber-50"  },
    { label: "Vencidos",   value: resumen.vencidos,    color: "text-red-600",    bg: "bg-red-50"    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className={`${c.bg} rounded-2xl px-4 py-3`}>
          <p className={`text-2xl font-bold ${c.color}`}>{c.value ?? 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function AgendaPage({ user }) {
  const [eventos,      setEventos]      = useState([]);
  const [resumen,      setResumen]      = useState({});
  const [loading,      setLoading]      = useState(true);
  const [vista,        setVista]        = useState("lista"); // "lista" | "calendario"
  const [filtroTipo,   setFiltroTipo]   = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalNuevo,   setModalNuevo]   = useState(false);
  const [fechaInicial, setFechaInicial] = useState(null);
  const [editando,     setEditando]     = useState(null);
  const [detalle,      setDetalle]      = useState(null);
  const [modalDia,     setModalDia]     = useState(null); // { fecha, eventos }
  const [confirmDel,   setConfirmDel]   = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroTipo)   params.append("tipo",   filtroTipo);
    if (filtroEstado) params.append("estado", filtroEstado);

    Promise.all([
      apiFetch(`/agenda?${params}`, user.token).then(r => r.json()),
      apiFetch("/agenda/resumen",   user.token).then(r => r.json()),
    ])
      .then(([evs, res]) => {
        setEventos(Array.isArray(evs) ? evs : []);
        setResumen(res ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.token, filtroTipo, filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleGuardado = () => {
    setModalNuevo(false);
    setEditando(null);
    setFechaInicial(null);
    cargar();
  };

  const handleEliminar = async () => {
    await apiFetch(`/agenda/${confirmDel}`, user.token, { method: "DELETE" });
    setConfirmDel(null);
    setDetalle(null);
    cargar();
  };

  const handleEditarDesdeDetalle = (evento) => {
    setDetalle(null);
    setEditando(evento);
    setModalNuevo(true);
  };

  const handleNuevoEnDia = (fecha) => {
    setFechaInicial(fecha);
    setEditando(null);
    setModalNuevo(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona tus citas, reuniones y eventos</p>
        </div>
        <button
          onClick={() => { setEditando(null); setFechaInicial(null); setModalNuevo(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <PlusIcon /> Nuevo
        </button>
      </div>

      {/* Stats */}
      {!loading && <ResumenCards resumen={resumen} />}

      {/* Filtros + vista toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 text-gray-400">
          <FilterIcon />
        </div>

        {/* Tipo */}
        <select
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Estado */}
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>

        {(filtroTipo || filtroEstado) && (
          <button
            onClick={() => { setFiltroTipo(""); setFiltroEstado(""); }}
            className="text-xs text-red-500 hover:underline"
          >
            Limpiar
          </button>
        )}

        {/* Toggle vista */}
        <div className="ml-auto flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setVista("lista")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${vista === "lista" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <ListIcon /> Lista
          </button>
          <button
            onClick={() => setVista("calendario")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${vista === "calendario" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <CalIcon /> Calendario
          </button>
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : vista === "lista" ? (
        <VistaLista
          eventos={eventos}
          onClickEvento={setDetalle}
          onNuevo={() => { setEditando(null); setFechaInicial(null); setModalNuevo(true); }}
        />
      ) : (
        <VistaCalendario
          eventos={eventos}
          onClickEvento={setDetalle}
          onClickDia={(fecha, evs) => setModalDia({ fecha, eventos: evs })}
        />
      )}

      {/* Modal nuevo/editar */}
      {modalNuevo && (
        <AgendaModal
          editando={editando}
          fechaInicial={fechaInicial}
          token={user.token}
          onClose={() => { setModalNuevo(false); setEditando(null); setFechaInicial(null); }}
          onGuardado={handleGuardado}
        />
      )}

      {/* Detalle */}
      {detalle && (
        <AgendaDetalle
          evento={detalle}
          token={user.token}
          onClose={() => setDetalle(null)}
          onEditar={handleEditarDesdeDetalle}
          onEliminar={(id) => setConfirmDel(id)}
          onActualizado={(eventoActualizado) => {
            setDetalle(eventoActualizado);
            cargar();
          }}
        />
      )}

      {/* Modal día (calendario) */}
      {modalDia && (
        <ModalDia
          fecha={modalDia.fecha}
          eventos={modalDia.eventos}
          onClose={() => setModalDia(null)}
          onClickEvento={setDetalle}
          onNuevo={handleNuevoEnDia}
        />
      )}

      {/* Confirm eliminar */}
      {confirmDel && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setConfirmDel(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Eliminar evento</h3>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer. ¿Estás seguro?</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button onClick={() => setConfirmDel(null)} className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Cancelar</button>
              <div className="w-px bg-gray-100" />
              <button onClick={handleEliminar} className="flex-1 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition">Eliminar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}