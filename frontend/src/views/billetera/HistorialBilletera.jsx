// views/billetera/HistorialBilletera.jsx
import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../../router/authFetch";
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Tag, MessageSquare, FolderOpen, Image, Loader2,
  ArrowUpCircle, ArrowDownCircle, X, Repeat, Briefcase, ShoppingBag,
} from "lucide-react";

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

// Tipos de movimiento con badge visual
const TIPO_CONFIG = {
  transaccion_ingreso: {
    label: "Ingreso manual",
    bg: "bg-green-50", text: "text-green-700", dot: "#10b981",
    Icon: ArrowUpCircle, iconColor: "text-green-600", iconBg: "bg-green-100",
    signo: "+",
  },
  transaccion_egreso: {
    label: "Egreso manual",
    bg: "bg-red-50", text: "text-red-700", dot: "#ef4444",
    Icon: ArrowDownCircle, iconColor: "text-red-500", iconBg: "bg-red-100",
    signo: "-",
  },
  ingreso_salarial: {
    label: "Ingreso salarial",
    bg: "bg-blue-50", text: "text-blue-700", dot: "#3b82f6",
    Icon: Briefcase, iconColor: "text-blue-600", iconBg: "bg-blue-100",
    signo: "+",
  },
  entrada_habitual: {
    label: "Entrada habitual",
    bg: "bg-purple-50", text: "text-purple-700", dot: "#9333ea",
    Icon: Repeat, iconColor: "text-purple-600", iconBg: "bg-purple-100",
    signo: "+",
  },
  gasto_habitual: {
    label: "Gasto habitual",
    bg: "bg-orange-50", text: "text-orange-700", dot: "#f97316",
    Icon: ShoppingBag, iconColor: "text-orange-600", iconBg: "bg-orange-100",
    signo: "-",
  },
};

function fmt(n, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(n ?? 0);
}

function fmtFecha(str) {
  if (!str) return "—";
  const solo = str.split("T")[0];
  const [y, m, d] = solo.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  if (isNaN(fecha)) return "—";
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

// Normalizar todos los movimientos a una estructura común
function normalizar(transacciones, ingresos, entradasMov, gastosMov) {
  const items = [];

  // 1. Transacciones manuales de billetera
  (transacciones ?? []).forEach(t => {
    items.push({
      id:          `trans_${t.id}`,
      fuente:      t.tipo === "ingreso" ? "transaccion_ingreso" : "transaccion_egreso",
      monto:       parseFloat(t.monto),
      fecha:       t.fecha,
      descripcion: t.descripcion ?? null,
      etiqueta:    t.etiqueta ?? null,
      categoria:   t.categoria ?? null,
      fotos:       t.fotos ?? [],
      extra:       null,
    });
  });

  // 2. Ingresos salariales confirmados
  (ingresos ?? []).filter(i => i.confirmado).forEach(i => {
    items.push({
      id:          `ing_${i.id}`,
      fuente:      "ingreso_salarial",
      monto:       parseFloat(i.monto),
      fecha:       i.fecha ?? i.created_at,
      descripcion: i.descripcion ?? i.tipo ?? null,
      etiqueta:    null,
      categoria:   null,
      fotos:       [],
      extra:       null,
    });
  });

  // 3. Entradas habituales (BilleteraMovimiento tipo entrada)
  (entradasMov ?? []).forEach(m => {
    items.push({
      id:          `entrada_${m.id}`,
      fuente:      "entrada_habitual",
      monto:       parseFloat(m.monto),
      fecha:       m.fecha,
      descripcion: m.entrada?.nombre ?? m.descripcion ?? null,
      etiqueta:    null,
      categoria:   m.entrada?.categoria ?? null,
      fotos:       [],
      extra:       null,
    });
  });

  // 4. Gastos habituales (GastoMovimiento pagados/pendientes)
  (gastosMov ?? []).forEach(m => {
    items.push({
      id:          `gasto_${m.id}`,
      fuente:      "gasto_habitual",
      monto:       parseFloat(m.monto),
      fecha:       m.fecha,
      descripcion: m.gasto?.nombre ?? m.descripcion ?? null,
      etiqueta:    m.estado === "pendiente" ? "Pendiente" : null,
      categoria:   m.gasto?.categoria ?? null,
      fotos:       [],
      extra:       m.estado,
    });
  });

  // Ordenar por fecha desc
  items.sort((a, b) => {
    const fa = (a.fecha ?? "").split("T")[0];
    const fb = (b.fecha ?? "").split("T")[0];
    return fb.localeCompare(fa);
  });

  return items;
}

// ── Modal de fotos ────────────────────────────────────────────────────────────
function ModalFotos({ fotos, onClose }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white">
          <X size={24} />
        </button>
        <img src={fotos[idx]} alt="" className="w-full rounded-2xl object-contain max-h-[80vh]" />
        {fotos.length > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <button onClick={() => setIdx(i => Math.max(0, i - 1))}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <ChevronLeft size={16} />
            </button>
            <span className="text-white/70 text-sm">{idx + 1} / {fotos.length}</span>
            <button onClick={() => setIdx(i => Math.min(fotos.length - 1, i + 1))}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Fila de movimiento ────────────────────────────────────────────────────────
function FilaMovimiento({ item, moneda }) {
  const [fotoIdx, setFotoIdx] = useState(null);
  const cfg   = TIPO_CONFIG[item.fuente];
  const fotos = item.fotos ?? [];

  return (
    <>
      {fotoIdx !== null && <ModalFotos fotos={fotos} onClose={() => setFotoIdx(null)} />}
      <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">

        {/* Tipo + Monto */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
              <cfg.Icon size={14} className={cfg.iconColor} />
            </div>
            <div>
              <span className={`text-sm font-bold ${cfg.signo === "+" ? "text-green-700" : "text-red-600"}`}>
                {cfg.signo}{fmt(item.monto, moneda)}
              </span>
              {/* Badge de tipo */}
              <div className={`inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
                {cfg.label}
              </div>
            </div>
          </div>
        </td>

        {/* Fecha */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-xs text-gray-500 font-medium">{fmtFecha(item.fecha)}</span>
        </td>

        {/* Categoría */}
        <td className="px-4 py-3">
          {item.categoria ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.categoria.color ?? "#6366f1" }} />
              <span className="text-xs font-semibold text-gray-700">{item.categoria.nombre}</span>
            </div>
          ) : (
            <span className="text-xs text-gray-300 italic">—</span>
          )}
        </td>

        {/* Etiqueta */}
        <td className="px-4 py-3">
          {item.etiqueta ? (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
              ${item.extra === "pendiente"
                ? "bg-amber-50 text-amber-700"
                : "bg-purple-50 text-purple-700"}`}>
              <Tag size={10} />{item.etiqueta}
            </span>
          ) : (
            <span className="text-xs text-gray-200">—</span>
          )}
        </td>

        {/* Descripción */}
        <td className="px-4 py-3 max-w-[180px]">
          {item.descripcion
            ? <span className="text-xs text-gray-500 truncate block">{item.descripcion}</span>
            : <span className="text-xs text-gray-200">—</span>}
        </td>

        {/* Fotos */}
        <td className="px-4 py-3 whitespace-nowrap">
          {fotos.length > 0 ? (
            <div className="flex items-center gap-1">
              {fotos.slice(0, 3).map((src, i) => (
                <button key={i} onClick={() => setFotoIdx(i)}
                  className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 hover:scale-110 transition-transform">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-200">—</span>
          )}
        </td>

      </tr>
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function HistorialBilletera({ user }) {
  const hoy = new Date();
  const mes  = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();

  const [mesSel,         setMesSel]         = useState(mes);
  const [anioSel,        setAnioSel]        = useState(anio);
  const [transacciones,  setTransacciones]  = useState([]);
  const [ingresos,       setIngresos]       = useState([]);
  const [entradasMov,    setEntradasMov]    = useState([]);
  const [gastosMov,      setGastosMov]      = useState([]);
  const [saldoBilletera, setSaldoBilletera] = useState(null);
  const [resumen,        setResumen]        = useState({ ingresos: 0, egresos: 0 });
  const [loading,        setLoading]        = useState(true);
  const [filtroTipo,     setFiltroTipo]     = useState("todos");

  const moneda = user.currency ?? "PEN";

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rHist, rBil, rIng, rEntradas, rGastos] = await Promise.all([
        authFetch(`/billetera/historial?mes=${mesSel}&anio=${anioSel}`,   user.token),
        authFetch("/billetera",                                            user.token),
        authFetch(`/ingresos?mes=${mesSel}&anio=${anioSel}`,              user.token),
        authFetch(`/billetera/movimientos?anio=${anioSel}`,               user.token),
        authFetch(`/gastos/movimientos?anio=${anioSel}`,                  user.token),
      ]);

      if (rHist.ok) {
        const d = await rHist.json();
        setTransacciones(d.transacciones ?? []);
        setResumen({ ingresos: d.total_ingresos ?? 0, egresos: d.total_egresos ?? 0 });
      }
      if (rBil.ok)      { const d = await rBil.json();      setSaldoBilletera(d.billetera?.saldo); }
      if (rIng.ok)      { const d = await rIng.json();      setIngresos(d.ingresos ?? []); }
      if (rEntradas.ok) {
        const d = await rEntradas.json();
        // Viene agrupado por mes → aplanar y filtrar solo el mes seleccionado
        const todas = Object.values(d).flat();
        setEntradasMov(todas.filter(m => {
          const fm = parseInt((m.fecha ?? "").split("-")[1]);
          return fm === mesSel;
        }));
      }
      if (rGastos.ok) {
        const d = await rGastos.json();
        // Viene agrupado por mes → aplanar y filtrar solo el mes seleccionado
        const todas = Object.values(d).flat();
        setGastosMov(todas.filter(m => {
          const fm = parseInt((m.fecha ?? "").split("-")[1]);
          return fm === mesSel;
        }));
      }
    } catch (e) {
      console.error("Error cargando historial:", e);
    } finally {
      setLoading(false);
    }
  }, [mesSel, anioSel]);

  useEffect(() => { cargar(); }, [cargar]);

  const moverMes = (dir) => {
    let m = mesSel + dir, a = anioSel;
    if (m > 12) { m = 1;  a++; }
    if (m < 1)  { m = 12; a--; }
    setMesSel(m); setAnioSel(a);
  };

  // Unificar y ordenar todos los movimientos
  const todosMovimientos = normalizar(transacciones, ingresos, entradasMov, gastosMov);

  // Filtrar por tipo seleccionado
  const FILTROS = {
    todos:           () => true,
    ingresos:        m => ["transaccion_ingreso", "ingreso_salarial", "entrada_habitual"].includes(m.fuente),
    egresos:         m => ["transaccion_egreso",  "gasto_habitual"].includes(m.fuente),
    transacciones:   m => ["transaccion_ingreso", "transaccion_egreso"].includes(m.fuente),
    salariales:      m => m.fuente === "ingreso_salarial",
    entradas:        m => m.fuente === "entrada_habitual",
    gastos_fijos:    m => m.fuente === "gasto_habitual",
  };

  const movimientosFiltrados = todosMovimientos.filter(FILTROS[filtroTipo] ?? (() => true));

  // Totales reales sumando todas las fuentes
  const totalIngresos = todosMovimientos
    .filter(m => ["transaccion_ingreso", "ingreso_salarial", "entrada_habitual"].includes(m.fuente))
    .reduce((s, m) => s + m.monto, 0);
  const totalEgresos = todosMovimientos
    .filter(m => ["transaccion_egreso", "gasto_habitual"].includes(m.fuente))
    .reduce((s, m) => s + m.monto, 0);

  const FILTRO_BTNS = [
    { key: "todos",         label: "Todos"         },
    { key: "ingresos",      label: "Ingresos"      },
    { key: "egresos",       label: "Egresos"       },
    { key: "transacciones", label: "Manuales"      },
    { key: "salariales",    label: "Salariales"    },
    { key: "entradas",      label: "Ent. habituales" },
    { key: "gastos_fijos",  label: "Gas. habituales" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Historial de billetera</h1>
        <p className="text-xs text-gray-400 mt-0.5">Todos tus movimientos del mes</p>
      </div>

      {/* ── Leyenda de tipos ── */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
            <cfg.Icon size={11} />
            {cfg.label}
          </div>
        ))}
      </div>

      {/* ── Saldo + resumen ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-5 flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold text-purple-200 uppercase tracking-widest mb-1">Saldo actual</p>
            <p className="text-2xl font-bold text-white">
              {saldoBilletera != null ? fmt(saldoBilletera, moneda) : "—"}
            </p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Ingresos del mes</p>
            <p className="text-xl font-bold text-green-700">{fmt(totalIngresos, moneda)}</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <TrendingUp size={18} className="text-green-600" />
          </div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Egresos del mes</p>
            <p className="text-xl font-bold text-red-600">{fmt(totalEgresos, moneda)}</p>
          </div>
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <TrendingDown size={18} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Navegación mes */}
        <div className="flex items-center gap-2">
          <button onClick={() => moverMes(-1)}
            className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <ChevronLeft size={14} className="text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">
            {MESES[mesSel - 1]} {anioSel}
          </span>
          <button onClick={() => moverMes(1)}
            className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <ChevronRight size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Filtros tipo */}
        <div className="flex items-center gap-1 flex-wrap">
          {FILTRO_BTNS.map(({ key, label }) => (
            <button key={key} onClick={() => setFiltroTipo(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${filtroTipo === key ? "bg-purple-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 ml-auto">
          {movimientosFiltrados.length} movimiento{movimientosFiltrados.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingDown size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-400">Sin movimientos en este periodo</p>
            <p className="text-xs text-gray-300 mt-1">Prueba con otro mes o filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tipo · Monto</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><FolderOpen size={11} />Categoría</span>
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Tag size={11} />Etiqueta</span>
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><MessageSquare size={11} />Descripción</span>
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Image size={11} />Fotos</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map(item => (
                  <FilaMovimiento key={item.id} item={item} moneda={moneda} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}