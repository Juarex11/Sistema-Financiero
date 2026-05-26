// views/reportes/UserReportes.jsx
import { useState, useEffect, useCallback } from "react";
import { authFetch } from "../../router/authFetch";
import {
  TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle,
  Calendar, ChevronLeft, ChevronRight, BarChart2,
  Loader2, AlertCircle, Wallet, AlertTriangle,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

function fmt(n, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(n ?? 0);
}
function fmtFecha(str) {
  if (!str) return "";
  const [y, m, d] = str.split("-");
  return `${d}/${m}`;
}
function fmtFechaLarga(str) {
  if (!str) return "";
  const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const [, m, d] = str.split("-");
  return `${parseInt(d)} ${meses[parseInt(m) - 1]}`;
}
function hoyStr() { return new Date().toISOString().split("T")[0]; }
function inicioSemanaStr() {
  const d = new Date(), dia = d.getDay();
  d.setDate(d.getDate() - dia + (dia === 0 ? -6 : 1));
  return d.toISOString().split("T")[0];
}

const MESES   = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const PERIODOS = [
  { key: "dia", label: "Día" }, { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" }, { key: "anio",   label: "Año"    },
  { key: "rango", label: "Rango" },
];
const TABS = [
  { key: "general",  label: "General",  Icon: BarChart2    },
  { key: "gastos",   label: "Gastos",   Icon: TrendingDown },
  { key: "ingresos", label: "Ingresos", Icon: TrendingUp   },
];

// ── Tooltip ───────────────────────────────────────────────────────────────────
function TooltipCustom({ active, payload, label, moneda }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 min-w-[160px]">
      <p className="text-xs text-gray-400 mb-2 font-medium">{fmtFechaLarga(label)}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-xs text-gray-500">{p.name}</span>
          </div>
          <span className="text-xs font-bold text-gray-800">{fmt(p.value, moneda)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tarjeta resumen ───────────────────────────────────────────────────────────
function TarjetaResumen({ label, valor, moneda, color, Icon, sub }) {
  const esPos = color === "green";
  const esNeg = color === "red";
  const esWarn = color === "warning";
  return (
    <div className={`rounded-2xl p-4 border flex flex-col gap-2
      ${esPos  ? "bg-green-50 border-green-100" :
        esNeg  ? "bg-red-50 border-red-100" :
        esWarn ? "bg-amber-50 border-amber-100" :
                 "bg-white border-gray-100"}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-wider
          ${esPos ? "text-green-600" : esNeg ? "text-red-500" : esWarn ? "text-amber-600" : "text-gray-400"}`}>
          {label}
        </p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center
          ${esPos ? "bg-green-100" : esNeg ? "bg-red-100" : esWarn ? "bg-amber-100" : "bg-gray-100"}`}>
          <Icon size={15} className={esPos ? "text-green-600" : esNeg ? "text-red-500" : esWarn ? "text-amber-600" : "text-gray-500"} />
        </div>
      </div>
      <p className={`text-xl font-bold
        ${esPos ? "text-green-700" : esNeg ? "text-red-600" : esWarn ? "text-amber-700" : "text-gray-800"}`}>
        {fmt(valor, moneda)}
      </p>
      {sub && <p className="text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

// ── Saldo billetera (puede ser negativo) ──────────────────────────────────────
function TarjetaSaldo({ saldo, moneda }) {
  const negativo = saldo < 0;
  return (
    <div className={`rounded-2xl p-5 flex items-center gap-4 ${negativo
      ? "bg-gradient-to-r from-red-500 to-red-600"
      : "bg-gradient-to-r from-purple-600 to-purple-700"}`}>
      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
        {negativo
          ? <AlertTriangle size={22} className="text-white" />
          : <Wallet       size={22} className="text-white" />}
      </div>
      <div>
        <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${negativo ? "text-red-200" : "text-purple-200"}`}>
          {negativo ? "⚠ Saldo en déficit" : "Saldo en billetera"}
        </p>
        <p className="text-3xl font-bold text-white">{fmt(saldo, moneda)}</p>
        {negativo && (
          <p className="text-xs text-red-200 mt-1">Tu billetera está en números rojos</p>
        )}
      </div>
    </div>
  );
}

// ── Tabla categorías ──────────────────────────────────────────────────────────
function TablaCategorias({ datos, moneda }) {
  if (!datos?.length) return (
    <div className="text-center py-8">
      <p className="text-sm text-gray-300 font-medium">Sin datos en este periodo</p>
    </div>
  );
  return (
    <div className="space-y-2">
      {datos.map((cat, i) => (
        <div key={cat.id ?? i}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-xs font-semibold text-gray-700 truncate">{cat.nombre}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-gray-400">{cat.porcentaje}%</span>
              <span className="text-xs font-bold text-gray-800">{fmt(cat.monto, moneda)}</span>
            </div>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${cat.porcentaje}%`, backgroundColor: cat.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Pie chart ─────────────────────────────────────────────────────────────────
function GraficoPie({ datos, moneda }) {
  const validos = (datos ?? []).filter(d => d.monto > 0);
  if (!validos.length) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-gray-300">Sin datos</p>
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={validos} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
          paddingAngle={3} dataKey="monto" nameKey="nombre">
          {validos.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip formatter={(v, n) => [fmt(v, moneda), n]}
          contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Nav periodo ───────────────────────────────────────────────────────────────
function NavPeriodo({ periodo, estado, setEstado }) {
  const mover = (dir) => {
    if (periodo === "mes") {
      let m = estado.mes + dir, a = estado.anio;
      if (m > 12) { m = 1; a++; } if (m < 1) { m = 12; a--; }
      setEstado(p => ({ ...p, mes: m, anio: a }));
    } else if (periodo === "anio") {
      setEstado(p => ({ ...p, anio: p.anio + dir }));
    } else if (periodo === "semana") {
      const b = new Date(estado.semana); b.setDate(b.getDate() + dir * 7);
      setEstado(p => ({ ...p, semana: b.toISOString().split("T")[0] }));
    } else if (periodo === "dia") {
      const b = new Date(estado.fecha); b.setDate(b.getDate() + dir);
      setEstado(p => ({ ...p, fecha: b.toISOString().split("T")[0] }));
    }
  };
  const label = () => {
    if (periodo === "mes")    return `${MESES[estado.mes - 1]} ${estado.anio}`;
    if (periodo === "anio")   return `${estado.anio}`;
    if (periodo === "semana") {
      const fin = new Date(estado.semana); fin.setDate(fin.getDate() + 6);
      return `${fmtFechaLarga(estado.semana)} – ${fmtFechaLarga(fin.toISOString().split("T")[0])}`;
    }
    if (periodo === "dia") return fmtFechaLarga(estado.fecha);
    return "";
  };
  if (periodo === "rango") return null;
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => mover(-1)}
        className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <ChevronLeft size={14} className="text-gray-500" />
      </button>
      <span className="text-sm font-semibold text-gray-700 min-w-[160px] text-center">{label()}</span>
      <button onClick={() => mover(1)}
        className="w-7 h-7 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <ChevronRight size={14} className="text-gray-500" />
      </button>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function UserReportes({ user }) {
  const hoy = new Date();
  const [tab,     setTab]     = useState("general");
  const [periodo, setPeriodo] = useState("mes");
  const [estado,  setEstado]  = useState({
    mes: hoy.getMonth() + 1, anio: hoy.getFullYear(),
    semana: inicioSemanaStr(), fecha: hoyStr(),
    desde: hoyStr(), hasta: hoyStr(),
  });
  const [data,    setData]    = useState(null);
  const [saldo,   setSaldo]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const moneda = user.currency ?? "PEN";

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ periodo });
    if (periodo === "mes")    { p.set("mes", estado.mes); p.set("anio", estado.anio); }
    if (periodo === "anio")   { p.set("anio", estado.anio); }
    if (periodo === "semana") { p.set("semana", estado.semana); }
    if (periodo === "dia")    { p.set("fecha", estado.fecha); }
    if (periodo === "rango")  { p.set("desde", estado.desde); p.set("hasta", estado.hasta); }
    return p.toString();
  }, [periodo, estado]);

  const cargar = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rRep, rBil] = await Promise.all([
        authFetch(`/reportes?${buildParams()}`, user.token),
        authFetch("/billetera", user.token),
      ]);
      if (!rRep.ok) throw new Error("Error al cargar reportes");
      setData(await rRep.json());
      if (rBil.ok) { const d = await rBil.json(); setSaldo(parseFloat(d.billetera?.saldo ?? 0)); }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [buildParams]);

  useEffect(() => { cargar(); }, [cargar]);

  const resumen = data?.resumen ?? {};
  const serie   = data?.serie_general ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Encabezado + tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Reportes</h1>
          <p className="text-xs text-gray-400 mt-0.5">Análisis financiero detallado</p>
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl p-1.5">
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                ${tab === key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              <Icon size={13} strokeWidth={2} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Saldo billetera */}
      {saldo !== null && <TarjetaSaldo saldo={saldo} moneda={moneda} />}

      {/* Filtros */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {PERIODOS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriodo(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${periodo === key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {label}
            </button>
          ))}
        </div>
        <NavPeriodo periodo={periodo} estado={estado} setEstado={setEstado} />
        {periodo === "rango" && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Calendar size={12} className="text-gray-400" />
              <input type="date" value={estado.desde}
                onChange={e => setEstado(p => ({ ...p, desde: e.target.value }))}
                className="text-xs text-gray-700 outline-none bg-transparent" />
            </div>
            <span className="text-xs text-gray-400">—</span>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <Calendar size={12} className="text-gray-400" />
              <input type="date" value={estado.hasta}
                onChange={e => setEstado(p => ({ ...p, hasta: e.target.value }))}
                className="text-xs text-gray-700 outline-none bg-transparent" />
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm font-medium">Cargando reporte...</span>
        </div>
      )}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Tarjetas de resumen — incluye déficit si saldo < 0 */}
          <div className={`grid gap-3 ${saldo !== null && saldo < 0 ? "grid-cols-2 md:grid-cols-5" : "grid-cols-2 md:grid-cols-4"}`}>
            <TarjetaResumen label="Ingresos"  valor={resumen.total_ingresos} moneda={moneda} color="green"   Icon={TrendingUp}      />
            <TarjetaResumen label="Gastos"    valor={resumen.total_gastos}   moneda={moneda} color="red"     Icon={TrendingDown}    />
            <TarjetaResumen label="Beneficio" valor={resumen.beneficio}      moneda={moneda}
              color={resumen.beneficio > 0 ? "green" : "neutral"} Icon={ArrowUpCircle}
              sub={resumen.beneficio > 0 ? "Saldo positivo" : "Sin beneficio"} />
            <TarjetaResumen label="Pérdida"   valor={resumen.perdida}        moneda={moneda}
              color={resumen.perdida > 0 ? "red" : "neutral"} Icon={ArrowDownCircle}
              sub={resumen.perdida > 0 ? "Gastos > Ingresos" : "Sin pérdida"} />
            {/* Tarjeta de déficit — solo aparece cuando el saldo es negativo */}
            {saldo !== null && saldo < 0 && (
              <TarjetaResumen
                label="Déficit billetera"
                valor={saldo}
                moneda={moneda}
                color="warning"
                Icon={AlertTriangle}
                sub="Saldo en números rojos"
              />
            )}
          </div>

          {/* TAB GENERAL */}
          {tab === "general" && (
            <div className="space-y-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-1">Ingresos vs Gastos</p>
                <p className="text-xs text-gray-400 mb-5">Evolución en el periodo seleccionado</p>
                {serie.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-300 text-sm">Sin movimientos en este periodo</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={serie} margin={{ left: -10, right: 10 }}>
                      <defs>
                        <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="fecha" tickFormatter={fmtFecha} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `S/${v}`} />
                      <Tooltip content={<TooltipCustom moneda={moneda} />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={2} fill="url(#gIngresos)" dot={false} />
                      <Area type="monotone" dataKey="gastos"   name="Gastos"   stroke="#ef4444" strokeWidth={2} fill="url(#gGastos)"   dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              {serie.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-gray-800 mb-1">Balance diario</p>
                  <p className="text-xs text-gray-400 mb-5">Positivo = beneficio · Negativo = pérdida</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={serie} margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="fecha" tickFormatter={fmtFecha} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `S/${v}`} />
                      <Tooltip content={<TooltipCustom moneda={moneda} />} />
                      <Bar dataKey="balance" name="Balance" radius={[4, 4, 0, 0]}>
                        {serie.map((s, i) => <Cell key={i} fill={s.balance >= 0 ? "#10b981" : "#ef4444"} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* TAB GASTOS */}
          {tab === "gastos" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-1">Distribución de gastos</p>
                <p className="text-xs text-gray-400 mb-3">Por categoría · {fmt(data.gastos.total, moneda)} total</p>
                <GraficoPie datos={data.gastos.por_categoria} moneda={moneda} />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-1">Categorías</p>
                <p className="text-xs text-gray-400 mb-4">Porcentaje del total gastado</p>
                <TablaCategorias datos={data.gastos.por_categoria} moneda={moneda} />
              </div>
              {serie.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm md:col-span-2">
                  <p className="text-sm font-bold text-gray-800 mb-1">Gastos en el tiempo</p>
                  <p className="text-xs text-gray-400 mb-5">Monto gastado por día</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={serie} margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="fecha" tickFormatter={fmtFecha} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `S/${v}`} />
                      <Tooltip content={<TooltipCustom moneda={moneda} />} />
                      <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* TAB INGRESOS */}
          {tab === "ingresos" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-1">Distribución de ingresos</p>
                <p className="text-xs text-gray-400 mb-3">Por fuente · {fmt(data.ingresos.total, moneda)} total</p>
                <GraficoPie datos={data.ingresos.por_categoria} moneda={moneda} />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-sm font-bold text-gray-800 mb-1">Fuentes de ingreso</p>
                <p className="text-xs text-gray-400 mb-4">Porcentaje del total recibido</p>
                <TablaCategorias datos={data.ingresos.por_categoria} moneda={moneda} />
              </div>
              {serie.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm md:col-span-2">
                  <p className="text-sm font-bold text-gray-800 mb-1">Ingresos en el tiempo</p>
                  <p className="text-xs text-gray-400 mb-5">Monto recibido por día</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={serie} margin={{ left: -10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="fecha" tickFormatter={fmtFecha} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `S/${v}`} />
                      <Tooltip content={<TooltipCustom moneda={moneda} />} />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}