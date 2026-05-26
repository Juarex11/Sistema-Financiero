import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../../router/authFetch";
import {
  TrendingUp, TrendingDown, Wallet, LayoutGrid, Calendar,
  Plus, Minus, Tags, AlertTriangle, Target, ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import ModalTransaccion from "./modal/ModalTransaccion";
import ModalCategorias  from "./modal/ModalCategorias";
import ModalAporte      from "../metas/modal/ModalAporte";

function fmt(monto, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(monto);
}

const COLORS_GASTOS   = ["#ef4444", "#f97316", "#f59e0b", "#ec4899", "#6366f1"];
const COLORS_INGRESOS = ["#9333ea", "#3b82f6", "#10b981", "#14b8a6", "#8b5cf6"];

const PERIODOS = [
  { key: "dia",    label: "Hoy"    },
  { key: "semana", label: "Semana" },
  { key: "mes",    label: "Mes"    },
  { key: "anio",   label: "Año"    },
  { key: "rango",  label: "Rango"  },
];

const VISTAS = [
  { key: "gastos",   label: "Gastos",   Icon: TrendingDown },
  { key: "ingresos", label: "Ingresos", Icon: TrendingUp   },
  { key: "ambos",    label: "Ambos",    Icon: LayoutGrid    },
];

function hoyStr() { return new Date().toISOString().split("T")[0]; }

function inicioSemana() {
  const d = new Date(), dia = d.getDay();
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

function inicioMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function inicioAnio() { return `${new Date().getFullYear()}-01-01`; }

function enRango(fechaStr, desde, hasta) {
  if (!fechaStr) return false;
  const f = fechaStr.split("T")[0];
  return f >= desde && f <= hasta;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs text-gray-400 mb-0.5">{payload[0].name}</p>
      <p className="text-sm font-bold text-gray-800">{fmt(payload[0].value)}</p>
    </div>
  );
}

function GraficoCircular({ datos, colores, label, total, moneda }) {
  const vacio = !datos || datos.length === 0 || total === 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64">
        {vacio ? (
          <div className="w-full h-full rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-300 text-center px-8">
              Sin {label} en este periodo
            </span>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={datos} cx="50%" cy="50%" innerRadius={75} outerRadius={110} paddingAngle={3} dataKey="value">
                  {datos.map((_, i) => <Cell key={i} fill={colores[i % colores.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total</p>
              <p className="text-xl font-bold text-gray-800">{fmt(total, moneda)}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ── Tarjeta de saldo con reserva de metas ─────────────────────────────────────

function TarjetaSaldo({ billetera, moneda, token }) {
  const [reservado, setReservado] = useState(0);

  useEffect(() => {
    authFetch("/metas", token)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const total = (data ?? [])
          .filter(m => m.estado === "activa" && m.tipo_medicion === "monto")
          .reduce((s, m) => s + (parseFloat(m.monto_aportado) || 0), 0);
        setReservado(total);
      })
      .catch(() => {});
  }, [token]);

  // saldo real en billetera (ya descontado el aporte)
  const saldoDisponible = parseFloat(billetera.saldo) ?? 0;
  // saldo bruto = disponible + lo reservado en metas
  const saldoBruto    = saldoDisponible + reservado;
  const negativo      = saldoDisponible < 0;
  const tieneReserva  = reservado > 0;

  return (
    <div className={`rounded-2xl shadow-sm overflow-hidden transition-all
      ${negativo
        ? "bg-gradient-to-r from-red-500 to-red-600"
        : "bg-gradient-to-r from-purple-600 to-purple-700"}`}>

      {/* Saldo general (bruto) — siempre visible */}
      <div className="flex items-center gap-5 p-6">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          {negativo
            ? <AlertTriangle size={26} className="text-white" />
            : <Wallet        size={26} className="text-white" />}
        </div>
        <div className="flex-1">
          <p className={`text-xs font-semibold uppercase tracking-widest mb-1
            ${negativo ? "text-red-200" : "text-purple-200"}`}>
            {negativo ? "Saldo en déficit" : "Saldo general"}
          </p>
          <p className="text-4xl font-bold text-white">{fmt(saldoBruto, moneda)}</p>
          {negativo && (
            <p className="text-xs text-red-200 mt-1">Tu billetera está en números rojos</p>
          )}
        </div>
      </div>

      {/* Desglose — solo si hay reserva en metas */}
      {tieneReserva && (
        <div className="grid grid-cols-2 border-t border-white/10">
          <div className="px-6 py-3 border-r border-white/10">
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5
              ${negativo ? "text-red-200" : "text-purple-200"}`}>
              Ahorro en metas
            </p>
            <p className="text-lg font-bold text-white/70">
              -{fmt(reservado, moneda)}
            </p>
          </div>
          <div className="px-6 py-3">
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5
              ${negativo ? "text-red-200" : "text-purple-200"}`}>
              Saldo disponible
            </p>
            <p className={`text-lg font-bold ${negativo ? "text-red-300" : "text-white"}`}>
              {fmt(saldoDisponible, moneda)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FiltrosPeriodo({ periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl p-1.5 w-fit">
        {PERIODOS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriodo(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200
              ${periodo === key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {key === "rango" && <Calendar size={12} strokeWidth={2} />}
            {label}
          </button>
        ))}
      </div>
      {periodo === "rango" && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Calendar size={14} className="text-gray-400" />
            <input type="date" value={rangoDesde} onChange={e => setRangoDesde(e.target.value)}
              className="text-xs text-gray-700 font-medium outline-none bg-transparent" />
          </div>
          <span className="text-xs text-gray-400 font-medium">hasta</span>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
            <Calendar size={14} className="text-gray-400" />
            <input type="date" value={rangoHasta} onChange={e => setRangoHasta(e.target.value)}
              className="text-xs text-gray-700 font-medium outline-none bg-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sección Metas en Dashboard ────────────────────────────────────────────────

function SeccionMetas({ token, moneda, onNavigate, onSaldoChange }) {
  const [metas,        setMetas]        = useState([]);
  const [modalAporte,  setModalAporte]  = useState(null);

  useEffect(() => {
    authFetch("/metas", token)
      .then(r => r.ok ? r.json() : [])
      .then(d => setMetas((d ?? []).filter(m => m.estado === "activa" && m.tipo_medicion === "monto")));
  }, []);

  const handleExitoAporte = (metaActualizada, nuevoSaldo) => {
    setMetas(prev => prev.map(m => m.id === metaActualizada.id ? metaActualizada : m));
    if (nuevoSaldo !== undefined && onSaldoChange) onSaldoChange(nuevoSaldo);
    setModalAporte(null);
  };

  if (!metas.length) return null;

  return (
    <>
      {modalAporte && (
        <ModalAporte
          meta={modalAporte}
          tipo="aportar"
          token={token}
          onClose={() => setModalAporte(null)}
          onExito={handleExitoAporte}
        />
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
              <Target size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Mis metas activas</p>
              <p className="text-xs text-gray-400">{metas.length} meta{metas.length !== 1 ? "s" : ""} en progreso</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("/metas")}
            className="flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800 transition">
            Ver todas <ChevronRight size={13} />
          </button>
        </div>

        {/* Lista de metas */}
        <div className="space-y-3">
          {metas.slice(0, 4).map(meta => {
            const progreso = meta.progreso ?? 0;
            const restante = Math.max(0, (meta.monto_objetivo ?? 0) - (meta.monto_aportado ?? 0));

            return (
              <div key={meta.id} className="group">
                {/* Nombre + porcentaje + botón aportar */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: meta.color ?? "#9333ea" }} />
                    <span className="text-xs font-semibold text-gray-700 truncate">{meta.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-bold text-gray-400">{progreso}%</span>
                    <button
                      onClick={() => setModalAporte(meta)}
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all duration-200"
                      style={{ backgroundColor: (meta.color ?? "#9333ea") + "18", color: meta.color ?? "#9333ea" }}>
                      <Plus size={10} strokeWidth={2.5} />Aportar
                    </button>
                  </div>
                </div>

                {/* Barra */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(progreso, 100)}%`, backgroundColor: meta.color ?? "#9333ea" }} />
                </div>

                {/* Montos */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-400">
                    {fmt(meta.monto_aportado ?? 0, moneda)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Falta {fmt(restante, moneda)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón ver todas si hay más de 4 */}
        {metas.length > 4 && (
          <button
            onClick={() => onNavigate("/metas")}
            className="w-full py-2 rounded-xl bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 transition">
            Ver {metas.length - 4} meta{metas.length - 4 !== 1 ? "s" : ""} más →
          </button>
        )}
      </div>
    </>
  );
}

// ── TarjetaGrafico ────────────────────────────────────────────────────────────

function TarjetaGrafico({
  tipo, gastosRaw, ingresosRaw, entradasMovRaw, transaccionesRaw,
  periodo, rangoDesde, rangoHasta, moneda, token, onTransaccion,
}) {
  const esGasto = tipo === "gastos";
  const colores = esGasto ? COLORS_GASTOS : COLORS_INGRESOS;
  const subtitulo = {
    dia:    esGasto ? "Movimientos de hoy"       : "Confirmados hoy",
    semana: esGasto ? "Movimientos de la semana" : "Confirmados esta semana",
    mes:    esGasto ? "Movimientos del mes"      : "Confirmados este mes",
    anio:   esGasto ? "Movimientos del año"      : "Confirmados este año",
    rango:  esGasto ? "Movimientos en el rango"  : "Confirmados en el rango",
  }[periodo];

  const hoy   = hoyStr();
  const desde = { dia: hoy, semana: inicioSemana(), mes: inicioMes(), anio: inicioAnio(), rango: rangoDesde }[periodo];
  const hasta = periodo === "rango" ? rangoHasta : hoy;

  let datos = [], total = 0;

  if (esGasto) {
    const filtrados = gastosRaw.filter(m => enRango(m.fecha, desde, hasta));
    const agrupado  = {};
    filtrados.forEach(m => {
      const nombre = m.gasto?.nombre ?? m.descripcion ?? "Gasto";
      agrupado[nombre] = (agrupado[nombre] ?? 0) + parseFloat(m.monto);
    });
    const egresos = transaccionesRaw.filter(t => t.tipo === "egreso" && enRango(t.fecha, desde, hasta));
    egresos.forEach(t => {
      const nombre = (t.categoria?.nombre ?? t.descripcion?.trim()) || "Sin categoría";
      agrupado[nombre] = (agrupado[nombre] ?? 0) + parseFloat(t.monto);
    });
    datos = Object.entries(agrupado).map(([name, value]) => ({ name, value }));
    total = datos.reduce((a, b) => a + b.value, 0);
  } else {
    const agrupado = {};
    ingresosRaw.filter(i => i.confirmado && enRango(i.fecha ?? i.created_at, desde, hasta))
      .forEach(i => {
        const nombre = i.descripcion ?? i.tipo ?? "Ingreso";
        agrupado[nombre] = (agrupado[nombre] ?? 0) + parseFloat(i.monto);
      });
    (entradasMovRaw ?? []).filter(m => enRango(m.fecha, desde, hasta))
      .forEach(m => {
        const nombre = m.entrada?.nombre ?? m.descripcion ?? "Entrada fija";
        agrupado[nombre] = (agrupado[nombre] ?? 0) + parseFloat(m.monto);
      });
    transaccionesRaw.filter(t => t.tipo === "ingreso" && enRango(t.fecha, desde, hasta))
      .forEach(t => {
        const nombre = (t.categoria?.nombre ?? t.descripcion?.trim()) || "Sin categoría";
        agrupado[nombre] = (agrupado[nombre] ?? 0) + parseFloat(t.monto);
      });
    datos = Object.entries(agrupado).map(([name, value]) => ({ name, value }));
    total = datos.reduce((a, b) => a + b.value, 0);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 ${esGasto ? "bg-red-100" : "bg-purple-100"} rounded-xl flex items-center justify-center`}>
            {esGasto
              ? <TrendingDown size={16} className="text-red-500" />
              : <TrendingUp   size={16} className="text-purple-600" />}
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">{esGasto ? "Gastos" : "Ingresos"}</p>
            <p className="text-xs text-gray-400">{subtitulo}</p>
          </div>
        </div>
        <button
          onClick={() => onTransaccion(esGasto ? "egreso" : "ingreso")}
          className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95
            ${esGasto ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"}`}>
          {esGasto ? <Minus size={18} strokeWidth={2.5} /> : <Plus size={18} strokeWidth={2.5} />}
        </button>
      </div>

      <GraficoCircular datos={datos} colores={colores} label={esGasto ? "gastos" : "ingresos"} total={total} moneda={moneda} />

      {datos.length > 0 && (
        <div className="space-y-2">
          {datos.map((g, i) => (
            <div key={g.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colores[i % colores.length] }} />
                <p className="text-xs text-gray-600 truncate max-w-[140px]">{g.name}</p>
              </div>
              <p className="text-xs font-bold text-gray-700">{fmt(g.value, moneda)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── UserDashboard ─────────────────────────────────────────────────────────────

export default function UserDashboard({ user, onNavigate }) {
  const hoy  = new Date();
  const mes  = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();

  const [vista,            setVista]            = useState("ambos");
  const [periodo,          setPeriodo]          = useState("dia");
  const [rangoDesde,       setRangoDesde]       = useState(hoyStr());
  const [rangoHasta,       setRangoHasta]       = useState(hoyStr());
  const [billetera,        setBilletera]        = useState(null);
  const [gastosRaw,        setGastosRaw]        = useState([]);
  const [ingresosRaw,      setIngresosRaw]      = useState([]);
  const [entradasMovRaw,   setEntradasMovRaw]   = useState([]);
  const [transaccionesRaw, setTransaccionesRaw] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [modal,            setModal]            = useState(null);
  const [modalCat,         setModalCat]         = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rBil, rGastos, rIngresos, rTrans, rEntradasMov] = await Promise.all([
        authFetch("/billetera",                                   user.token),
        authFetch("/gastos/movimientos?anio=" + anio,             user.token),
        authFetch(`/ingresos?mes=${mes}&anio=${anio}`,            user.token),
        authFetch("/billetera/transacciones",                     user.token),
        authFetch("/billetera/movimientos?anio=" + anio,          user.token),
      ]);
      if (rBil.ok)         { const d = await rBil.json();         setBilletera(d.billetera); }
      if (rGastos.ok)      { const d = await rGastos.json();      setGastosRaw(Object.values(d).flat()); }
      if (rIngresos.ok)    { const d = await rIngresos.json();    setIngresosRaw(d.ingresos ?? []); }
      if (rTrans.ok)       { const d = await rTrans.json();       setTransaccionesRaw(d.transacciones ?? []); }
      if (rEntradasMov.ok) { const d = await rEntradasMov.json(); setEntradasMovRaw(Object.values(d).flat()); }
    } catch (e) {
      console.error("Error cargando dashboard:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, []);

  const handleTransaccionExito = async (nuevoSaldo) => {
    setBilletera(prev => ({ ...prev, saldo: nuevoSaldo }));
    setModal(null);
    const r = await authFetch("/billetera/transacciones", user.token);
    if (r.ok) { const d = await r.json(); setTransaccionesRaw(d.transacciones ?? []); }
  };

  const filtrosProps = { periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta };
  const tarjetaProps = {
    gastosRaw, ingresosRaw, entradasMovRaw, transaccionesRaw,
    periodo, rangoDesde, rangoHasta,
    moneda: user.currency, token: user.token, onTransaccion: setModal,
  };

  const saldoNum      = billetera ? parseFloat(billetera.saldo) : null;
  const saldoNegativo = saldoNum !== null && saldoNum < 0;

  // navigate helper — usa prop si viene de AppLayout, sino window.location
  const navigate = onNavigate ?? ((path) => { window.location.href = path; });

  return (
    <>
      {modal && (
        <ModalTransaccion tipo={modal} moneda={user.currency} token={user.token}
          onClose={() => setModal(null)} onExito={handleTransaccionExito} />
      )}
      {modalCat && (
        <ModalCategorias token={user.token} onClose={() => setModalCat(false)} />
      )}

      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* ── Saldo billetera ── */}
        {billetera && (
          <TarjetaSaldo
            billetera={billetera}
            moneda={user.currency}
            token={user.token}
          />
        )}

        {/* ── Metas activas ── */}
        <SeccionMetas
          token={user.token}
          moneda={user.currency ?? "PEN"}
          onNavigate={navigate}
          onSaldoChange={nuevoSaldo =>
            setBilletera(prev => ({ ...prev, saldo: nuevoSaldo }))
          }
        />

        {/* ── Selector de vista + botón categorías ── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1.5">
            {VISTAS.map(({ key, label, Icon }) => (
              <button key={key} onClick={() => setVista(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${vista === key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                <Icon size={15} strokeWidth={2} />{label}
              </button>
            ))}
          </div>
          <button onClick={() => setModalCat(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-600 hover:text-purple-700 hover:border-purple-300 transition-all">
            <Tags size={15} strokeWidth={2} />Categorías
          </button>
        </div>

        {/* ── Contenido según vista ── */}
        {vista === "ambos" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <FiltrosPeriodo {...filtrosProps} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-5">
              <TarjetaGrafico tipo="gastos"   {...tarjetaProps} />
              <TarjetaGrafico tipo="ingresos" {...tarjetaProps} />
            </div>
          </div>
        )}

        {vista === "gastos" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <FiltrosPeriodo {...filtrosProps} />
            <div className="border-t border-gray-100 pt-5 flex justify-center">
              <div className="w-full max-w-md">
                <TarjetaGrafico tipo="gastos" {...tarjetaProps} />
              </div>
            </div>
          </div>
        )}

        {vista === "ingresos" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <FiltrosPeriodo {...filtrosProps} />
            <div className="border-t border-gray-100 pt-5 flex justify-center">
              <div className="w-full max-w-md">
                <TarjetaGrafico tipo="ingresos" {...tarjetaProps} />
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}