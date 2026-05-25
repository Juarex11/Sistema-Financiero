// views/user/modal/ModalTransaccion.jsx
import { useState, useEffect, useRef } from "react";
import { authFetch } from "../../../router/authFetch";
import {
  X, Plus, Minus, Loader2, Calendar, Tag,
  MessageSquare, FolderOpen, Image, Trash2,
} from "lucide-react";

function hoyStr() { return new Date().toISOString().split("T")[0]; }

const COLORES_PRESET = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#14b8a6",
];

export default function ModalTransaccion({ tipo, moneda, token, onClose, onExito }) {
  const esIngreso    = tipo === "ingreso";
  const fileInputRef = useRef(null);

  const [monto,        setMonto]        = useState("");
  const [descripcion,  setDescripcion]  = useState("");
  const [etiqueta,     setEtiqueta]     = useState("");
  const [fecha,        setFecha]        = useState(hoyStr());
  const [categoriaId,  setCategoriaId]  = useState("");
  const [categorias,   setCategorias]   = useState([]);
  const [fotos,        setFotos]        = useState([]);     // File[]
  const [previews,     setPreviews]     = useState([]);     // string[] base64
  const [loading,      setLoading]      = useState(false);
  const [loadingCats,  setLoadingCats]  = useState(true);
  const [error,        setError]        = useState("");
  const [showNuevaCat, setShowNuevaCat] = useState(false);
  const [nuevaCat,     setNuevaCat]     = useState({ nombre: "", color: "#6366f1", tipo: "ambos" });
  const [savingCat,    setSavingCat]    = useState(false);

  // ── Cargar categorías ──────────────────────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      setLoadingCats(true);
      try {
        const r = await authFetch("/billetera/categorias", token);
        if (r.ok) {
          const d = await r.json();
          const filtradas = (d.categorias ?? []).filter(c =>
            c.tipo === "ambos" || c.tipo === tipo
          );
          setCategorias(filtradas);
        }
      } catch {}
      finally { setLoadingCats(false); }
    };
    cargar();
  }, [tipo]);

  // ── Previews de fotos ──────────────────────────────────────────────────────
  useEffect(() => {
    const urls = fotos.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [fotos]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const agregarFotos = (e) => {
    const nuevas = Array.from(e.target.files ?? []);
    setFotos(prev => [...prev, ...nuevas].slice(0, 3));
    e.target.value = "";
  };

  const quitarFoto = (i) => setFotos(prev => prev.filter((_, idx) => idx !== i));

  const guardarCategoria = async () => {
    if (!nuevaCat.nombre.trim()) return;
    setSavingCat(true);
    try {
      const r = await authFetch("/billetera/categorias", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevaCat),
      });
      if (r.ok) {
        const d = await r.json();
        setCategorias(prev => [...prev, d.categoria]);
        setCategoriaId(String(d.categoria.id));
        setShowNuevaCat(false);
        setNuevaCat({ nombre: "", color: "#6366f1", tipo: "ambos" });
      }
    } catch {}
    finally { setSavingCat(false); }
  };

  const enviar = async () => {
    if (!monto || parseFloat(monto) <= 0) { setError("Ingresa un monto válido.");  return; }
    if (!categoriaId)                      { setError("Selecciona una categoría."); return; }
    if (!fecha)                            { setError("Selecciona una fecha.");     return; }

    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("tipo",         tipo);
      form.append("monto",        parseFloat(monto));
      form.append("descripcion",  descripcion);
      form.append("etiqueta",     etiqueta);
      form.append("fecha",        fecha);
      form.append("categoria_id", categoriaId);
      fotos.forEach(f => form.append("fotos[]", f));

      const r = await authFetch("/billetera/transacciones", token, {
        method: "POST",
        body: form,
      });
      const d = await r.json();
      if (!r.ok) { setError(d.message ?? "Error al procesar."); return; }
      onExito(d.saldo);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
              ${esIngreso ? "bg-green-100" : "bg-red-100"}`}>
              {esIngreso
                ? <Plus  size={18} className="text-green-600" strokeWidth={2.5} />
                : <Minus size={18} className="text-red-500"   strokeWidth={2.5} />}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {esIngreso ? "Agregar dinero" : "Retirar dinero"}
              </p>
              <p className="text-xs text-gray-400">Billetera · {moneda}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Monto ── */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Monto
            </label>
            <div className={`flex items-center gap-2 border-2 rounded-xl px-4 py-3 transition
              ${esIngreso
                ? "border-green-200 focus-within:border-green-400"
                : "border-red-200   focus-within:border-red-400"}`}>
              <span className="text-base font-bold text-gray-400">{moneda}</span>
              <input
                type="number" min="0.01" step="0.01" placeholder="0.00"
                value={monto} onChange={e => setMonto(e.target.value)}
                className="flex-1 outline-none text-3xl font-bold text-gray-800 bg-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* ── Fecha ── */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              <Calendar size={12} className="inline mr-1.5" />
              Fecha
            </label>
            <input
              type="date"
              max={hoyStr()}
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* ── Categoría ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <FolderOpen size={12} className="inline mr-1.5" />
                Categoría
              </label>
              <button
                onClick={() => setShowNuevaCat(v => !v)}
                className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <Plus size={12} />
                Nueva
              </button>
            </div>

            {/* Crear categoría inline */}
            {showNuevaCat && (
              <div className="mb-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <input
                  type="text" placeholder="Nombre de la categoría"
                  value={nuevaCat.nombre}
                  onChange={e => setNuevaCat(p => ({ ...p, nombre: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400 transition"
                />
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium">Color</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLORES_PRESET.map(c => (
                      <button
                        key={c}
                        onClick={() => setNuevaCat(p => ({ ...p, color: c }))}
                        className={`w-7 h-7 rounded-full transition-all
                          ${nuevaCat.color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color" value={nuevaCat.color}
                      onChange={e => setNuevaCat(p => ({ ...p, color: e.target.value }))}
                      className="w-7 h-7 rounded-full border-0 cursor-pointer bg-transparent"
                      title="Color personalizado"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={nuevaCat.tipo}
                    onChange={e => setNuevaCat(p => ({ ...p, tipo: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400 transition"
                  >
                    <option value="ambos">Ingresos y Egresos</option>
                    <option value="ingreso">Solo Ingresos</option>
                    <option value="egreso">Solo Egresos</option>
                  </select>
                  <button
                    onClick={guardarCategoria}
                    disabled={savingCat || !nuevaCat.nombre.trim()}
                    className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition flex items-center gap-1.5"
                  >
                    {savingCat ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Crear
                  </button>
                </div>
              </div>
            )}

            {loadingCats ? (
              <div className="flex items-center gap-2 py-3 text-gray-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Cargando...
              </div>
            ) : categorias.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">
                No hay categorías. Crea una con el botón "Nueva".
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {categorias.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategoriaId(String(c.id))}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all
                      ${String(categoriaId) === String(c.id)
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"}`}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className={`text-xs font-semibold truncate
                      ${String(categoriaId) === String(c.id) ? "text-purple-700" : "text-gray-600"}`}>
                      {c.nombre}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Etiqueta ── */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              <Tag size={12} className="inline mr-1.5" />
              Etiqueta
            </label>
            <input
              type="text" placeholder="Ej: viaje, emergencia, ahorro..."
              value={etiqueta} onChange={e => setEtiqueta(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-purple-400 transition"
            />
          </div>

          {/* ── Comentario ── */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              <MessageSquare size={12} className="inline mr-1.5" />
              Comentario
            </label>
            <textarea
              rows={2} placeholder="Notas opcionales..."
              value={descripcion} onChange={e => setDescripcion(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-purple-400 transition resize-none"
            />
          </div>

          {/* ── Fotos ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <Image size={12} className="inline mr-1.5" />
                Fotos <span className="text-gray-300 font-normal">({fotos.length}/3)</span>
              </label>
              {fotos.length < 3 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <Plus size={12} /> Agregar
                </button>
              )}
            </div>

            <input
              ref={fileInputRef} type="file" accept="image/*"
              multiple className="hidden"
              onChange={agregarFotos}
            />

            {previews.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => quitarFoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                    >
                      <Trash2 size={10} className="text-white" />
                    </button>
                  </div>
                ))}
                {fotos.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-purple-300 transition text-gray-300 hover:text-purple-400"
                  >
                    <Plus size={20} />
                    <span className="text-xs font-medium">Foto</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-purple-300 transition text-gray-300 hover:text-purple-400"
              >
                <Image size={24} />
                <span className="text-xs font-medium">Toca para agregar fotos (máx. 3)</span>
              </button>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* ── Botón principal ── */}
          <button
            onClick={enviar}
            disabled={loading}
            className={`w-full py-4 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2
              ${esIngreso
                ? "bg-green-500 hover:bg-green-600 disabled:bg-green-300"
                : "bg-red-500  hover:bg-red-600  disabled:bg-red-300"}`}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" /> Procesando...</>
              : esIngreso ? "Confirmar ingreso" : "Confirmar egreso"}
          </button>

        </div>
      </div>
    </div>
  );
}