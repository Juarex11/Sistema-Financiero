// views/metas/modal/ModalHistorialAportes.jsx
import { useState, useEffect } from "react";
import { authFetch } from "../../../router/authFetch";
import { X, Loader2 } from "lucide-react";

function fmt(n, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(n ?? 0);
}
function fmtFecha(str) {
  if (!str) return "—";
  const [y, m, d] = str.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ModalHistorialAportes({ meta, token, onClose }) {
  const [aportes, setAportes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`/metas/${meta.id}/aportes`, token)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setAportes(d); setLoading(false); });
  }, []);

  const totalAportado = aportes.filter(a => a.monto > 0).reduce((s, a) => s + a.monto, 0);
  const totalRetirado = aportes.filter(a => a.monto < 0).reduce((s, a) => s + Math.abs(a.monto), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-800">Historial de aportes</h3>
            <p className="text-xs text-gray-400 mt-0.5">{meta.nombre}</p>
          </div>
          <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
        </div>

        {/* Resumen rápido */}
        {!loading && aportes.length > 0 && (
          <div className="grid grid-cols-2 gap-3 px-5 pt-4">
            <div className="bg-purple-50 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Total aportado</p>
              <p className="text-sm font-bold text-purple-700">{fmt(totalAportado, meta.moneda)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl px-3 py-2">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Total retirado</p>
              <p className="text-sm font-bold text-amber-700">{fmt(totalRetirado, meta.moneda)}</p>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="p-5 space-y-2 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={18} className="animate-spin text-gray-400" />
            </div>
          ) : aportes.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Sin aportes registrados aún.</p>
          ) : aportes.map(a => (
            <div key={a.id}
              className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div>
                <p className={`text-sm font-bold ${a.monto >= 0 ? "text-purple-700" : "text-amber-600"}`}>
                  {a.monto >= 0 ? "+" : ""}{fmt(a.monto, a.moneda)}
                </p>
                {a.nota && <p className="text-xs text-gray-400 mt-0.5">{a.nota}</p>}
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-3">{fmtFecha(a.fecha)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}