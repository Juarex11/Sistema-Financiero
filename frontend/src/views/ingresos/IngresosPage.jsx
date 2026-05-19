import { useState, useEffect } from "react";
import { authFetch } from "../../router/authFetch";
import {
  TrendingUp, Plus, Check, Trash2,
  DollarSign, Calendar, AlertCircle, Settings,
  ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import ModalIngreso  from "./ModalIngreso";
import ModalConfig   from "./ModalConfig";
import ModalDiaPago  from "./ModalDiaPago";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmt(monto, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(monto);
}

function TipoBadge({ tipo }) {
  const map = {
    fijo:     { label: "Fijo",     cls: "bg-purple-100 text-purple-700" },
    variable: { label: "Variable", cls: "bg-blue-100 text-blue-700"     },
    extra:    { label: "Extra",    cls: "bg-green-100 text-green-700"   },
  };
  const { label, cls } = map[tipo] ?? { label: tipo, cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function CustomTooltip({ active, payload, label, moneda }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-purple-700">{fmt(payload[0].value, moneda)}</p>
    </div>
  );
}

export default function IngresosPage({ user }) {
  const hoy  = new Date();
  const [mes,  setMes]  = useState(hoy.getMonth() + 1);
  const [anio, setAnio] = useState(hoy.getFullYear());

  const [config,   setConfig]   = useState(null);
  const [ingresos, setIngresos] = useState([]);
  const [resumen,  setResumen]  = useState({ total_confirmado: 0, total_proyectado: 0 });
  const [loading,  setLoading]  = useState(true);
  const [chartData, setChartData] = useState([]);
const [showModalDiaPago, setShowModalDiaPago] = useState(false);

  const [showModalIngreso, setShowModalIngreso] = useState(false);
  const [showModalConfig,  setShowModalConfig]  = useState(false);

const cargar = async () => {
  setLoading(true);
  try {
    const [rConfig, rIngresos] = await Promise.all([
      authFetch("/ingresos/config", user.token),
      authFetch(`/ingresos?mes=${mes}&anio=${anio}`, user.token),
    ]);
    const cfg = rConfig.ok ? await rConfig.json() : null;
    console.log("CFG STATUS:", rConfig.status);
    console.log("CFG VALUE:", cfg);
    const ing = rIngresos.ok ? await rIngresos.json() : { ingresos: [], total_confirmado: 0, total_proyectado: 0 };

    setConfig(cfg);
    if (cfg && cfg.dia_pago === 0) {
    setShowModalDiaPago(true);
}
      setIngresos(ing.ingresos ?? []);
      setResumen({ total_confirmado: ing.total_confirmado, total_proyectado: ing.total_proyectado });

      const promesas = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(anio, mes - 1 - i, 1);
        promesas.push(
          authFetch(`/ingresos?mes=${d.getMonth() + 1}&anio=${d.getFullYear()}`, user.token)
            .then(r => r.ok ? r.json() : { total_confirmado: 0 })
            .then(data => ({
              mes: MESES[d.getMonth()].slice(0, 3),
              total: parseFloat(data.total_confirmado ?? 0),
            }))
        );
      }
      setChartData(await Promise.all(promesas));
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [mes, anio]);

  const confirmar = async (id) => {
    await authFetch(`/ingresos/${id}/confirmar`, user.token, { method: "PATCH" });
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este ingreso?")) return;
    await authFetch(`/ingresos/${id}`, user.token, { method: "DELETE" });
    cargar();
  };

  const navMes = (dir) => {
    const d = new Date(anio, mes - 1 + dir, 1);
    setMes(d.getMonth() + 1);
    setAnio(d.getFullYear());
  };

  const mesActual      = mes === hoy.getMonth() + 1 && anio === hoy.getFullYear();
  const sinIngresosVar = (config?.tipo === "variable" || config?.tipo === "mixto")
    && mesActual && ingresos.filter(i => i.tipo === "variable").length === 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona y visualiza tus ingresos mensuales</p>
        </div>
        <div className="flex gap-2">
        <button onClick={() => config && setShowModalConfig(true)}
  disabled={loading || !config}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
            <Settings size={16} /> Configurar
          </button>
          <button onClick={() => setShowModalIngreso(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all">
            <Plus size={16} /> Agregar ingreso
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => navMes(-1)} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-gray-800 min-w-[160px] text-center">{MESES[mes - 1]} {anio}</h2>
        <button onClick={() => navMes(1)} disabled={mesActual}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-30">
          <ChevronRight size={18} />
        </button>
        <button onClick={cargar} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all">
          <RefreshCw size={15} />
        </button>
      </div>

      {sinIngresosVar && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4">
          <AlertCircle size={22} className="text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-700">¿Cuánto ganaste este mes?</p>
            <p className="text-xs text-amber-500 mt-0.5">Registra tu ingreso de {MESES[mes - 1]} para llevar un control preciso.</p>
          </div>
          <button onClick={() => setShowModalIngreso(true)}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all">
            Registrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Total confirmado</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(resumen.total_confirmado, user.currency)}</p>
          <p className="text-xs text-green-500 font-semibold mt-1 flex items-center gap-1"><Check size={12} /> Dinero recibido</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Proyectado</p>
          <p className="text-2xl font-bold text-gray-900">{fmt(resumen.total_proyectado, user.currency)}</p>
          <p className="text-xs text-blue-400 font-semibold mt-1 flex items-center gap-1"><Calendar size={12} /> Por recibir</p>
        </div>
    <div className="bg-purple-600 rounded-2xl p-5 shadow-sm">
  <p className="text-xs font-semibold text-purple-200 uppercase tracking-widest mb-2">Total del mes</p>
  <p className="text-2xl font-bold text-white">
    {fmt(parseFloat(resumen.total_confirmado) + parseFloat(resumen.total_proyectado), user.currency)}
  </p>
  <div className="flex items-center gap-3 mt-2">
    {config ? (
      <>
        <span className="text-xs text-purple-200 font-semibold flex items-center gap-1">
          <TrendingUp size={12} />
          {config.tipo === "fijo"     && "Fijo"}
          {config.tipo === "variable" && "Variable"}
          {config.tipo === "mixto"    && "Mixto"}
        </span>
        {config.monto_base && (
  <span className="text-xs bg-purple-500 text-purple-100 px-2 py-0.5 rounded-full font-semibold">
    Base: {fmt(config.monto_base, user.currency)}
  </span>
)}
{config.dia_pago > 0 && (
  <span className="text-xs bg-purple-500 text-purple-100 px-2 py-0.5 rounded-full font-semibold">
    Día {config.dia_pago} de cada mes
  </span>
)}
      </>
    ) : (
      <span className="text-xs text-purple-300">Sin configurar</span>
    )}
  </div>
</div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <p className="text-sm font-bold text-gray-700 mb-5">Ingresos confirmados — últimos 6 meses</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#9333ea" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#9333ea" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60}
              tickFormatter={v => new Intl.NumberFormat("es-PE", { notation: "compact" }).format(v)} />
            <Tooltip content={<CustomTooltip moneda={user.currency} />} />
            <Area type="monotone" dataKey="total" stroke="#9333ea" strokeWidth={2.5}
              fill="url(#colorIngreso)" dot={{ fill: "#9333ea", strokeWidth: 2, r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-700">Ingresos de {MESES[mes - 1]}</p>
          <span className="text-xs text-gray-400">{ingresos.length} registros</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
          </div>
        ) : ingresos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300">
            <DollarSign size={40} strokeWidth={1} className="mb-3" />
            <p className="text-sm font-medium text-gray-400">Sin ingresos este mes</p>
            <button onClick={() => setShowModalIngreso(true)}
              className="mt-4 text-sm text-purple-600 font-semibold hover:underline">
              + Agregar primero
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ingresos.map(ing => (
              <div key={ing.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  ing.confirmado ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {ing.confirmado ? <Check size={18} /> : <Calendar size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{ing.descripcion || "Ingreso"}</p>
                    <TipoBadge tipo={ing.tipo} />
                    {!ing.confirmado && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Proyectado</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                  {(() => {
  if (!ing.fecha) return "Sin fecha";
  const partes = ing.fecha.split("T")[0].split("-");
  if (partes.length < 3) return "Sin fecha";
  const [y, m, d] = partes;
  return new Date(Number(y), Number(m) - 1, Number(d))
    .toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
})()}
                  </p>
                </div>
                <p className={`text-base font-bold shrink-0 ${ing.confirmado ? "text-gray-900" : "text-gray-400"}`}>
                  {fmt(ing.monto, ing.moneda)}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {!ing.confirmado && (
                    <button onClick={() => confirmar(ing.id)} title="Confirmar recibido"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-green-500 hover:bg-green-50 transition-all">
                      <Check size={16} />
                    </button>
                  )}
                  {ing.tipo !== "fijo" && (
                    <button onClick={() => eliminar(ing.id)} title="Eliminar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

  {showModalIngreso && (
    <ModalIngreso user={user} config={config} onClose={() => setShowModalIngreso(false)} onSaved={cargar} />
)}
{showModalConfig && (
    <ModalConfig user={user} config={config} onClose={() => setShowModalConfig(false)} onSaved={cargar} />
)}
{showModalDiaPago && (
    <ModalDiaPago
        user={user}
        config={config}
        onSaved={() => { setShowModalDiaPago(false); cargar(); }}
    />
)}
    </div>
  );
}