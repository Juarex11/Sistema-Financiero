// views/user/modal/ModalTransaccion.jsx
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { authFetch } from "../../../router/authFetch";
import {
  X, Plus, Minus, Loader2, Calendar, Tag,
  MessageSquare, FolderOpen, Image, Trash2,
} from "lucide-react";

function hoyStr() { return new Date().toISOString().split("T")[0]; }

export default function ModalTransaccion({ tipo, moneda, token, onClose, onExito }) {
  const esIngreso    = tipo === "ingreso";
  const fileInputRef = useRef(null);

  const [monto,       setMonto]       = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [etiqueta,    setEtiqueta]    = useState("");
  const [fecha,       setFecha]       = useState(hoyStr());
  const [categoriaId, setCategoriaId] = useState("");
  const [categorias,  setCategorias]  = useState([]);
  const [fotos,       setFotos]       = useState([]);
  const [previews,    setPreviews]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error,       setError]       = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const cargar = async () => {
      setLoadingCats(true);
      try {
        const r = await authFetch("/billetera/categorias", token);
        if (r.ok) {
          const d = await r.json();
          setCategorias((d.categorias ?? []).filter(c => c.tipo === "ambos" || c.tipo === tipo));
        }
      } catch {}
      finally { setLoadingCats(false); }
    };
    cargar();
  }, [tipo]);

  useEffect(() => {
    const urls = fotos.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [fotos]);

  const agregarFotos = (e) => {
    const nuevas = Array.from(e.target.files ?? []);
    setFotos(prev => [...prev, ...nuevas].slice(0, 3));
    e.target.value = "";
  };

  const quitarFoto = (i) => setFotos(prev => prev.filter((_, idx) => idx !== i));

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
      const r = await authFetch("/billetera/transacciones", token, { method: "POST", body: form });
      const d = await r.json();
      if (!r.ok) { setError(d.message ?? "Error al procesar."); return; }
      onExito(d.saldo);
    } catch { setError("Error de conexión."); }
    finally { setLoading(false); }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-5 py-4 ${esIngreso ? "bg-green-500" : "bg-red-500"}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              {esIngreso
                ? <Plus  size={18} className="text-white" strokeWidth={2.5} />
                : <Minus size={18} className="text-white" strokeWidth={2.5} />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {esIngreso ? "Agregar dinero" : "Retirar dinero"}
              </p>
              <p className="text-xs text-white/70">Billetera · {moneda}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition">
            <X size={16} className="text-white" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* ── Fila 1: Monto + Fecha ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Monto
              </label>
              <div className={`flex items-center gap-2 border-2 rounded-xl px-3 py-2.5 transition
                ${esIngreso ? "border-green-200 focus-within:border-green-400" : "border-red-200 focus-within:border-red-400"}`}>
                <span className="text-xs font-bold text-gray-400">{moneda}</span>
                <input
                  type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={monto} onChange={e => setMonto(e.target.value)}
                  className="flex-1 outline-none text-xl font-bold text-gray-800 bg-transparent w-full"
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                <Calendar size={11} className="inline mr-1" />Fecha
              </label>
              <input
                type="date" max={hoyStr()} value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-400 transition"
              />
            </div>
          </div>

          {/* ── Fila 2: Etiqueta + Comentario ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                <Tag size={11} className="inline mr-1" />Etiqueta
              </label>
              <input
                type="text" placeholder="viaje, ahorro..."
                value={etiqueta} onChange={e => setEtiqueta(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-400 transition"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                <MessageSquare size={11} className="inline mr-1" />Comentario
              </label>
              <input
                type="text" placeholder="Notas opcionales..."
                value={descripcion} onChange={e => setDescripcion(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-purple-400 transition"
              />
            </div>
          </div>

          {/* ── Categoría ── */}
          <div>
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              <FolderOpen size={11} className="inline mr-1" />Categoría
            </label>

            {loadingCats ? (
              <div className="flex items-center gap-2 py-2 text-gray-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Cargando...
              </div>
            ) : categorias.length === 0 ? (
              <p className="text-xs text-gray-400 py-1">
                No hay categorías disponibles. Créalas desde "Categorías" en el dashboard.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {categorias.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategoriaId(String(c.id))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all
                      ${String(categoriaId) === String(c.id)
                        ? "border-purple-400 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 bg-white"}`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className={`text-xs font-semibold truncate ${String(categoriaId) === String(c.id) ? "text-purple-700" : "text-gray-600"}`}>
                      {c.nombre}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Fotos ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                <Image size={11} className="inline mr-1" />
                Fotos <span className="text-gray-300 font-normal">({fotos.length}/3)</span>
              </label>
              {fotos.length < 3 && (
                <button onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5">
                  <Plus size={11} />Agregar
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={agregarFotos} />

            {previews.length > 0 ? (
              <div className="flex gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => quitarFoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow">
                      <Trash2 size={9} className="text-white" />
                    </button>
                  </div>
                ))}
                {fotos.length < 3 && (
                  <button onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-purple-300 transition text-gray-300 hover:text-purple-400">
                    <Plus size={16} />
                    <span className="text-[10px] font-medium">Foto</span>
                  </button>
                )}
              </div>
            ) : (
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full h-16 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 hover:border-purple-300 transition text-gray-300 hover:text-purple-400">
                <Image size={18} />
                <span className="text-xs font-medium">Toca para agregar fotos (máx. 3)</span>
              </button>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* ── Botón principal ── */}
          <button
            onClick={enviar}
            disabled={loading}
            className={`w-full py-3 rounded-xl text-sm font-bold text-white transition flex items-center justify-center gap-2
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
    </div>,
    document.body
  );
}