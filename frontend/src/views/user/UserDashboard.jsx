import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../../router/authFetch";
import { TrendingUp, TrendingDown, Wallet, LayoutGrid, Calendar, Plus, Minus } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import ModalTransaccion from "./modal/ModalTransaccion";

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
      <div className="relative w-72 h-72">
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
                <Pie data={datos} cx="50%" cy="50%" innerRadius={90} outerRadius={130} paddingAngle={3} dataKey="value">
                  {datos.map((_, i) => <Cell key={i} fill={colores[i % colores.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Total</p>
              <p className="text-2xl font-bold text-gray-800">{fmt(total, moneda)}</p>
            </div>
          </>
        )}
      </div>
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
        <div className="flex items-center gap-3">
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

function TarjetaGrafico({ tipo, gastosRaw, ingresosRaw, transaccionesRaw, periodo, rangoDesde, rangoHasta, moneda, token, onTransaccion }) {
  const esGasto   = tipo === "gastos";
  const colores   = esGasto ? COLORS_GASTOS : COLORS_INGRESOS;
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
      const nombre = t.descripcion?.trim() || "Retiro billetera";
      agrupado[nombre] = (agrupado[nombre] ?? 0) + parseFloat(t.monto);
    });

    datos = Object.entries(agrupado).map(([name, value]) => ({ name, value }));
    total = datos.reduce((a, b) => a + b.value, 0);

  } else {
    const filtrados = ingresosRaw.filter(i => i.confirmado && enRango(i.fecha ?? i.created_at, desde, hasta));
    const agrupado  = {};
    filtrados.forEach(i => {
      const nombre = i.descripcion ?? i.tipo ?? "Ingreso";
      agrupado[nombre] = (agrupado[nombre] ?? 0) + parseFloat(i.monto);
    });

    const ingresos = transaccionesRaw.filter(t => t.tipo === "ingreso" && enRango(t.fecha, desde, hasta));
    ingresos.forEach(t => {
      const nombre = t.descripcion?.trim() || "Ingreso billetera";
      agrupado[nombre] = (agrupado[nombre] ?? 0) + parseFloat(t.monto);
    });

    datos = Object.entries(agrupado).map(([name, value]) => ({ name, value }));
    total = datos.reduce((a, b) => a + b.value, 0);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-5 relative">
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

      <div className="relative">
        <GraficoCircular datos={datos} colores={colores} label={esGasto ? "gastos" : "ingresos"} total={total} moneda={moneda} />

        <button
          onClick={() => onTransaccion(esGasto ? "egreso" : "ingreso")}
          className={`absolute bottom-0 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95
            ${esGasto
              ? "bg-red-500   hover:bg-red-600   text-white"
              : "bg-green-500 hover:bg-green-600 text-white"}`}
        >
          {esGasto
            ? <Minus size={22} strokeWidth={2.5} />
            : <Plus  size={22} strokeWidth={2.5} />}
        </button>
      </div>

      {datos.length > 0 && (
        <div className="space-y-2 mt-2">
          {datos.map((g, i) => (
            <div key={g.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colores[i % colores.length] }} />
                <p className="text-xs text-gray-600 truncate max-w-[160px]">{g.name}</p>
              </div>
              <p className="text-xs font-bold text-gray-700">{fmt(g.value, moneda)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function UserDashboard({ user }) {
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
  const [transaccionesRaw, setTransaccionesRaw] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [modal,            setModal]            = useState(null); // "ingreso" | "egreso" | null

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [rBil, rGastos, rIngresos, rTrans] = await Promise.all([
        authFetch("/billetera",                        user.token),
        authFetch("/gastos/movimientos?anio=" + anio,  user.token),
        authFetch(`/ingresos?mes=${mes}&anio=${anio}`, user.token),
        authFetch("/billetera/transacciones",          user.token),
      ]);

      if (rBil.ok) {
        const d = await rBil.json();
        setBilletera(d.billetera);
      }
      if (rGastos.ok) {
        const data = await rGastos.json();
        setGastosRaw(Object.values(data).flat());
      }
      if (rIngresos.ok) {
        const data = await rIngresos.json();
        setIngresosRaw(data.ingresos ?? []);
      }
      if (rTrans.ok) {
        const data = await rTrans.json();
        setTransaccionesRaw(data.transacciones ?? []);
      }
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, []);

  const handleTransaccionExito = async (nuevoSaldo) => {
    setBilletera(prev => ({ ...prev, saldo: nuevoSaldo }));
    setModal(null);

    const r = await authFetch("/billetera/transacciones", user.token);
    if (r.ok) {
      const d = await r.json();
      setTransaccionesRaw(d.transacciones ?? []);
    }
  };

  const filtrosProps = { periodo, setPeriodo, rangoDesde, setRangoDesde, rangoHasta, setRangoHasta };
  const tarjetaProps = {
    gastosRaw,
    ingresosRaw,
    transaccionesRaw,
    periodo,
    rangoDesde,
    rangoHasta,
    moneda: user.currency,
    token: user.token,
    onTransaccion: setModal,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Saldo billetera */}
      {billetera && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Wallet size={26} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-200 uppercase tracking-widest mb-1">Saldo en billetera</p>
            <p className="text-4xl font-bold text-white">{fmt(billetera.saldo, user.currency)}</p>
          </div>
        </div>
      )}

      {/* Selector de vista */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1.5 w-fit">
        {VISTAS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setVista(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
              ${vista === key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon size={15} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
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

      {/* Modal externo */}
      {modal && (
        <ModalTransaccion
          tipo={modal}
          moneda={user.currency}
          token={user.token}
          onClose={() => setModal(null)}
          onExito={handleTransaccionExito}
        />
      )}

    </div>
  );
}