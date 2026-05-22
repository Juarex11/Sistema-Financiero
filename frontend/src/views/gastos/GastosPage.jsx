import { useState, useEffect } from "react";
import { authFetch } from "../../router/authFetch";
import {
  Plus, Settings, Trash2, RefreshCw, Receipt,
  Tag, Calendar, Image,
  X, AlertCircle, Wallet, Clock, Check, Power,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

function fmt(monto, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(monto);
}

const COLORES = ["#ef4444","#f59e0b","#10b981","#3b82f6","#9333ea","#ec4899","#6366f1","#14b8a6"];

// ── Modal Categoría ───────────────────────────────────────────────────────────
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
      const url    = categoria
        ? `${API}/gastos/categorias/${categoria.id}`
        : `${API}/gastos/categorias`;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { setError("Error al guardar."); return; }
      onSaved(); onClose();
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
            <input type="text" placeholder="Ej: Vivienda, Transporte"
              value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORES.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-all">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Modal Gasto ───────────────────────────────────────────────────────────────
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
      if (gasto) fd.append("_method", "PUT");

      const url = gasto ? `${API}/gastos/${gasto.id}` : `${API}/gastos`;
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, Accept: "application/json" },
        body: fd,
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error."); return; }
      onSaved(); onClose();
    } catch { setError("No se pudo conectar."); }
    finally { setSaving(false); }
  };

  const diaHoy = new Date().getDate();
  const diaNum = parseInt(form.dia_pago);
  const infoFecha = form.dia_pago
    ? diaNum < diaHoy
      ? "⏭ Aplica desde el próximo mes"
      : diaNum === diaHoy
      ? "✅ Aplica hoy"
      : `📅 Aplica el día ${diaNum} de este mes`
    : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-gray-800">{gasto ? "Editar" : "Configurar"} gasto</h3>
            <p className="text-xs text-gray-400 mt-0.5">Completa todos los campos requeridos</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Columna izquierda */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Nombre <span className="text-red-400">*</span>
                </label>
                <input type="text" placeholder="Ej: Alquiler"
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Descripción</label>
                <input type="text" placeholder="Ej: Departamento piso 3"
                  value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Monto <span className="text-red-400">*</span>
                </label>
                <input type="number" min="0" placeholder="0.00"
                  value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                  Día de pago <span className="text-red-400">*</span>
                </label>
                <input type="number" min="1" max="31" placeholder="1 — 31"
                  value={form.dia_pago} onChange={e => setForm(f => ({ ...f, dia_pago: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
                {infoFecha && (
                  <p className="text-xs mt-1.5 text-gray-400">{infoFecha}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Hora (opcional)</label>
                <input type="time" value={form.hora_pago}
                  onChange={e => setForm(f => ({ ...f, hora_pago: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Tipo de registro</label>
                <div className="space-y-2">
                  {[
                    { value: "manual",     label: "Manual",     sub: "Tú confirmas cuando pagas" },
                    { value: "automatico", label: "Automático", sub: "Se descuenta solo al llegar el día" },
                  ].map(op => (
                    <button key={op.value} type="button"
                      onClick={() => setForm(f => ({ ...f, tipo_registro: op.value }))}
                      className={`w-full flex items-center gap-3 py-3 px-4 border text-left rounded-xl transition-all ${
                        form.tipo_registro === op.value
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 bg-white hover:border-red-200"
                      }`}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        form.tipo_registro === op.value ? "border-red-500 bg-red-500" : "border-gray-300"
                      }`}>
                        {form.tipo_registro === op.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${form.tipo_registro === op.value ? "text-red-600" : "text-gray-700"}`}>{op.label}</p>
                        <p className="text-xs text-gray-400">{op.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Categoría</label>
                <select value={form.categoria_id}
                  onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 bg-white">
                  <option value="">Sin categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Imagen (opcional)</label>
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="preview" className="w-full h-36 object-cover rounded-xl border border-gray-200" />
                    <button onClick={() => { setImagen(null); setPreview(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md text-red-500 hover:bg-red-50">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 border border-dashed border-gray-200 rounded-xl px-4 py-6 cursor-pointer hover:border-red-300 hover:bg-red-50 transition-all">
                    <Image size={22} className="text-gray-300" />
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
            <p className="text-red-500 text-sm flex items-center gap-2 mt-4">
              <AlertCircle size={16} />{error}
            </p>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-all">
            {saving ? "Guardando…" : gasto ? "Guardar cambios" : "Guardar gasto"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
// ── Modal Confirmar Pago ──────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Receipt size={24} className="text-red-500" />
        </div>
        <h3 className="font-bold text-gray-800 mb-1">¿Pagaste este gasto?</h3>
        <p className="text-sm text-gray-500 mb-1 font-semibold">{movimiento.gasto?.nombre}</p>
        <p className="text-2xl font-bold text-red-500 mb-6">{fmt(movimiento.monto, movimiento.moneda)}</p>
        <div className="flex gap-3">
          <button onClick={eliminar} disabled={saving}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50">
            No pagué
          </button>
          <button onClick={confirmar} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-all">
            {saving ? "…" : "Sí, pagué"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function GastosPage({ user }) {
  const navigate = useNavigate();
  const [gastos,      setGastos]      = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [pendientes,  setPendientes]  = useState([]);
  const [billetera,   setBilletera]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [vista,       setVista]       = useState("gastos");

  const [modalGasto,     setModalGasto]     = useState(null);
  const [modalCategoria, setModalCategoria] = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);
  const [modalPago,      setModalPago]      = useState(null);

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
  const configurados   = gastos.filter(g => g.configurado);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Egreso Gastos</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gastos fijos mensuales que se descuentan de tu billetera</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/gastos/historial")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all">
            <Calendar size={16} /> Historial
          </button>
          <button onClick={() => setModalGasto("nuevo")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all">
            <Plus size={16} /> Nuevo gasto
          </button>
        </div>
      </div>

      {/* Billetera */}
      {billetera && (
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
            <Wallet size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Saldo disponible</p>
            <p className="text-3xl font-bold text-white">{fmt(billetera.saldo, billetera.moneda)}</p>
          </div>
        </div>
      )}

      {/* Alertas pendientes */}
      {pendientes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gastos por confirmar este mes</p>
          {pendientes.map(mov => (
            <div key={mov.id}
              className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4">
              <AlertCircle size={20} className="text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-700">{mov.gasto?.nombre}</p>
                <p className="text-xs text-amber-500">{fmt(mov.monto, mov.moneda)} · ¿Ya pagaste?</p>
              </div>
              <button onClick={() => setModalPago(mov)}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all">
                Responder
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: "gastos",     label: "Mis gastos"  },
          { key: "categorias", label: "Categorías"  },
        ].map(t => (
          <button key={t.key} onClick={() => setVista(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              vista === t.key ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : vista === "gastos" ? (
        <div className="space-y-4">

          {/* Sin configurar */}
          {noConfigurados.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Clock size={12} /> Pendientes de configurar ({noConfigurados.length})
              </p>
              <div className="space-y-2">
                {noConfigurados.map(gasto => (
                  <div key={gasto.id}
                    className="bg-white border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <Receipt size={18} className="text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{gasto.nombre}</p>
                      <p className="text-xs text-amber-500">Falta configurar monto y día de pago</p>
                    </div>
                    <button onClick={() => setModalGasto(gasto)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-all">
                      <Settings size={13} /> Configurar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configurados */}
          {configurados.length === 0 && noConfigurados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
              <Receipt size={40} strokeWidth={1} className="mb-3" />
              <p className="text-sm font-medium text-gray-400">No tienes gastos configurados</p>
              <button onClick={() => setModalGasto("nuevo")}
                className="mt-4 text-sm text-red-500 font-semibold hover:underline">
                + Agregar primer gasto
              </button>
            </div>
          ) : configurados.length > 0 && (
            <div>
              {noConfigurados.length > 0 && (
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Configurados</p>
              )}
              <div className="space-y-3">
                {configurados.map(gasto => {
                  const cat = categorias.find(c => c.id === gasto.categoria_id);
                  return (
                    <div key={gasto.id}
                      className={`bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-4 transition-all ${
                        gasto.activo ? "border-gray-100" : "border-gray-100 opacity-60"
                      }`}>
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-red-50 flex items-center justify-center border border-gray-100">
                        {gasto.imagen_url ? (
                          <img src={gasto.imagen_url} alt={gasto.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Receipt size={22} className="text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-gray-800 truncate">{gasto.nombre}</p>
                          {cat && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                              style={{ backgroundColor: cat.color }}>
                              {cat.nombre}
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            gasto.tipo_registro === 'automatico'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {gasto.tipo_registro === 'automatico' ? 'Auto' : 'Manual'}
                          </span>
                          {!gasto.activo && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Pausado</span>
                          )}
                        </div>
                        {gasto.descripcion && (
                          <p className="text-xs text-gray-400 truncate">{gasto.descripcion}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={11} /> Día {gasto.dia_pago}
                            {gasto.hora_pago && ` · ${gasto.hora_pago.slice(0,5)}`}
                          </span>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-red-500 shrink-0">
                        -{fmt(gasto.monto, gasto.moneda)}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleActivo(gasto)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all">
                         <Power size={18} className={gasto.activo ? "text-red-500" : "text-gray-300"} />

                        </button>
                        <button onClick={() => setModalGasto(gasto)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-all">
                          <Settings size={16} />
                        </button>
                        <button onClick={() => setConfirmDelete(gasto)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all">
                          <Trash2 size={15} />
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
        // ── Categorías ────────────────────────────────────────────────────────
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setModalCategoria("nuevo")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all">
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
                <div key={cat.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: cat.color + "20" }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-800">{cat.nombre}</p>
                    <p className="text-xs text-gray-400">{cat.gastos_count ?? 0} gasto{cat.gastos_count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModalCategoria(cat)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-all">
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

      {/* Modales */}
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
      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800 mb-1">¿Eliminar gasto?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Se eliminará <strong>{confirmDelete.nombre}</strong>. El historial no se verá afectado.
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