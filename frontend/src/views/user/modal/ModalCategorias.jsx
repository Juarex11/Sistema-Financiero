// views/user/modal/ModalCategorias.jsx
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { authFetch } from "../../../router/authFetch";
import {
  X, Plus, Pencil, Trash2, Check, Loader2, Tags,
} from "lucide-react";

const COLORES_PRESET = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#10b981", "#3b82f6", "#14b8a6",
];

const TIPOS = [
  { key: "ingreso", label: "Solo ingresos" },
  { key: "egreso",  label: "Solo egresos"  },
  { key: "ambos",   label: "Ambos"         },
];

function badgeTipo(tipo) {
  const map = {
    ingreso: "bg-green-100 text-green-700",
    egreso:  "bg-red-100 text-red-700",
    ambos:   "bg-purple-100 text-purple-700",
  };
  const label = { ingreso: "Ingreso", egreso: "Egreso", ambos: "Ambos" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[tipo] ?? map.ambos}`}>
      {label[tipo] ?? "Ambos"}
    </span>
  );
}

function FormCategoria({ initial, onSave, onCancel, loading }) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [color,  setColor]  = useState(initial?.color  ?? "#6366f1");
  const [tipo,   setTipo]   = useState(initial?.tipo   ?? "ambos");

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
      <input
        type="text"
        placeholder="Nombre de la categoría"
        value={nombre}
        onChange={e => setNombre(e.target.value)}
        maxLength={60}
        autoFocus
        className="w-full text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 transition placeholder-gray-300"
      />
      <select
        value={tipo}
        onChange={e => setTipo(e.target.value)}
        className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-purple-400 transition"
      >
        {TIPOS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
      </select>
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Color</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {COLORES_PRESET.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:scale-110 transition-all relative overflow-hidden">
            <span className="text-[10px] text-gray-400 font-bold select-none">+</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
          </label>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs text-gray-700 font-medium truncate flex-1">{nombre || "Vista previa"}</span>
        {badgeTipo(tipo)}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
        >
          Cancelar
        </button>
        <button
          onClick={() => nombre.trim() && onSave({ nombre: nombre.trim(), color, tipo })}
          disabled={loading || !nombre.trim()}
          className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          {initial ? "Actualizar" : "Crear"}
        </button>
      </div>
    </div>
  );
}

export default function ModalCategorias({ token, onClose }) {
  const [categorias, setCategorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [creando,    setCreando]    = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [filtro,     setFiltro]     = useState("todos");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await authFetch("/billetera/categorias", token);
      if (r.ok) { const d = await r.json(); setCategorias(d.categorias ?? []); }
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const handleCrear = async (data) => {
    setSaving(true);
    try {
      const r = await authFetch("/billetera/categorias", token, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (r.ok) { setCreando(false); await cargar(); }
    } catch {}
    finally { setSaving(false); }
  };

  const handleEditar = async (id, data) => {
    setSaving(true);
    try {
      const r = await authFetch(`/billetera/categorias/${id}`, token, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (r.ok) { setEditandoId(null); await cargar(); }
    } catch {}
    finally { setSaving(false); }
  };

  const handleEliminar = async (id) => {
    setEliminando(id);
    try {
      await authFetch(`/billetera/categorias/${id}`, token, { method: "DELETE" });
      await cargar();
    } catch {}
    finally { setEliminando(null); }
  };

  const filtradas = filtro === "todos"
    ? categorias
    : categorias.filter(c => c.tipo === filtro || c.tipo === "ambos");

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Tags size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Categorías</p>
              <p className="text-xs text-white/70">{categorias.length} en total</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!creando && (
              <button
                onClick={() => { setCreando(true); setEditandoId(null); }}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition"
              >
                <Plus size={16} className="text-white" strokeWidth={2.5} />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Form nueva */}
          {creando && (
            <FormCategoria
              onSave={handleCrear}
              onCancel={() => setCreando(false)}
              loading={saving}
            />
          )}

          {/* Filtros */}
          {!loading && categorias.length > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-100 rounded-2xl p-1.5 w-fit">
              {[{ key: "todos", label: "Todas" }, ...TIPOS].map(t => (
                <button
                  key={t.key}
                  onClick={() => setFiltro(t.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
                    ${filtro === t.key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Tags size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">
                {categorias.length === 0 ? "Sin categorías aún" : "Sin resultados"}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {categorias.length === 0 ? "Crea la primera con el botón +" : "Prueba con otro filtro"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtradas.map(cat => (
                <div key={cat.id}>
                  {editandoId === cat.id ? (
                    <FormCategoria
                      initial={cat}
                      onSave={(data) => handleEditar(cat.id, data)}
                      onCancel={() => setEditandoId(null)}
                      loading={saving}
                    />
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 transition group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color ?? "#6366f1" }} />
                        <p className="text-sm font-semibold text-gray-700 truncate">{cat.nombre}</p>
                        {badgeTipo(cat.tipo)}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditandoId(cat.id); setCreando(false); }}
                          className="w-7 h-7 rounded-xl bg-purple-100 hover:bg-purple-200 flex items-center justify-center transition"
                        >
                          <Pencil size={12} className="text-purple-600" />
                        </button>
                        <button
                          onClick={() => handleEliminar(cat.id)}
                          disabled={eliminando === cat.id}
                          className="w-7 h-7 rounded-xl bg-red-100 hover:bg-red-200 flex items-center justify-center transition disabled:opacity-50"
                        >
                          {eliminando === cat.id
                            ? <Loader2 size={12} className="text-red-500 animate-spin" />
                            : <Trash2  size={12} className="text-red-500" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}