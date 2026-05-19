import { useState } from "react";
import { createPortal } from "react-dom";
import { authFetch } from "../../router/authFetch";
import { Calendar } from "lucide-react";

export default function ModalDiaPago({ user, config, onSaved }) {
    const [dia, setDia]       = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState("");

    const handleSave = async () => {
        const d = parseInt(dia);
        if (!d || d < 1 || d > 31) {
            setError("Ingresa un día válido entre 1 y 31.");
            return;
        }
        setSaving(true);
        try {
            const res = await authFetch("/ingresos/config", user.token, {
                method: "POST",
                body: JSON.stringify({
                    ...config,
                    dia_pago: d,
                }),
            });
            if (!res.ok) { setError("No se pudo guardar."); return; }
            onSaved();
        } catch {
            setError("No se pudo conectar.");
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

                <div className="px-6 pt-6 pb-4 text-center">
                    <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Calendar size={26} className="text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">¿Qué día recibes tu pago?</h3>
                    <p className="text-sm text-gray-400 mt-1">
                        El sistema usará este día para registrar tu ingreso automáticamente cada mes.
                    </p>
                </div>

                <div className="px-6 pb-2">
                    <input
                        type="number" min="1" max="31"
                        placeholder="Ej: 15"
                        value={dia}
                        onChange={e => { setDia(e.target.value); setError(""); }}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                    />
                    {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
                    <p className="text-xs text-gray-400 text-center mt-2">Entre 1 y 31</p>
                </div>

                <div className="px-6 pb-6 mt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving || !dia}
                        className="w-full py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 transition-all">
                        {saving ? "Guardando…" : "Confirmar día de pago"}
                    </button>
                </div>

            </div>
        </div>,
        document.body
    );
}