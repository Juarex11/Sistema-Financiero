import { useState } from "react";
import logo from "../../assets/logo.png";
import {
  Briefcase, TrendingUp, ArrowLeftRight,
  Home, Zap, Car, GraduationCap, Heart, Wifi,
  CreditCard, Building2, Users, CheckCircle,
  PiggyBank, BarChart2, TrendingDown, Target,
  DollarSign, Receipt, ArrowRight, ArrowLeft,
  LayoutDashboard, Check,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

async function saveStep(token, body) {
  const res = await fetch(`${API_BASE}/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res;
}

// ── Paso 1 ────────────────────────────────────────────────────────────────────
function Paso1({ data, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Moneda</label>
        <select
          value={data.moneda}
          onChange={e => onChange("moneda", e.target.value)}
          className="w-full border border-gray-200 px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-500 transition-all bg-white"
        >
          <option value="PEN">PEN — Sol peruano</option>
          <option value="USD">USD — Dólar americano</option>
          <option value="EUR">EUR — Euro</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Ingreso mensual aproximado</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-semibold">{data.moneda}</span>
          <input
            type="number" min="0" placeholder="3500"
            value={data.ingreso_mensual}
            onChange={e => onChange("ingreso_mensual", e.target.value)}
            className="w-full border border-gray-200 pl-16 pr-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-500 transition-all bg-white placeholder-gray-300"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tipo de ingreso</label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "fijo",     Icon: Briefcase,       label: "Fijo"     },
            { value: "variable", Icon: TrendingUp,      label: "Variable" },
            { value: "mixto",    Icon: ArrowLeftRight,  label: "Mixto"    },
          ].map(({ value, Icon, label }) => (
            <button key={value} type="button" onClick={() => onChange("tipo_ingreso", value)}
              className={`flex flex-col items-center gap-2.5 py-5 border transition-all ${
                data.tipo_ingreso === value
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-400 hover:border-purple-300 hover:bg-purple-50/30"
              }`}>
              <Icon size={28} strokeWidth={1.5} />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ← NUEVA PREGUNTA */}
      {data.ingreso_mensual && data.tipo_ingreso && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            ¿Este monto aplica desde cuándo?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "actual", label: "Este mes", sub: "Ya lo recibí o lo recibiré este mes" },
              { value: "proximo", label: "Próximo mes", sub: "Empieza a contar desde el mes que viene" },
            ].map(op => (
              <button key={op.value} type="button" onClick={() => onChange("inicio_desde", op.value)}
                className={`flex flex-col gap-1 py-4 px-4 border text-left transition-all ${
                  data.inicio_desde === op.value
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30"
                }`}>
                <span className={`text-sm font-semibold ${data.inicio_desde === op.value ? "text-purple-700" : "text-gray-700"}`}>
                  {op.label}
                </span>
                <span className="text-xs text-gray-400">{op.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// ── Paso 2 ────────────────────────────────────────────────────────────────────
const GASTOS_OPCIONES = [
  { value: "alquiler",   Icon: Home,          label: "Alquiler"     },
  { value: "servicios",  Icon: Zap,           label: "Servicios"    },
  { value: "transporte", Icon: Car,           label: "Transporte"   },
  { value: "educacion",  Icon: GraduationCap, label: "Educación"    },
  { value: "salud",      Icon: Heart,         label: "Salud"        },
  { value: "internet",   Icon: Wifi,          label: "Internet/Cel" },
];

function Paso2({ data, onChange }) {
  const toggle = (value) => {
    const current = data.gastos_fijos || [];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onChange("gastos_fijos", next);
  };
  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">Selecciona todos los que aplican cada mes.</p>
      <div className="grid grid-cols-3 gap-3">
        {GASTOS_OPCIONES.map(({ value, Icon, label }) => {
          const selected = (data.gastos_fijos || []).includes(value);
          return (
            <button key={value} type="button" onClick={() => toggle(value)}
              className={`flex flex-col items-center gap-2.5 py-5 border transition-all ${
                selected
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-400 hover:border-purple-300 hover:bg-purple-50/30"
              }`}>
              <Icon size={28} strokeWidth={1.5} />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Paso 3 ────────────────────────────────────────────────────────────────────
const DEUDA_OPCIONES = [
  { value: "tarjeta",  Icon: CreditCard, label: "Tarjeta crédito" },
  { value: "banco",    Icon: Building2,  label: "Préstamo banco"  },
  { value: "personal", Icon: Users,      label: "Deuda personal"  },
];

function Paso3({ data, onChange }) {
  const toggle = (value) => {
    const current = data.tipos_deuda || [];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onChange("tipos_deuda", next);
    onChange("tiene_deudas", next.length > 0);
  };
  const sinDeudas = !data.tiene_deudas && (data.tipos_deuda || []).length === 0;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Selecciona las que tengas activas.</p>
      <div className="grid grid-cols-3 gap-3">
        {DEUDA_OPCIONES.map(({ value, Icon, label }) => {
          const selected = (data.tipos_deuda || []).includes(value);
          return (
            <button key={value} type="button" onClick={() => toggle(value)}
              className={`flex flex-col items-center gap-2.5 py-5 border transition-all ${
                selected
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 bg-white text-gray-400 hover:border-purple-300 hover:bg-purple-50/30"
              }`}>
              <Icon size={28} strokeWidth={1.5} />
              <span className="text-xs font-semibold text-center leading-tight">{label}</span>
            </button>
          );
        })}
      </div>

      <button type="button"
        onClick={() => { onChange("tipos_deuda", []); onChange("tiene_deudas", false); onChange("deuda_total", ""); }}
        className={`w-full flex items-center gap-3 py-3.5 px-4 border transition-all ${
          sinDeudas ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 bg-white text-gray-500 hover:border-purple-300 hover:bg-purple-50/30"
        }`}>
        <CheckCircle size={22} strokeWidth={1.5} />
        <span className="text-sm font-semibold">Sin deudas activas</span>
      </button>

      {(data.tipos_deuda || []).length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Monto total aproximado (opcional)</label>
          <input type="number" min="0" placeholder="Ej: 8000"
            value={data.deuda_total}
            onChange={e => onChange("deuda_total", e.target.value)}
            className="w-full border border-gray-200 px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-500 transition-all bg-white placeholder-gray-300"
          />
        </div>
      )}
    </div>
  );
}

// ── Paso 4 ────────────────────────────────────────────────────────────────────
const META_OPCIONES = [
  { value: "ahorrar_mas",      Icon: PiggyBank,    label: "Ahorrar más cada mes",    sub: "Incrementar mi capacidad de ahorro mensual" },
  { value: "controlar_gastos", Icon: BarChart2,    label: "Controlar mis gastos",    sub: "Entender en qué gasto mi dinero"            },
  { value: "salir_deudas",     Icon: TrendingDown, label: "Salir de deudas",         sub: "Pagar lo que debo lo antes posible"         },
  { value: "meta_especifica",  Icon: Target,       label: "Ahorrar para una meta",   sub: "Viaje, auto, casa, tecnología..."           },
];

function Paso4({ data, onChange }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-2">Elige solo una. Podrás cambiarla después desde ajustes.</p>
      {META_OPCIONES.map(({ value, Icon, label, sub }) => (
        <button key={value} type="button" onClick={() => onChange("meta_principal", value)}
          className={`w-full flex items-center gap-4 py-3.5 px-4 border text-left transition-all ${
            data.meta_principal === value ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30"
          }`}>
          <div className={`w-12 h-12 flex items-center justify-center shrink-0 transition-all ${
            data.meta_principal === value ? "bg-purple-100 text-purple-700" : "bg-white text-gray-400"
          }`}>
            <Icon size={26} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${data.meta_principal === value ? "text-purple-700" : "text-gray-700"}`}>{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
          {data.meta_principal === value && <Check size={20} className="text-purple-500 shrink-0" />}
        </button>
      ))}
    </div>
  );
}

// ── Config pasos ──────────────────────────────────────────────────────────────
const PASOS = [
  { titulo: "¿Cuánto ganas?",    sub: "Personaliza tu experiencia según tus ingresos.",     Icon: DollarSign  },
  { titulo: "Gastos fijos",      sub: "¿Qué pagas sí o sí cada mes?",                      Icon: Receipt     },
  { titulo: "Deudas activas",    sub: "Tener claridad sobre tus deudas es el primer paso.", Icon: CreditCard  },
  { titulo: "Tu meta principal", sub: "Definir una meta te ayuda a mantenerte enfocado.",   Icon: Target      },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage({ user, onComplete }) {
  const [paso,   setPaso]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

const [form, setForm] = useState({
  moneda: "PEN", ingreso_mensual: "", tipo_ingreso: "",
  inicio_desde: "actual", // ← nuevo
  gastos_fijos: [], tiene_deudas: false, tipos_deuda: [],
  deuda_total: "", meta_principal: "",
});

  const onChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleNext = async () => {
    setError("");
    setSaving(true);
    const esUltimo = paso === 3;
    try {
      const res = await saveStep(user.token, { ...form, ultimo_paso: paso + 1, completado: esUltimo });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error al guardar."); return; }
      esUltimo ? onComplete(form.moneda) : setPaso(p => p + 1);
    } catch {
      setError("No se pudo conectar al servidor.");
    } finally {
      setSaving(false);
    }
  };

  const puedeAvanzar = () => {
    if (paso === 0) return form.ingreso_mensual !== "" && form.tipo_ingreso !== "";
    if (paso === 1) return form.gastos_fijos.length > 0;
    if (paso === 2) return true;
    if (paso === 3) return form.meta_principal !== "";
  };

  const porcentaje = Math.round(((paso + 1) / PASOS.length) * 100);
  const PasoIcon = PASOS[paso].Icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">

      {/* Barra de progreso */}
      <div className="w-full h-1 bg-purple-100">
        <div className="h-full bg-purple-600 transition-all duration-500" style={{ width: `${porcentaje}%` }} />
      </div>

      {/* Logo y formulario juntos, sin separación */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-lg">
          
          {/* Logo integrado arriba del formulario */}
          <div className="flex justify-center mb-8 pt-8">
            <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
          </div>

          {/* Indicador de paso */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-4">
              <span>Paso {paso + 1} de {PASOS.length}</span>
            </div>
            <h1 className="text-3xl font-semibold text-gray-800">{PASOS[paso].titulo}</h1>
            <p className="text-gray-500 text-sm mt-2">{PASOS[paso].sub}</p>
          </div>

          {paso === 0 && <Paso1 data={form} onChange={onChange} />}
          {paso === 1 && <Paso2 data={form} onChange={onChange} />}
          {paso === 2 && <Paso3 data={form} onChange={onChange} />}
          {paso === 3 && <Paso4 data={form} onChange={onChange} />}

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {paso > 0 && (
              <button type="button" onClick={() => setPaso(p => p - 1)}
                className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-purple-600 border border-purple-200 hover:bg-purple-50 transition-all">
                <ArrowLeft size={16} /> Atrás
              </button>
            )}
            <button type="button" onClick={handleNext}
              disabled={!puedeAvanzar() || saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 font-medium text-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {saving ? "Guardando…" :
                paso === 3
                  ? <><LayoutDashboard size={16} /> Ir a mi dashboard</>
                  : <>Continuar <ArrowRight size={16} /></>
              }
            </button>
          </div>

          {paso === 2 && (
            <button type="button" onClick={() => setPaso(3)}
              className="w-full mt-4 text-center text-xs text-purple-400 hover:text-purple-500 transition-colors">
              Saltar este paso
            </button>
          )}
        </div>
      </div>
    </div>
  );
}