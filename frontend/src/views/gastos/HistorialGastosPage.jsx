import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../router/authFetch";
import { ArrowLeft, Receipt, RefreshCw, Calendar } from "lucide-react";

const MESES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmt(monto, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(monto);
}

export default function HistorialGastosPage({ user }) {
  const navigate   = useNavigate();
  const hoy        = new Date();
  const anioActual = hoy.getFullYear();

  const [anio,      setAnio]      = useState(anioActual);
  const [historial, setHistorial] = useState({});
  const [loading,   setLoading]   = useState(true);

  const cargar = async () => {
    setLoading(true);
    try {
      const res  = await authFetch(`/gastos/movimientos?anio=${anio}`, user.token);
      const data = res.ok ? await res.json() : {};
      setHistorial(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [anio]);

  const totalAnio = Object.values(historial).flat().reduce((acc, m) => acc + parseFloat(m.monto), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/gastos")}
          className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial de gastos</h1>
          <p className="text-sm text-gray-400">Pagos registrados por año</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setAnio(a => a - 1)}
          className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all text-xl">
          ‹
        </button>
        <span className="text-lg font-bold text-gray-800 min-w-[70px] text-center">{anio}</span>
        <button onClick={() => setAnio(a => a + 1)} disabled={anio >= anioActual}
          className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-30 text-xl">
          ›
        </button>
        <button onClick={cargar}
          className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
        {!loading && Object.keys(historial).length > 0 && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Total gastado {anio}</p>
            <p className="text-2xl font-bold text-red-500">-{fmt(totalAnio, user.currency)}</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : Object.keys(historial).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <Calendar size={40} strokeWidth={1} className="mb-3" />
          <p className="text-sm font-medium text-gray-400">Sin gastos registrados en {anio}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mes</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gasto</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Categoría</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Monto</p>
          </div>

          {Object.entries(historial).map(([mes, movs]) => {
            const totalMes = movs.reduce((acc, m) => acc + parseFloat(m.monto), 0);
            return (
              <div key={mes}>
                {movs.map((mov, idx) => {
                  const partes = (mov.fecha ?? "").split("T")[0].split("-");
                  const fechaLabel = partes.length === 3
                    ? new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
                        .toLocaleDateString("es-PE", { day: "numeric", month: "short" })
                    : "—";
                  const cat = mov.gasto?.categoria;

                  return (
                    <div key={mov.id}
                      className="grid grid-cols-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-all items-center">
                      <div>
                        {idx === 0 ? (
                          <div>
                            <p className="text-sm font-bold text-gray-800">{MESES[parseInt(mes)]}</p>
                            <p className="text-xs text-gray-400">{fechaLabel}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">{fechaLabel}</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 truncate pr-4">
                        {mov.gasto?.nombre ?? mov.descripcion ?? "—"}
                      </p>
                      <div>
                        {cat ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: cat.color }}>
                            {cat.nombre}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-red-500 text-right">
                        -{fmt(mov.monto, mov.moneda)}
                      </p>
                    </div>
                  );
                })}
                <div className="grid grid-cols-4 px-6 py-2 bg-red-50 border-b border-red-100">
                  <p className="text-xs font-bold text-red-400 col-span-3">Subtotal {MESES[parseInt(mes)]}</p>
                  <p className="text-xs font-bold text-red-600 text-right">-{fmt(totalMes, user.currency)}</p>
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-4 px-6 py-4 bg-gray-900">
            <p className="text-sm font-bold text-gray-300 col-span-3 flex items-center gap-2">
              <Receipt size={14} /> Total gastado {anio}
            </p>
            <p className="text-base font-bold text-red-400 text-right">-{fmt(totalAnio, user.currency)}</p>
          </div>
        </div>
      )}
    </div>
  );
}