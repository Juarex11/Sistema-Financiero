// views/metas/modal/ModalAporte.jsx
import { useState } from "react";
import { authFetch } from "../../../router/authFetch";
import { X, Loader2, AlertTriangle } from "lucide-react";

function fmt(n, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(n ?? 0);
}

export default function ModalAporte({ meta, tipo, token, onClose, onExito }) {
  const esAporte = tipo === "aportar";
  const [monto,  setMonto]  = useState("");
  const [nota,   setNota]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);

  const maxRetiro = meta.monto_aportado ?? 0;

  const guardar = async () => {
    const val = parseFloat(monto);
    if (!val || val <= 0) { setError("Ingresa un monto válido."); return; }
    if (!esAporte && val > maxRetiro) {
      setError(`No puedes retirar más de ${fmt(maxRetiro, meta.moneda)}.`); return;
    }
    setSaving(true); setError(null);

    const r = await authFetch(`/metas/${meta.id}/${tipo}`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto: val, nota }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.message ?? "Error."); setSaving(false); return; }
    onExito(d.meta, d.saldo);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">
            {esAporte ? "Aportar a meta" : "Retirar de meta"}
          </h3>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Nombre meta */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color ?? "#9333ea" }} />
          <span className="text-xs font-semibold text-gray-700">{meta.nombre}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertTriangle size={13} className="text-red-500" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Monto */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            Monto ({meta.moneda})
            {!esAporte && (
              <span className="text-gray-400 font-normal ml-1">
                — máx. {fmt(maxRetiro, meta.moneda)}
              </span>
            )}
          </label>
          <input type="number" min="0.01" step="0.01" value={monto}
            onChange={e => setMonto(e.target.value)} placeholder="0.00"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400" />
        </div>

        {/* Nota */}
        <div>
          <label className="text-xs font-semibold text-gray-600 block mb-1">Nota (opcional)</label>
          <input value={nota} onChange={e => setNota(e.target.value)}
            placeholder={esAporte ? "Ej: Guardado del mes de mayo" : "Motivo del retiro"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-purple-400" />
        </div>

        {esAporte && (
          <p className="text-[11px] text-gray-400 bg-amber-50 rounded-lg px-3 py-2">
            ⚠ Este monto se descontará de tu billetera y quedará reservado para esta meta.
          </p>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={guardar} disabled={saving}
            className={`flex-1 py-2 rounded-xl text-white text-sm font-semibold transition flex items-center justify-center gap-2
              ${esAporte ? "bg-purple-600 hover:bg-purple-700" : "bg-amber-500 hover:bg-amber-600"}`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {esAporte ? "Aportar" : "Retirar"}
          </button>
        </div>
      </div>
    </div>
  );
}