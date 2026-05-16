import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import { authFetch } from "../../router/authFetch";

export default function ModalIngreso({ user, onClose, onSaved, config }) {
  const [form, setForm] = useState({
    monto: "", fecha: new Date().toISOString().split("T")[0],
    descripcion: "", tipo: config?.tipo === "mixto" ? "extra" : "variable",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleSave = async () => {
    if (!form.monto || !form.fecha) { setError("Completa monto y fecha."); return; }
    setSaving(true);
    try {
      const res = await authFetch("/ingresos", user.token, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.message || "Error."); return; }
      onSaved();
      onClose();
    } catch { setError("No se pudo conectar."); }
    finally { setSaving(false); }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Registrar ingreso</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">{user.currency}</span>
              <input type="number" min="0" placeholder="0.00"
                value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl pl-14 pr-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Fecha</label>
            <input type="date" value={form.fecha}
              onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
          </div>
          {config?.tipo === "mixto" && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: "variable", label: "Ingreso mensual" }, { value: "extra", label: "Ingreso extra" }].map(op => (
                  <button key={op.value} type="button" onClick={() => setForm(f => ({ ...f, tipo: op.value }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      form.tipo === op.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-100 bg-gray-50 text-gray-500"
                    }`}>
                    {op.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Descripción (opcional)</label>
            <input type="text" placeholder="Ej: Sueldo quincenal"
              value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
            />
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