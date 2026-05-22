import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../../router/authFetch";
import { ArrowLeft, TrendingUp, RefreshCw, DollarSign } from "lucide-react";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmt(monto, moneda = "PEN") {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(monto);
}

function TipoBadge({ tipo }) {
  const map = {
    fijo:     { label: "Fijo",     cls: "bg-purple-100 text-purple-700" },
    variable: { label: "Variable", cls: "bg-blue-100 text-blue-700"     },
  };
  const { label, cls } = map[tipo] ?? { label: tipo, cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function HistorialSalarialPage({ user }) {
  const navigate   = useNavigate();
  const hoy        = new Date();
  const anioActual = hoy.getFullYear();

  const [anio,      setAnio]      = useState(anioActual);
  const [loading,   setLoading]   = useState(true);
  const [historial, setHistorial] = useState([]);
  const [totalAnio, setTotalAnio] = useState(0);

  const cargar = async () => {
    setLoading(true);
    try {
      // Solo cargar meses hasta el mes actual si es el año actual
      const limiteMes = anio === anioActual ? hoy.getMonth() + 1 : 12;

      const promesas = Array.from({ length: limiteMes }, (_, i) =>
        authFetch(`/ingresos?mes=${i + 1}&anio=${anio}`, user.token)
          .then(r => r.ok ? r.json() : { ingresos: [] })
          .then(data => {
            const filtrados = (data.ingresos ?? []).filter(ing =>
              ing.tipo === "fijo" || ing.tipo === "variable"
            );
            return {
              mes:      i + 1,
              nombre:   MESES[i],
              ingresos: filtrados,
              total:    filtrados.reduce((acc, ing) => acc + parseFloat(ing.monto), 0),
            };
          })
          .catch(() => ({ mes: i + 1, nombre: MESES[i], ingresos: [], total: 0 }))
      );

      const resultados = await Promise.all(promesas);
      const conDatos   = resultados.filter(r => r.ingresos.length > 0);
      setHistorial(conDatos);
      setTotalAnio(conDatos.reduce((acc, r) => acc + r.total, 0));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, [anio]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/ingresos")}
          className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historial salarial</h1>
          <p className="text-sm text-gray-400">Ingresos fijos y variables por año</p>
        </div>
      </div>

      {/* Selector año + total */}
      <div className="flex items-center gap-3">
        <button onClick={() => setAnio(a => a - 1)}
          className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all text-xl font-light">
          ‹
        </button>
        <span className="text-lg font-bold text-gray-800 min-w-[70px] text-center">{anio}</span>
        <button onClick={() => setAnio(a => a + 1)} disabled={anio >= anioActual}
          className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-30 text-xl font-light">
          ›
        </button>
        <button onClick={cargar}
          className="w-9 h-9 border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>

        {!loading && historial.length > 0 && (
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Total {anio}</p>
            <p className="text-2xl font-bold text-purple-700">{fmt(totalAnio, user.currency)}</p>
          </div>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : historial.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <DollarSign size={40} strokeWidth={1} className="mb-3" />
          <p className="text-sm font-medium text-gray-400">Sin ingresos salariales en {anio}</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">

          {/* Cabecera tabla */}
          <div className="grid grid-cols-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mes</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Descripción</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Monto</p>
          </div>

          {/* Filas */}
          {historial.map(({ mes, nombre, ingresos, total }) => (
            <div key={mes}>
              {ingresos.map((ing, idx) => {
                const partes = (ing.fecha ?? "").split("T")[0].split("-");
                const fechaLabel = partes.length === 3
                  ? new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]))
                      .toLocaleDateString("es-PE", { day: "numeric", month: "short" })
                  : "—";

                return (
                  <div key={ing.id}
                    className={`grid grid-cols-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-all items-center ${
                      idx === 0 ? "border-t border-gray-100" : ""
                    }`}>

                    {/* Mes — solo en primera fila del grupo */}
                    <div>
                      {idx === 0 ? (
                        <div>
                          <p className="text-sm font-bold text-gray-800">{nombre}</p>
                          <p className="text-xs text-gray-400">{fechaLabel}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300">{fechaLabel}</p>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 truncate pr-4">
                      {ing.descripcion || "Ingreso mensual"}
                    </p>

                    <TipoBadge tipo={ing.tipo} />

                    <p className="text-sm font-bold text-gray-900 text-right">
                      {fmt(ing.monto, ing.moneda)}
                    </p>
                  </div>
                );
              })}

              {/* Subtotal del mes */}
              <div className="grid grid-cols-4 px-6 py-2 bg-purple-50 border-b border-purple-100">
                <p className="text-xs font-bold text-purple-500 col-span-3">Subtotal {nombre}</p>
                <p className="text-xs font-bold text-purple-700 text-right">{fmt(total, user.currency)}</p>
              </div>
            </div>
          ))}

          {/* Total general */}
          <div className="grid grid-cols-4 px-6 py-4 bg-purple-600">
            <p className="text-sm font-bold text-purple-200 col-span-3 flex items-center gap-2">
              <TrendingUp size={14} /> Total {anio}
            </p>
            <p className="text-base font-bold text-white text-right">{fmt(totalAnio, user.currency)}</p>
          </div>

        </div>
      )}
    </div>
  );
}