import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, AlertCircle } from "lucide-react";
import { authFetch } from "../../router/authFetch";

export default function ModalConfig({ user, config, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

useEffect(() => {
  document.body.style.overflow = "hidden";
  // config siempre llega precargado desde onboarding
  setForm({
tipo:        config.tipo,
monto_base:  config.monto_base  ?? "",
dia_pago: config.dia_pago > 0 ? config.dia_pago : "",
descripcion: config.descripcion ?? "",
    moneda:      user.currency,
  });
  return () => { document.body.style.overflow = ""; };
}, []);

const handleSave = async () => {
    const d = parseInt(form.dia_pago);
    if ((form.tipo === "fijo" || form.tipo === "mixto") && (!d || d < 1 || d > 31)) {
        setError("El día de pago debe ser entre 1 y 31.");
        return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/ingresos/config", user.token, {
        method: "POST",
       body: JSON.stringify({
    ...form,
    dia_pago: parseInt(form.dia_pago) || 0,
}),
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
          <h3 className="font-bold text-gray-800">Configurar ingresos</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        {!form ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Cargando configuración…
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Tipo de ingreso</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "fijo",     label: "Fijo"     },
                    { value: "variable", label: "Variable" },
                    { value: "mixto",    label: "Mixto"    },
                  ].map(op => (
                    <button key={op.value} type="button" onClick={() => setForm(f => ({ ...f, tipo: op.value }))}
                      className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        form.tipo === op.value ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-100 bg-gray-50 text-gray-500"
                      }`}>
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>

              {(form.tipo === "fijo" || form.tipo === "mixto") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                    {form.tipo === "mixto" ? "Monto base fijo" : "Monto mensual"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">{form.moneda}</span>
                    <input type="number" min="0" placeholder="0.00"
                      value={form.monto_base} onChange={e => setForm(f => ({ ...f, monto_base: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl pl-14 pr-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>
              )}

              {(form.tipo === "fijo" || form.tipo === "mixto") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Día de pago (1-31)</label>
                  <input type="number" min="1" max="31"
                    value={form.dia_pago} onChange={e => setForm(f => ({ ...f, dia_pago: e.target.value === "" ? "" : parseInt(e.target.value) }))}

                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">El sistema proyectará tu ingreso en esa fecha cada mes.</p>
                </div>
              )}

              {form.tipo === "variable" && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-3">
                  <AlertCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-600">Cada mes te pediremos que ingreses cuánto ganaste. No se proyecta automáticamente.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Descripción (opcional)</label>
                <input type="text" placeholder='Ej: "Sueldo empresa X"'
                  value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {error && <p className="text-red-500 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</p>}

              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-3">
                <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-600">Cambiar la configuración no afecta meses anteriores.</p>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all">
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}