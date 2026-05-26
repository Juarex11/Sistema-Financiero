// views/metas/UserMetas.jsx
import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../../router/authFetch";
import {
  Target, Plus, Pencil, Trash2, CheckCircle2, PauseCircle,
  PlayCircle, Bell, ChevronRight, Loader2, Trophy,
  TrendingUp, ArrowDownCircle, History, Wallet, Clock,
  Lightbulb, AlertTriangle,
} from "lucide-react";

import ModalMetaForm        from "./modal/ModalMetaForm";
import ModalAporte          from "./modal/ModalAporte";
import ModalProgreso        from "./modal/ModalProgreso";
import ModalHistorialAportes from "./modal/ModalHistorialAportes";

/* ─── helpers ───────────────────────────────────────────────────────────────── */
function fmt(n, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(n ?? 0);
}
function fmtFecha(str) {
  if (!str) return null;
  const [y, m, d] = str.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

const ESTADO_CONFIG = {
  activa:     { label: "Activa",     bg: "bg-green-100",  text: "text-green-700"  },
  pausada:    { label: "Pausada",    bg: "bg-amber-100",  text: "text-amber-700"  },
  completada: { label: "Completada", bg: "bg-purple-100", text: "text-purple-700" },
};

/* ─── barra progreso ─────────────────────────────────────────────────────────── */
function BarraProgreso({ progreso, color }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(progreso, 100)}%`, backgroundColor: color ?? "#9333ea" }} />
    </div>
  );
}

/* ─── Panel análisis ─────────────────────────────────────────────────────────── */
function PanelAnalisis({ token, moneda, onAportar }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/metas/analisis", token)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 text-gray-400 py-4">
      <Loader2 size={16} className="animate-spin" />
      <span className="text-xs">Analizando tus finanzas...</span>
    </div>
  );
  if (!data) return null;

  const { ahorro_mensual_promedio, saldo_actual, proyecciones, meses_analizados } = data;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
          <Lightbulb size={16} className="text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">Análisis financiero</p>
          <p className="text-xs text-gray-400">Basado en los últimos {meses_analizados} meses</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 border border-purple-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ahorro mensual promedio</p>
          <p className="text-lg font-bold text-purple-700">{fmt(ahorro_mensual_promedio, moneda)}</p>
        </div>
        <div className="bg-white rounded-xl p-3 border border-purple-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Saldo actual</p>
          <p className="text-lg font-bold text-gray-800">{fmt(saldo_actual, moneda)}</p>
        </div>
      </div>

      {proyecciones?.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-600">Proyecciones de tus metas activas:</p>
          {proyecciones.map(p => (
            <div key={p.meta_id} className="bg-white rounded-xl p-4 border border-purple-100 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color ?? "#9333ea" }} />
                  <span className="text-xs font-bold text-gray-800">{p.nombre}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: p.color ?? "#9333ea" }}>{p.progreso}%</span>
              </div>

              <BarraProgreso progreso={p.progreso} color={p.color} />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Aportado: <b className="text-gray-700">{fmt(p.monto_aportado, moneda)}</b></span>
                <span>Objetivo: <b className="text-gray-700">{fmt(p.monto_objetivo, moneda)}</b></span>
              </div>

              {p.meses_necesarios !== null && p.meses_necesarios > 0 && (
                <div className="bg-purple-50 rounded-lg px-3 py-2 flex items-start gap-2">
                  <Clock size={12} className="text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-purple-700 font-semibold">
                      {p.meses_necesarios === 1
                        ? "Podrías alcanzarla el próximo mes"
                        : `La alcanzarías en ~${p.meses_necesarios} meses (${p.fecha_estimada})`}
                    </p>
                    {p.sugerencia_aporte && (
                      <p className="text-[10px] text-purple-500 mt-0.5">
                        Sugerencia: aporta {fmt(p.sugerencia_aporte, moneda)}/mes (30% de tu ahorro promedio)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {p.meses_necesarios === 0 && (
                <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle2 size={12} className="text-green-500" />
                  <p className="text-[11px] text-green-700 font-semibold">¡Meta alcanzada!</p>
                </div>
              )}

              {p.saldo_cubre && p.progreso < 100 && (
                <div className="bg-blue-50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wallet size={12} className="text-blue-500" />
                    <p className="text-[11px] text-blue-700 font-semibold">
                      Tu saldo actual cubre el objetivo completo
                    </p>
                  </div>
                  <button
                    onClick={() => onAportar({
                      id: p.meta_id, nombre: p.nombre, color: p.color,
                      monto_objetivo: p.monto_objetivo, monto_aportado: p.monto_aportado,
                      moneda, tipo_medicion: "monto",
                    })}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 whitespace-nowrap">
                    Aportar →
                  </button>
                </div>
              )}

              {ahorro_mensual_promedio === 0 && p.restante > 0 && (
                <div className="bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-amber-500" />
                  <p className="text-[11px] text-amber-700">
                    Sin ahorro promedio detectado. Registra más movimientos para obtener proyecciones.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">
          No hay metas activas de tipo monto para proyectar.
        </p>
      )}
    </div>
  );
}

/* ─── Tarjeta de meta ────────────────────────────────────────────────────────── */
function TarjetaMeta({ meta, onEditar, onEliminar, onAportar, onRetirar, onProgreso, onEstado, onHistorial }) {
  const cfg       = ESTADO_CONFIG[meta.estado] ?? ESTADO_CONFIG.activa;
  const progreso  = meta.progreso ?? 0;
  const completada = meta.estado === "completada";
  const esMonto   = meta.tipo_medicion === "monto";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all
      ${completada ? "border-purple-200" : "border-gray-100"}`}>

      {/* Banner */}
      <div className="relative h-28 flex items-center justify-center"
        style={{ backgroundColor: (meta.color ?? "#9333ea") + "22" }}>
        {meta.imagen_url
          ? <img src={meta.imagen_url} alt={meta.nombre}
              className="w-full h-full object-cover absolute inset-0" />
          : <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: meta.color ?? "#9333ea" }}>
              <Target size={28} className="text-white" />
            </div>}

        <span className={`absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>

        {meta.fecha_limite && !completada && (
          <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-gray-600">
            {meta.dias_restantes === 0 ? "¡Hoy!" : meta.dias_restantes > 0 ? `${meta.dias_restantes}d` : "Vencida"}
          </span>
        )}

        {completada && (
          <div className="absolute top-3 right-3 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center">
            <Trophy size={14} className="text-white" />
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-gray-800 truncate">{meta.nombre}</h3>
          {meta.descripcion && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{meta.descripcion}</p>
          )}
        </div>

        {/* Progreso */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 font-medium">Progreso</span>
            <span className="text-xs font-bold" style={{ color: meta.color ?? "#9333ea" }}>{progreso}%</span>
          </div>
          <BarraProgreso progreso={progreso} color={meta.color} />
          <div className="flex items-center justify-between mt-1.5">
            {esMonto ? (
              <>
                <span className="text-xs text-gray-400">{fmt(meta.monto_aportado, meta.moneda)}</span>
                <span className="text-xs font-semibold text-gray-600">{fmt(meta.monto_objetivo, meta.moneda)}</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">{progreso} de 100%</span>
            )}
          </div>
        </div>

        {/* Recordatorio */}
        {meta.tipo_recordatorio && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Bell size={11} />
            {meta.tipo_recordatorio === "fecha" && meta.recordatorio_fecha && fmtFecha(meta.recordatorio_fecha)}
            {meta.tipo_recordatorio === "periodico" && meta.recordatorio_dia && `Día ${meta.recordatorio_dia} c/mes`}
            {meta.tipo_recordatorio === "ambos" && `${fmtFecha(meta.recordatorio_fecha) ?? ""} · día ${meta.recordatorio_dia ?? "—"}`}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-50 flex-wrap">

          {esMonto && !completada && (
            <button onClick={() => onAportar(meta)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ backgroundColor: (meta.color ?? "#9333ea") + "18", color: meta.color ?? "#9333ea" }}>
              <TrendingUp size={12} />Aportar
            </button>
          )}

          {esMonto && (meta.monto_aportado ?? 0) > 0 && (
            <button onClick={() => onRetirar(meta)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition">
              <ArrowDownCircle size={12} />Retirar
            </button>
          )}

          {!esMonto && !completada && (
            <button onClick={() => onProgreso(meta)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{ backgroundColor: (meta.color ?? "#9333ea") + "18", color: meta.color ?? "#9333ea" }}>
              <ChevronRight size={12} />Actualizar
            </button>
          )}

          {esMonto && (
            <button onClick={() => onHistorial(meta)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
              <History size={12} />Historial
            </button>
          )}

          <button onClick={() => onEditar(meta)}
            className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition ml-auto">
            <Pencil size={12} className="text-gray-500" />
          </button>

          {!completada && (
            <button onClick={() => onEstado(meta, meta.estado === "activa" ? "pausada" : "activa")}
              className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
              {meta.estado === "activa"
                ? <PauseCircle size={12} className="text-amber-500" />
                : <PlayCircle  size={12} className="text-green-500" />}
            </button>
          )}

          {/* Completar manualmente:
               - tipo porcentaje: siempre visible si no está completada
               - tipo monto: solo si monto_aportado >= monto_objetivo */}
          {!completada && (
            (!esMonto || (meta.monto_aportado ?? 0) >= (meta.monto_objetivo ?? Infinity))
          ) && (
            <button onClick={() => onEstado(meta, "completada")}
              className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              title="Marcar como completada">
              <CheckCircle2 size={12} className="text-purple-500" />
            </button>
          )}

          <button onClick={() => onEliminar(meta)}
            className="w-7 h-7 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition">
            <Trash2 size={12} className="text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────────────────────── */
export default function UserMetas({ user }) {
  const [metas,          setMetas]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [saldoBilletera, setSaldoBilletera] = useState(null);
  const [modalForm,      setModalForm]      = useState(null);   // null | "nueva" | meta
  const [modalAporte,    setModalAporte]    = useState(null);
  const [modalRetiro,    setModalRetiro]    = useState(null);
  const [modalProgreso,  setModalProgreso]  = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [filtro,         setFiltro]         = useState("todas");
  const [verAnalisis,    setVerAnalisis]    = useState(false);

  const moneda = user.currency ?? "PEN";

  const cargar = useCallback(async () => {
    setLoading(true);
    const [rMetas, rBil] = await Promise.all([
      authFetch("/metas",     user.token),
      authFetch("/billetera", user.token),
    ]);
    if (rMetas.ok) setMetas(await rMetas.json());
    if (rBil.ok)   { const d = await rBil.json(); setSaldoBilletera(parseFloat(d.billetera?.saldo ?? 0)); }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, []);

  const actualizarMeta = (m) => setMetas(prev => {
    const idx = prev.findIndex(x => x.id === m.id);
    return idx >= 0 ? prev.map(x => x.id === m.id ? m : x) : [...prev, m];
  });

  const handleEliminar = async (meta) => {
    if (!confirm(`¿Eliminar "${meta.nombre}"? El dinero aportado volverá a tu billetera.`)) return;
    const r = await authFetch(`/metas/${meta.id}`, user.token, { method: "DELETE" });
    if (r.ok) {
      setMetas(prev => prev.filter(m => m.id !== meta.id));
      const rBil = await authFetch("/billetera", user.token);
      if (rBil.ok) { const d = await rBil.json(); setSaldoBilletera(parseFloat(d.billetera?.saldo ?? 0)); }
    }
  };

  const handleEstado = async (meta, nuevoEstado) => {
    const r = await authFetch(`/metas/${meta.id}/estado`, user.token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    if (r.ok) { const d = await r.json(); actualizarMeta(d.meta); }
  };

  const handleExitoAporte = (metaActualizada, nuevoSaldo) => {
    actualizarMeta(metaActualizada);
    if (nuevoSaldo !== undefined) setSaldoBilletera(nuevoSaldo);
    setModalAporte(null);
    setModalRetiro(null);
  };

  const FILTROS = {
    todas:       () => true,
    activas:     m => m.estado === "activa",
    pausadas:    m => m.estado === "pausada",
    completadas: m => m.estado === "completada",
  };
  const metasFiltradas  = metas.filter(FILTROS[filtro] ?? (() => true));
  const totalActivas    = metas.filter(m => m.estado === "activa").length;
  const totalCompletadas = metas.filter(m => m.estado === "completada").length;
  const totalAportado   = metas
    .filter(m => m.tipo_medicion === "monto")
    .reduce((s, m) => s + (m.monto_aportado ?? 0), 0);

  return (
    <>
      {/* ── Modales ── */}
      {modalForm && (
        <ModalMetaForm
          meta={modalForm === "nueva" ? null : modalForm}
          token={user.token}
          monedaUser={moneda}
          onClose={() => setModalForm(null)}
          onExito={m => { actualizarMeta(m); setModalForm(null); }}
        />
      )}
      {modalAporte && (
        <ModalAporte meta={modalAporte} tipo="aportar" token={user.token}
          onClose={() => setModalAporte(null)} onExito={handleExitoAporte} />
      )}
      {modalRetiro && (
        <ModalAporte meta={modalRetiro} tipo="retirar" token={user.token}
          onClose={() => setModalRetiro(null)} onExito={handleExitoAporte} />
      )}
      {modalProgreso && (
        <ModalProgreso meta={modalProgreso} token={user.token}
          onClose={() => setModalProgreso(null)}
          onExito={m => { actualizarMeta(m); setModalProgreso(null); }} />
      )}
      {modalHistorial && (
        <ModalHistorialAportes meta={modalHistorial} token={user.token}
          onClose={() => setModalHistorial(null)} />
      )}

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* ── Encabezado ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Mis metas</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {totalActivas} activa{totalActivas !== 1 ? "s" : ""} · {totalCompletadas} completada{totalCompletadas !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setVerAnalisis(v => !v)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold border transition
                ${verAnalisis
                  ? "bg-purple-100 text-purple-700 border-purple-200"
                  : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"}`}>
              <Lightbulb size={15} />Análisis
            </button>
            <button onClick={() => setModalForm("nueva")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold shadow-sm transition">
              <Plus size={16} strokeWidth={2.5} />Nueva meta
            </button>
          </div>
        </div>

        {/* ── Resumen ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Saldo billetera</p>
            <p className="text-lg font-bold text-gray-800">{fmt(saldoBilletera ?? 0, moneda)}</p>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Total reservado</p>
            <p className="text-lg font-bold text-purple-700">{fmt(totalAportado, moneda)}</p>
            <p className="text-[10px] text-purple-400 mt-0.5">En metas activas</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 col-span-2 sm:col-span-1">
            <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider mb-1">Completadas</p>
            <p className="text-lg font-bold text-green-700">{totalCompletadas}</p>
          </div>
        </div>

        {/* ── Panel análisis ── */}
        {verAnalisis && (
          <PanelAnalisis token={user.token} moneda={moneda} onAportar={m => setModalAporte(m)} />
        )}

        {/* ── Filtros ── */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl p-1.5 w-fit flex-wrap">
          {[
            { key: "todas",       label: `Todas (${metas.length})`          },
            { key: "activas",     label: `Activas (${totalActivas})`        },
            { key: "pausadas",    label: `Pausadas (${metas.filter(m => m.estado === "pausada").length})` },
            { key: "completadas", label: `Completadas (${totalCompletadas})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFiltro(key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all
                ${filtro === key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Grid metas ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Cargando metas...</span>
          </div>
        ) : metasFiltradas.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target size={28} className="text-purple-300" />
            </div>
            <p className="text-sm font-semibold text-gray-400">
              {filtro === "todas" ? "Aún no tienes metas" : `Sin metas ${filtro}`}
            </p>
            {filtro === "todas" && (
              <button onClick={() => setModalForm("nueva")}
                className="mt-4 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition">
                Crear mi primera meta
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {metasFiltradas.map(meta => (
              <TarjetaMeta key={meta.id} meta={meta}
                onEditar={m  => setModalForm(m)}
                onEliminar={handleEliminar}
                onAportar={m => setModalAporte(m)}
                onRetirar={m => setModalRetiro(m)}
                onProgreso={m => setModalProgreso(m)}
                onEstado={handleEstado}
                onHistorial={m => setModalHistorial(m)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}