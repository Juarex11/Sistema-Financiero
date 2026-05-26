// views/metas/modal/ModalMetaForm.jsx
import { useState } from "react";
import { authFetch } from "../../../router/authFetch";
import { X, Loader2, AlertTriangle, Calendar, Bell, Image as ImageIcon } from "lucide-react";

export default function ModalMetaForm({ meta, token, monedaUser, onClose, onExito }) {
  const esEdicion = !!meta;
  const [form, setForm] = useState({
    nombre:             meta?.nombre            ?? "",
    descripcion:        meta?.descripcion       ?? "",
    color:              meta?.color             ?? "#9333ea",
    tipo_medicion:      meta?.tipo_medicion     ?? "monto",
    monto_objetivo:     meta?.monto_objetivo    ?? "",
    moneda:             meta?.moneda            ?? monedaUser ?? "PEN",
    fecha_limite:       meta?.fecha_limite       ? meta.fecha_limite.split("T")[0] : "",
    tipo_recordatorio:  meta?.tipo_recordatorio ?? "",
    recordatorio_fecha: meta?.recordatorio_fecha ? meta.recordatorio_fecha.split("T")[0] : "",
    recordatorio_dia:   meta?.recordatorio_dia  ?? "",
  });
  const [imagen,  setImagen]  = useState(null);
  const [preview, setPreview] = useState(meta?.imagen_url ?? null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (form.tipo_medicion === "monto" && !form.monto_objetivo) { setError("Ingresa el monto objetivo."); return; }
    setSaving(true); setError(null);

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
    });
    if (imagen) fd.append("imagen", imagen);

    const url = esEdicion ? `/metas/${meta.id}` : "/metas";
    const r   = await authFetch(url, token, { method: "POST", body: fd });
    const d   = await r.json();
    if (!r.ok) { setError(d.message ?? "Error al guardar."); setSaving(false); return; }
    onExito(d.meta);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header fijo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-sm font-bold text-gray-800">
            {esEdicion ? "Editar meta" : "Nueva meta"}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Cuerpo con scroll — dos columnas */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4">
              <AlertTriangle size={13} className="text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-5 gap-y-4">

            {/* COL IZQUIERDA */}
            <div className="space-y-4">

              {/* Imagen */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">Imagen (opcional)</label>
                <label className="cursor-pointer block">
                  {preview
                    ? <img src={preview} alt=""
                        className="w-full h-36 object-cover rounded-xl border border-gray-200" />
                    : <div className="w-full h-36 rounded-xl border-2 border-dashed border-gray-200
                          flex flex-col items-center justify-center gap-2 hover:border-purple-300 transition">
                        <ImageIcon size={20} className="text-gray-300" />
                        <span className="text-xs text-gray-400">Subir imagen</span>
                      </div>}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => {
                      const f = e.target.files[0];
                      if (f) { setImagen(f); setPreview(URL.createObjectURL(f)); }
                    }} />
                </label>
              </div>

              {/* Nombre + color en misma fila */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nombre *</label>
                <div className="flex gap-2">
                  <input value={form.nombre} onChange={e => set("nombre", e.target.value)}
                    placeholder="Ej: Carro, Viaje…"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400" />
                  <input type="color" value={form.color} onChange={e => set("color", e.target.value)}
                    title="Color"
                    className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5 shrink-0" />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => set("descripcion", e.target.value)}
                  rows={3} placeholder="¿Para qué es esta meta?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400 resize-none" />
              </div>

            </div>

            {/* COL DERECHA */}
            <div className="space-y-4">

              {/* Tipo medición — solo al crear */}
              {!esEdicion && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Tipo de seguimiento</label>
                  <div className="flex gap-2">
                    {[
                      { key: "monto",      label: "Por monto"      },
                      { key: "porcentaje", label: "Por porcentaje" },
                    ].map(({ key, label }) => (
                      <button key={key} onClick={() => set("tipo_medicion", key)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition
                          ${form.tipo_medicion === key
                            ? "bg-purple-600 text-white border-purple-600"
                            : "bg-white text-gray-500 border-gray-200 hover:border-purple-300"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monto objetivo */}
              {form.tipo_medicion === "monto" && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                    Monto objetivo *{" "}
                    <span className="text-gray-400 font-normal">({monedaUser ?? "PEN"})</span>
                  </label>
                  <input type="number" min="0.01" step="0.01" value={form.monto_objetivo}
                    onChange={e => set("monto_objetivo", e.target.value)} placeholder="10000.00"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400" />
                </div>
              )}

              {/* Fecha límite */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  <Calendar size={11} className="inline mr-1" />Fecha límite
                </label>
                <input type="date" value={form.fecha_limite}
                  onChange={e => set("fecha_limite", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400" />
              </div>

              {/* Recordatorio */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1.5">
                  <Bell size={11} className="inline mr-1" />Recordatorio
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { key: "",          label: "Ninguno"    },
                    { key: "fecha",     label: "Por fecha"  },
                    { key: "periodico", label: "Periódico"  },
                    { key: "ambos",     label: "Ambos"      },
                  ].map(({ key, label }) => (
                    <button key={key} onClick={() => set("tipo_recordatorio", key)}
                      className={`py-1.5 rounded-xl text-xs font-semibold border transition
                        ${form.tipo_recordatorio === key
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-500 border-gray-200 hover:border-purple-300"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha recordatorio */}
              {(form.tipo_recordatorio === "fecha" || form.tipo_recordatorio === "ambos") && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Fecha de recordatorio</label>
                  <input type="date" value={form.recordatorio_fecha}
                    onChange={e => set("recordatorio_fecha", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400" />
                </div>
              )}

              {/* Día periódico */}
              {(form.tipo_recordatorio === "periodico" || form.tipo_recordatorio === "ambos") && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Día del mes (1-31)</label>
                  <input type="number" min="1" max="31" value={form.recordatorio_dia}
                    onChange={e => set("recordatorio_dia", e.target.value)} placeholder="Ej: 1"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400" />
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={guardar} disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {esEdicion ? "Guardar cambios" : "Crear meta"}
          </button>
        </div>
      </div>
    </div>
  );
}