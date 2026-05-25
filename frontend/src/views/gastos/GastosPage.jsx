import { useState, useEffect } from "react";
import { authFetch } from "../../router/authFetch";
import {
  Plus, Settings, Trash2, RefreshCw, Receipt,
  Tag, Calendar, Image, X, AlertCircle, Wallet,
  Clock, Power,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function fmt(monto, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(monto);
}

const COLORES = [
  "#ef4444","#f59e0b","#10b981","#3b82f6",
  "#9333ea","#ec4899","#6366f1","#14b8a6",
];

// ─── Estilos compartidos ──────────────────────────────────────────────────────
const input =
  "w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm outline-none " +
  "focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all bg-white";

const labelCls =
  "block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5";

const btnBase =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium " +
  "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all";

const btnRed =
  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium " +
  "bg-red-500 text-white hover:bg-red-600 transition-all border-0";

// ─── Modal Categoría ──────────────────────────────────────────────────────────
function ModalCategoria({ user, categoria, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre: categoria?.nombre ?? "",
    color:  categoria?.color  ?? "#ef4444",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
    setSaving(true);
    try {
      const method = categoria ? "PUT" : "POST";
      const url = categoria
        ? `${API}/gastos/categorias/${categoria.id}`
        : `${API}/gastos/categorias`;
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
      onSaved(); onClose();
    } catch { setError("No se pudo conectar."); }
    finally   { setSaving(false); }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-800">
            {categoria ? "Editar" : "Nueva"} categoría
          </p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Nombre</label>
            <input
              type="text"
              placeholder="Ej: Vivienda, Transporte"
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className={input}
            />
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORES.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-all ${
                    form.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-xs flex items-center gap-1.5">
              <AlertCircle size={14} />{error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className={`${btnBase} flex-1 justify-center`}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} className={`${btnRed} flex-1 justify-center disabled:opacity-50`}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal Gasto ──────────────────────────────────────────────────────────────
function ModalGasto({ user, gasto, categorias, onClose, onSaved }) {
  const [form, setForm] = useState({
    nombre:        gasto?.nombre        ?? "",
    descripcion:   gasto?.descripcion   ?? "",
    monto:         gasto?.monto         ?? "",
    dia_pago:      gasto?.dia_pago      ?? "",
    hora_pago:     gasto?.hora_pago     ?? "",
    tipo_registro: gasto?.tipo_registro ?? "manual",
    categoria_id:  gasto?.categoria_id  ?? "",
  });
  const [imagen,  setImagen]  = useState(null);
  const [preview, setPreview] = useState(gasto?.imagen_url ?? null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const handleSave = async () => {
    if (!form.nombre.trim()) { setError("El nombre es requerido."); return; }
    if (!form.monto)         { setError("El monto es requerido."); return; }
    if (!form.dia_pago)      { setError("El día de pago es requerido."); return; }
    const d = parseInt(form.dia_pago);
    if (d < 1 || d > 31)    { setError("El día debe ser entre 1 y 31."); return; }

    const hoy = new Date();
    const inicio_desde = d <= hoy.getDate() ? "actual" : "proximo";

    setSaving(true); setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      fd.append("inicio_desde", inicio_desde);
      if (imagen) fd.append("imagen", imagen);
      if (gasto)  fd.append("_method", "PUT");

      const url = gasto ? `${API}/gastos/${gasto.id}` : `${API}/gastos`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, Accept: "application/json" },
        body: fd,
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error."); return; }
      onSaved(); onClose();
    } catch { setError("No se pudo conectar."); }
    finally   { setSaving(false); }
  };

  const diaHoy = new Date().getDate();
  const diaNum = parseInt(form.dia_pago);

  const infoFecha = form.dia_pago && !isNaN(diaNum)
    ? diaNum < diaHoy
      ? { texto: "Aplica desde el próximo mes", tipo: "next" }
      : diaNum === diaHoy
      ? { texto: "Se aplicará hoy al guardar", tipo: "today" }
      : { texto: `Aplica el día ${diaNum} de este mes`, tipo: "future" }
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {gasto ? "Editar" : "Configurar"} gasto
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Completa los campos requeridos</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Columna izquierda */}
            <div className="space-y-3.5">
              <div>
                <label className={labelCls}>Nombre <span className="text-red-400">*</span></label>
                <input type="text" placeholder="Ej: Alquiler"
                  value={form.nombre}
                  onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className={input}
                />
              </div>
              <div>
                <label className={labelCls}>Descripción</label>
                <input type="text" placeholder="Ej: Departamento piso 3"
                  value={form.descripcion}
                  onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className={input}
                />
              </div>
              <div>
                <label className={labelCls}>Monto <span className="text-red-400">*</span></label>
                <input type="number" min="0" placeholder="0.00"
                  value={form.monto}
                  onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                  className={input}
                />
              </div>
              <div>
                <label className={labelCls}>Día de pago <span className="text-red-400">*</span></label>
                <input type="number" min="1" max="31" placeholder="1 — 31"
                  value={form.dia_pago}
                  onChange={e => setForm(f => ({ ...f, dia_pago: e.target.value }))}
                  className={input}
                />
                {infoFecha && (
                  <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
                    infoFecha.tipo === "today"
                      ? "text-green-600"
                      : infoFecha.tipo === "next"
                      ? "text-amber-500"
                      : "text-gray-400"
                  }`}>
                    {infoFecha.tipo === "today" && <span>✓</span>}
                    {infoFecha.texto}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Hora (opcional)</label>
                <input type="time" value={form.hora_pago}
                  onChange={e => setForm(f => ({ ...f, hora_pago: e.target.value }))}
                  className={input}
                />
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-3.5">
              <div>
                <label className={labelCls}>Tipo de registro</label>
                <div className="space-y-2">
                  {[
                    { value: "manual",     label: "Manual",     sub: "Tú confirmas cuando pagas" },
                    { value: "automatico", label: "Automático", sub: "Se descuenta solo al vencer" },
                  ].map(op => (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo_registro: op.value }))}
                      className={`w-full flex items-center gap-3 py-2.5 px-3.5 border text-left rounded-lg transition-all ${
                        form.tipo_registro === op.value
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        form.tipo_registro === op.value ? "border-red-500 bg-red-500" : "border-gray-300"
                      }`}>
                        {form.tipo_registro === op.value && (
                          <div className="w-1 h-1 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${
                          form.tipo_registro === op.value ? "text-red-600" : "text-gray-700"
                        }`}>{op.label}</p>
                        <p className="text-xs text-gray-400">{op.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Categoría</label>
                <select
                  value={form.categoria_id}
                  onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                  className={input}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Imagen (opcional)</label>
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => { setImagen(null); setPreview(null); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow text-red-500 hover:bg-red-50 transition-all"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-1.5 border border-dashed border-gray-200 rounded-lg px-4 py-5 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-all">
                    <Image size={20} className="text-gray-300" />
                    <span className="text-xs text-gray-400">Clic para seleccionar</span>
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
            <p className="text-red-500 text-xs flex items-center gap-1.5 mt-4">
              <AlertCircle size={14} />{error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-5 pb-5">
          <button onClick={onClose} className={`${btnBase} flex-1 justify-center`}>Cancelar</button>
          <button onClick={handleSave} disabled={saving} className={`${btnRed} flex-1 justify-center disabled:opacity-50`}>
            {saving ? "Guardando…" : gasto ? "Guardar cambios" : "Guardar gasto"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal Confirmar Pago ─────────────────────────────────────────────────────
function ModalConfirmarPago({ user, movimiento, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);

  const confirmar = async () => {
    setSaving(true);
    try {
      await authFetch(`/gastos/movimientos/${movimiento.id}/confirmar`, user.token, { method: "PATCH" });
      onSaved(); onClose();
    } catch {}
    finally { setSaving(false); }
  };

  const eliminar = async () => {
    setSaving(true);
    try {
      await authFetch(`/gastos/movimientos/${movimiento.id}/eliminar`, user.token, { method: "PATCH" });
      onSaved(); onClose();
    } catch {}
    finally { setSaving(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <Receipt size={20} className="text-red-500" />
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-0.5">¿Pagaste este gasto?</p>
        <p className="text-xs text-gray-500 mb-1">{movimiento.gasto?.nombre}</p>
        <p className="text-2xl font-semibold text-red-500 mb-5">
{fmt(movimiento.monto, user.currency)}        </p>
        <div className="flex gap-2.5">
          <button onClick={eliminar} disabled={saving} className={`${btnBase} flex-1 justify-center`}>
            No pagué
          </button>
          <button onClick={confirmar} disabled={saving} className={`${btnRed} flex-1 justify-center disabled:opacity-50`}>
            {saving ? "…" : "Sí, pagué"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Modal Confirmar Eliminación ──────────────────────────────────────────────
function ModalEliminar({ gasto, onClose, onConfirm }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center border border-gray-100">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-1">¿Eliminar gasto?</p>
        <p className="text-xs text-gray-500 mb-5">
          Se eliminará <strong>{gasto.nombre}</strong>. El historial no se verá afectado.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onClose} className={`${btnBase} flex-1 justify-center`}>Cancelar</button>
          <button onClick={onConfirm} className={`${btnRed} flex-1 justify-center`}>Eliminar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GastosPage({ user }) {
  const navigate = useNavigate();
  const [gastos,      setGastos]      = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [pendientes,  setPendientes]  = useState([]);
  const [billetera,   setBilletera]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [vista,       setVista]       = useState("gastos");

  const [modalGasto,      setModalGasto]      = useState(null);
  const [modalCategoria,  setModalCategoria]  = useState(null);
  const [confirmDelete,   setConfirmDelete]   = useState(null);
  const [modalPago,       setModalPago]       = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [rGas, rCat, rPen, rBil] = await Promise.all([
        authFetch("/gastos",            user.token),
        authFetch("/gastos/categorias", user.token),
        authFetch("/gastos/pendientes", user.token),
        authFetch("/billetera",         user.token),
      ]);
      if (rGas.ok) setGastos(await rGas.json());
      if (rCat.ok) setCategorias(await rCat.json());
      if (rPen.ok) setPendientes(await rPen.json());
      if (rBil.ok) { const d = await rBil.json(); setBilletera(d.billetera); }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const toggleActivo = async (gasto) => {
    await authFetch(`/gastos/${gasto.id}/toggle`, user.token, { method: "PATCH" });
    cargar();
  };

  const eliminar = async (id) => {
    await authFetch(`/gastos/${id}`, user.token, { method: "DELETE" });
    setConfirmDelete(null);
    cargar();
  };

  const eliminarCategoria = async (id) => {
    await authFetch(`/gastos/categorias/${id}`, user.token, { method: "DELETE" });
    cargar();
  };

  const noConfigurados = gastos.filter(g => !g.configurado);
  const configurados   = gastos
    .filter(g => g.configurado)
    .filter(g => {
      if (filtroCategoria === null) return true;
      if (filtroCategoria === "sin_categoria") return !g.categoria_id;
      return g.categoria_id === filtroCategoria;
    });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gastos fijos</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Egresos mensuales descontados de tu billetera
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/gastos/historial")} className={btnBase}>
            <Calendar size={15} /> Historial
          </button>
          <button onClick={() => setModalGasto("nuevo")} className={btnRed}>
            <Plus size={15} /> Nuevo gasto
          </button>
        </div>
      </div>

      {/* ── Billetera ── */}
      {billetera && (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Saldo disponible
            </p>
            <p className="text-2xl font-semibold text-gray-900 leading-tight">
{fmt(billetera.saldo, user.currency)}
            </p>
          </div>
        </div>
      )}

      {/* ── Alertas pendientes ── */}
      {pendientes.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Por confirmar este mes
          </p>
          {pendientes.map(mov => (
            <div
              key={mov.id}
              className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3"
            >
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700">{mov.gasto?.nombre}</p>
                <p className="text-xs text-amber-500">
                  {fmt(mov.monto, mov.moneda)} · ¿Ya pagaste?
                </p>
              </div>
              <button
                onClick={() => setModalPago(mov)}
                className="px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-all"
              >
                Responder
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5 w-fit">
        {[
          { key: "gastos",     label: "Mis gastos"  },
          { key: "categorias", label: "Categorías"  },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setVista(t.key); setFiltroCategoria(null); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              vista === t.key
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Filtro de categorías (solo en vista gastos) ── */}
      {!loading && vista === "gastos" && categorias.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFiltroCategoria(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filtroCategoria === null
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            Todos
          </button>
          {categorias.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFiltroCategoria(filtroCategoria === cat.id ? null : cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filtroCategoria === cat.id
                  ? "text-white border-transparent"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
              style={filtroCategoria === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: filtroCategoria === cat.id ? "rgba(255,255,255,0.7)" : cat.color }}
              />
              {cat.nombre}
            </button>
          ))}
          <button
            onClick={() => setFiltroCategoria("sin_categoria")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filtroCategoria === "sin_categoria"
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            Sin categoría
          </button>
        </div>
      )}

      {/* ── Contenido ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Cargando…</span>
        </div>

      ) : vista === "gastos" ? (
        <div className="space-y-4">

          {/* Sin configurar */}
          {noConfigurados.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Clock size={11} /> Sin configurar ({noConfigurados.length})
              </p>
              <div className="space-y-2">
                {noConfigurados.map(gasto => (
                  <div
                    key={gasto.id}
                    className="bg-white border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                      <Receipt size={16} className="text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{gasto.nombre}</p>
                      <p className="text-xs text-amber-400">Falta monto y día de pago</p>
                    </div>
                    <button
                      onClick={() => setModalGasto(gasto)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-all"
                    >
                      <Settings size={12} /> Configurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vacío */}
          {configurados.length === 0 && noConfigurados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                <Receipt size={22} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No tienes gastos configurados</p>
              <button
                onClick={() => setModalGasto("nuevo")}
                className="text-xs text-red-500 font-medium hover:underline mt-1"
              >
                Agregar primer gasto
              </button>
            </div>
          )}

          {/* Configurados */}
          {configurados.length > 0 && (
            <div>
              {noConfigurados.length > 0 && (
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Configurados
                </p>
              )}
              <div className="space-y-2">
                {configurados.map(gasto => {
                  const cat = categorias.find(c => c.id === gasto.categoria_id);
                  return (
                    <div
                      key={gasto.id}
                      className={`bg-white border border-gray-100 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-gray-200 transition-all ${
                        !gasto.activo ? "opacity-50" : ""
                      }`}
                    >
                      {/* Icono / imagen */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center border border-gray-100">
                        {gasto.imagen_url
                          ? <img src={gasto.imagen_url} alt={gasto.nombre} className="w-full h-full object-cover" />
                          : <Receipt size={16} className="text-gray-300" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                          <span className="text-sm font-medium text-gray-800">{gasto.nombre}</span>
                          {cat && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: cat.color }}
                            >
                              {cat.nombre}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            gasto.tipo_registro === "automatico"
                              ? "bg-purple-50 text-purple-600"
                              : "bg-gray-100 text-gray-400"
                          }`}>
                            {gasto.tipo_registro === "automatico" ? "Auto" : "Manual"}
                          </span>
                        </div>
                        {gasto.descripcion && (
                          <p className="text-xs text-gray-400 truncate mb-0.5">{gasto.descripcion}</p>
                        )}
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={11} />
                          Día {gasto.dia_pago}
                          {gasto.hora_pago && ` · ${gasto.hora_pago.slice(0, 5)}`}
                        </p>
                      </div>

                      {/* Monto */}
                      <p className="text-sm font-semibold text-red-500 shrink-0">
-{fmt(gasto.monto, user.currency)}
                      </p>

                      {/* Acciones */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => toggleActivo(gasto)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-all"
                          title={gasto.activo ? "Pausar" : "Activar"}
                        >
                          <Power size={15} className={gasto.activo ? "text-red-500" : "text-gray-300"} />
                        </button>
                        <button
                          onClick={() => setModalGasto(gasto)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-50 hover:text-gray-500 transition-all"
                          title="Editar"
                        >
                          <Settings size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(gasto)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      ) : (
        /* ── Categorías ── */
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalCategoria("nuevo")}
              className={btnBase}
            >
              <Plus size={15} /> Nueva categoría
            </button>
          </div>

          {categorias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                <Tag size={22} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">No hay categorías aún</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {categorias.map(cat => (
                <div
                  key={cat.id}
                  className="bg-white border border-gray-100 rounded-xl p-3.5 flex items-center gap-3 hover:border-gray-200 transition-all"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat.color + "18" }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{cat.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {cat.gastos_count ?? 0} gasto{cat.gastos_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => setModalCategoria(cat)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-gray-50 hover:text-gray-500 transition-all"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      onClick={() => eliminarCategoria(cat.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modales ── */}
      {modalGasto && (
        <ModalGasto
          user={user}
          gasto={modalGasto === "nuevo" ? null : modalGasto}
          categorias={categorias}
          onClose={() => setModalGasto(null)}
          onSaved={cargar}
        />
      )}
      {modalCategoria && (
        <ModalCategoria
          user={user}
          categoria={modalCategoria === "nuevo" ? null : modalCategoria}
          onClose={() => setModalCategoria(null)}
          onSaved={cargar}
        />
      )}
      {modalPago && (
        <ModalConfirmarPago
          user={user}
          movimiento={modalPago}
          onClose={() => setModalPago(null)}
          onSaved={cargar}
        />
      )}
      {confirmDelete && (
        <ModalEliminar
          gasto={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => eliminar(confirmDelete.id)}
        />
      )}
    </div>
  );
}