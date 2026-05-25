import { useState, useEffect } from "react";
import { authFetch } from "../../router/authFetch";
import {
  Plus, Settings, Trash2, RefreshCw, DollarSign,
  Tag, ToggleLeft, ToggleRight, Calendar, Image,
  ChevronRight, X, AlertCircle, Wallet,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function fmt(monto, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(monto);
}

// ── Modal Categoría ───────────────────────────────────────────────────────────
const ICONOS = ["DollarSign","Wallet","TrendingUp","Briefcase","Home","Car","Heart","Star","Gift","Coffee"];
const COLORES = ["#9333ea","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#6366f1","#14b8a6"];

function ModalCategoria({ user, categoria, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: categoria?.nombre ?? "",
    color:  categoria?.color  ?? "#9333ea",
    icono:  categoria?.icono  ?? "DollarSign",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
    setSaving(true);
    try {
      const method = categoria ? "PUT" : "POST";
      const url    = categoria
        ? `${API}/entradas/categorias/${categoria.id}`
        : `${API}/entradas/categorias`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setError("Error al guardar."); return; }
      onSaved();
      onClose();
    } catch { setError("No se pudo conectar."); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{categoria ? "Editar" : "Nueva"} categoría</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Nombre</label>
            <input type="text" placeholder="Ej: Sueldo, Arriendo, Pensión"
              value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORES.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-purple-500 scale-110" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Modal Entrada ─────────────────────────────────────────────────────────────
function ModalEntrada({ user, entrada, categorias, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:        entrada?.nombre        ?? "",
    descripcion:   entrada?.descripcion   ?? "",
    monto:         entrada?.monto         ?? "",
    dia_pago:      entrada?.dia_pago      ?? "",
    hora_pago:     entrada?.hora_pago     ?? "",
    inicio_desde:  entrada?.inicio_desde  ?? "proximo",
    categoria_id:  entrada?.categoria_id  ?? "",
  });
  const [imagen,  setImagen]  = useState(null);
  const [preview, setPreview] = useState(entrada?.imagen_url ?? null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.monto || !form.dia_pago) {
      setError("Nombre, monto y día de pago son requeridos.");
      return;
    }
    const d = parseInt(form.dia_pago);
    if (d < 1 || d > 31) { setError("El día debe ser entre 1 y 31."); return; }

    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      if (imagen) fd.append("imagen", imagen);
      if (entrada) fd.append("_method", "PUT");

      const url = entrada ? `${API}/entradas/${entrada.id}` : `${API}/entradas`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, Accept: "application/json" },
        body: fd,
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error."); return; }
      onSaved();
      onClose();
    } catch { setError("No se pudo conectar."); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-gray-800">{entrada ? "Editar" : "Nueva"} entrada fija</h3>
            <p className="text-xs text-gray-400 mt-0.5">Completa los campos requeridos</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Columna izquierda */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input type="text" placeholder="Ej: Sueldo mensual"
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Descripción</label>
                <input type="text" placeholder="Ej: Empresa ABC"
                  value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Monto <span className="text-red-400">*</span>
                  </label>
                  <input type="number" min="0" placeholder="0.00"
                    value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    Día de pago <span className="text-red-400">*</span>
                  </label>
                  <input type="number" min="1" max="31" placeholder="1 — 31"
                    value={form.dia_pago} onChange={e => setForm(f => ({ ...f, dia_pago: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Hora (opcional)</label>
                <input type="time"
                  value={form.hora_pago} onChange={e => setForm(f => ({ ...f, hora_pago: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Categoría</label>
                <select value={form.categoria_id} onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 bg-white">
                  <option value="">Sin categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              {!entrada && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">¿Desde cuándo aplica?</label>
                  <div className="space-y-2">
                    {[
                      { value: "actual",  label: "Este mes",    sub: "Se registra ahora mismo"      },
                      { value: "proximo", label: "Próximo mes", sub: "Empieza el mes que viene"      },
                    ].map(op => (
                      <button key={op.value} type="button" onClick={() => setForm(f => ({ ...f, inicio_desde: op.value }))}
                        className={`w-full flex items-center gap-3 py-3 px-4 border text-left rounded-xl transition-all ${
                          form.inicio_desde === op.value
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 bg-white hover:border-purple-300"
                        }`}>
                        <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          form.inicio_desde === op.value ? "border-purple-500 bg-purple-500" : "border-gray-300"
                        }`}>
                          {form.inicio_desde === op.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${form.inicio_desde === op.value ? "text-purple-700" : "text-gray-700"}`}>{op.label}</p>
                          <p className="text-xs text-gray-400">{op.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Imagen (opcional)</label>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="preview" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => { setImagen(null); setPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md text-red-500 hover:bg-red-50">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 border border-dashed border-gray-200 rounded-xl px-4 py-8 cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all">
                    <Image size={24} className="text-gray-300" />
                    <span className="text-sm text-gray-400">Clic para seleccionar</span>
                    <span className="text-xs text-gray-300">PNG, JPG hasta 4MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                      const file = e.target.files[0];
                      if (file) { setImagen(file); setPreview(URL.createObjectURL(file)); }
                    }} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm flex items-center gap-2 mt-4">
              <AlertCircle size={16} />{error}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all">
            {saving ? "Guardando…" : entrada ? "Guardar cambios" : "Crear entrada"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MisEntradasPage({ user }) {
      const navigate = useNavigate();

  const [entradas,    setEntradas]    = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [billetera,   setBilletera]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [vista,       setVista]       = useState("entradas"); // entradas | categorias

  const [modalEntrada,   setModalEntrada]   = useState(null);  // null | "nuevo" | entrada
  const [modalCategoria, setModalCategoria] = useState(null);  // null | "nuevo" | categoria
  const [confirmDelete,  setConfirmDelete]  = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [rEnt, rCat, rBil] = await Promise.all([
        authFetch("/entradas",            user.token),
        authFetch("/entradas/categorias", user.token),
        authFetch("/billetera",           user.token),
      ]);
      if (rEnt.ok) setEntradas(await rEnt.json());
      if (rCat.ok) setCategorias(await rCat.json());
      if (rBil.ok) {
        const d = await rBil.json();
        setBilletera(d.billetera);
      }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const toggleActivo = async (entrada) => {
    await authFetch(`/entradas/${entrada.id}/toggle`, user.token, { method: "PATCH" });
    cargar();
  };

  const eliminar = async (id) => {
    await authFetch(`/entradas/${id}`, user.token, { method: "DELETE" });
    setConfirmDelete(null);
    cargar();
  };

  const eliminarCategoria = async (id) => {
    await authFetch(`/entradas/categorias/${id}`, user.token, { method: "DELETE" });
    cargar();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Entradas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ingresos fijos que se registran automáticamente</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalEntrada("nuevo")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all">
            <Plus size={16} /> Nueva entrada
          </button>
        </div>
      </div>

      {/* Billetera */}
      {billetera && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Wallet size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-purple-200 uppercase tracking-widest mb-0.5">Saldo en billetera</p>
<p className="text-3xl font-bold text-white">{fmt(billetera.saldo, user.currency)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
       {[
  { key: "entradas",   label: "Entradas fijas", action: () => setVista("entradas")   },
  { key: "categorias", label: "Categorías",     action: () => setVista("categorias") },
  { key: "historial",  label: "Historial",      action: () => navigate("/mis-entradas/historial") },
].map(t => (
  <button key={t.key} onClick={t.action}
    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
      vista === t.key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
    }`}>
    {t.label}
  </button>
))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : vista === "entradas" ? (

        // ── Lista entradas ──────────────────────────────────────────────────
        entradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <DollarSign size={40} strokeWidth={1} className="mb-3" />
            <p className="text-sm font-medium text-gray-400">No tienes entradas configuradas</p>
            <button onClick={() => setModalEntrada("nuevo")}
              className="mt-4 text-sm text-purple-600 font-semibold hover:underline">
              + Crear primera entrada
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entradas.map(entrada => {
              const cat = categorias.find(c => c.id === entrada.categoria_id);
              return (
                <div key={entrada.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 transition-all ${
                    entrada.activo ? "border-gray-100" : "border-gray-100 opacity-60"
                  }`}>

                  {/* Imagen o icono */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-purple-50 flex items-center justify-center border border-gray-100">
                    {entrada.imagen_url ? (
                      <img src={entrada.imagen_url} alt={entrada.nombre} className="w-full h-full object-cover" />
                    ) : (
                      <DollarSign size={22} className="text-purple-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-gray-800 truncate">{entrada.nombre}</p>
                      {cat && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: cat.color }}>
                          {cat.nombre}
                        </span>
                      )}
                      {!entrada.activo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Pausada</span>
                      )}
                    </div>
                    {entrada.descripcion && (
                      <p className="text-xs text-gray-400 truncate">{entrada.descripcion}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={11} /> Día {entrada.dia_pago}
                        {entrada.hora_pago && ` · ${entrada.hora_pago.slice(0,5)}`}
                      </span>
                    </div>
                  </div>

                  {/* Monto */}
                  <p className="text-lg font-bold text-gray-900 shrink-0">
{fmt(entrada.monto, user.currency)}                  </p>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActivo(entrada)} title={entrada.activo ? "Pausar" : "Activar"}
                      className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all">
                      {entrada.activo
                        ? <ToggleRight size={22} className="text-purple-600" />
                        : <ToggleLeft  size={22} className="text-gray-400"   />
                      }
                    </button>
                    <button onClick={() => setModalEntrada(entrada)} title="Editar"
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-purple-600 transition-all">
                      <Settings size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(entrada)} title="Eliminar"
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )

      ) : (

        // ── Lista categorías ────────────────────────────────────────────────
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setModalCategoria("nuevo")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-purple-200 text-purple-600 text-sm font-semibold hover:bg-purple-50 transition-all">
              <Plus size={16} /> Nueva categoría
            </button>
          </div>

          {categorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-300">
              <Tag size={40} strokeWidth={1} className="mb-3" />
              <p className="text-sm font-medium text-gray-400">No hay categorías aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categorias.map(cat => (
                <div key={cat.id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat.color + "20" }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{cat.nombre}</p>
                    <p className="text-xs text-gray-400">{cat.entradas_count ?? 0} entrada{cat.entradas_count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModalCategoria(cat)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-purple-600 transition-all">
                      <Settings size={14} />
                    </button>
                    <button onClick={() => eliminarCategoria(cat.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal entrada */}
      {modalEntrada && (
        <ModalEntrada
          user={user}
          entrada={modalEntrada === "nuevo" ? null : modalEntrada}
          categorias={categorias}
          onClose={() => setModalEntrada(null)}
          onSaved={cargar}
        />
      )}

      {/* Modal categoría */}
      {modalCategoria && (
        <ModalCategoria
          user={user}
          categoria={modalCategoria === "nuevo" ? null : modalCategoria}
          onClose={() => setModalCategoria(null)}
          onSaved={cargar}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">¿Eliminar entrada?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Se eliminará <strong>{confirmDelete.nombre}</strong>. Los movimientos anteriores no se verán afectados.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => eliminar(confirmDelete.id)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all">
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}