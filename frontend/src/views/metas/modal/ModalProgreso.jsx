// views/metas/modal/ModalProgreso.jsx
import { useState } from "react";
import { authFetch } from "../../../router/authFetch";
import { X, Loader2 } from "lucide-react";

export default function ModalProgreso({ meta, token, onClose, onExito }) {
  const [valor,  setValor]  = useState(meta.porcentaje_actual ?? 0);
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    setSaving(true);
    const r = await authFetch(`/metas/${meta.id}/progreso`, token, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ porcentaje_actual: parseInt(valor) }),
    });
    if (r.ok) { const d = await r.json(); onExito(d.meta); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Actualizar progreso</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color ?? "#9333ea" }} />
          <span className="text-xs font-semibold text-gray-700">{meta.nombre}</span>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-2">
            Porcentaje completado:{" "}
            <span className="text-purple-600">{valor}%</span>
          </label>
          <input type="range" min="0" max="100" value={valor}
            onChange={e => setValor(e.target.value)}
            className="w-full accent-purple-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span><span>50%</span><span>100%</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={guardar} disabled={saving}
            className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}