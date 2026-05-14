import { useState } from "react";

const API = import.meta.env.VITE_API_URL;

const apiFetch = (url, token, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  });

const REACCIONES = [
  { tipo: "like",        emoji: "👍", label: "Me gusta"       },
  { tipo: "corazon",     emoji: "❤️", label: "Me encanta"     },
  { tipo: "risa",        emoji: "😂", label: "Me divierte"    },
  { tipo: "tristeza",    emoji: "😢", label: "Me entristece"  },
  { tipo: "asombro",     emoji: "😮", label: "Me asombra"     },
  { tipo: "celebracion", emoji: "🎉", label: "Celebro"        },
];

// ── Iconos ────────────────────────────────────────────────────────────────────
const PinIcon  = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 2v4l-2 2v4l4 2H6l4-2V8L8 6V2h8zm-4 18l-1-4h2l-1 4z"/>
  </svg>
);
const EditIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
  </svg>
);
const MegaphoneIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function tiempoAtras(iso) {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d >= 1) return `hace ${d}d`;
  if (h >= 1) return `hace ${h}h`;
  if (m >= 1) return `hace ${m}m`;
  return "ahora";
}

// DESPUÉS
function ancladoLabel(ancladoHasta) {
  if (!ancladoHasta) return "siempre";
  const diff = new Date(ancladoHasta) - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 3000) return "siempre"; // 10 años = siempre
  if (d >= 1) return `${d}d`;
  return `${h}h`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ foto, nombre }) {
  if (foto) {
    return <img src={foto} alt={nombre} className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-white" />;
  }
  const colors = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-amber-500","bg-rose-500"];
  const color  = colors[(nombre?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center shrink-0 ring-2 ring-white`}>
      <span className="text-white font-bold text-sm">{nombre?.[0]?.toUpperCase()}</span>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function AnuncioCard({ anuncio, token, isAdmin, onReaccion, onEdit, onDelete, onToggleAnclar }) {
  const [showPicker, setShowPicker] = useState(false);
  const [cargando,   setCargando]   = useState(false);

  const pinLabel = anuncio.anclado ? ancladoLabel(anuncio.anclado_hasta) : null;

  const handleReaccion = async (tipo) => {
    if (cargando) return;
    setCargando(true);
    try {
      const res  = await apiFetch(`/anuncios/${anuncio.id}/reaccionar`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      const data = await res.json();
      onReaccion(anuncio.id, data.reacciones, data.mi_reaccion);
    } finally {
      setCargando(false);
      setShowPicker(false);
    }
  };

  const total = Object.values(anuncio.reacciones ?? {}).reduce((s, c) => s + c, 0);

  return (
    <article className={`bg-white rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
      anuncio.anclado ? "border-amber-200 shadow-amber-50 shadow-sm" : "border-gray-200"
    }`}>

      {/* Pin banner */}
      {anuncio.anclado && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-1.5 flex items-center gap-1.5">
          <PinIcon />
         <span className="text-xs font-semibold text-amber-700">
  {pinLabel === "siempre" ? "Siempre visible" : `Anclado · ${pinLabel} restante`}
</span>
        </div>
      )}

      {/* Cabecera */}
      <div className="px-4 pt-4 pb-3 flex items-start gap-3">
        <Avatar foto={anuncio.autor_foto} nombre={anuncio.autor} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 text-sm truncate">{anuncio.autor}</p>
            <span className="text-xs text-gray-400 shrink-0">{tiempoAtras(anuncio.created_at)}</span>
          </div>
          {anuncio.autor_cargo && (
            <p className="text-xs text-gray-400 truncate">{anuncio.autor_cargo}</p>
          )}
        </div>

        {/* Acciones admin */}
        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleAnclar(anuncio.id)}
              title={anuncio.anclado ? "Desanclar" : "Anclar"}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${
                anuncio.anclado
                  ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              <PinIcon />
            </button>
            <button
              onClick={() => onEdit(anuncio)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <EditIcon />
            </button>
            <button
              onClick={() => onDelete(anuncio.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="px-4 pb-3">
        <p className="font-semibold text-gray-900">{anuncio.titulo}</p>
        {anuncio.contenido && (
<p className="text-sm text-gray-600 leading-relaxed mt-1 whitespace-pre-wrap">{anuncio.contenido}</p>
        )}
      </div>

      {/* Imagen */}
      {anuncio.imagen && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden bg-gray-100">
          <img src={anuncio.imagen} alt={anuncio.titulo} className="w-full max-h-80 object-cover" />
        </div>
      )}

      {/* Reacciones existentes */}
      {total > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {REACCIONES.filter(r => (anuncio.reacciones?.[r.tipo] ?? 0) > 0).map(r => (
            <button
              key={r.tipo}
              onClick={() => handleReaccion(r.tipo)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition ${
                anuncio.mi_reaccion === r.tipo
                  ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              <span>{r.emoji}</span>
              <span>{anuncio.reacciones[r.tipo]}</span>
            </button>
          ))}
        </div>
      )}

      {/* Barra inferior */}
      <div className="px-4 py-2.5 border-t border-gray-50 flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowPicker(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              anuncio.mi_reaccion
                ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-500"
            }`}
          >
            <span className="text-base leading-none">
              {anuncio.mi_reaccion
                ? REACCIONES.find(r => r.tipo === anuncio.mi_reaccion)?.emoji
                : "🙂"}
            </span>
            <span>
              {anuncio.mi_reaccion
                ? REACCIONES.find(r => r.tipo === anuncio.mi_reaccion)?.label
                : "Reaccionar"}
            </span>
          </button>

          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl px-2 py-1.5 flex items-center gap-0.5 z-20">
              {REACCIONES.map(r => (
                <button
                  key={r.tipo}
                  onClick={() => handleReaccion(r.tipo)}
                  title={r.label}
                  className={`text-2xl p-1.5 rounded-xl hover:scale-125 transition-transform ${
                    anuncio.mi_reaccion === r.tipo ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {total > 0 && (
          <span className="text-xs text-gray-400">
            {total} reacción{total !== 1 ? "es" : ""}
          </span>
        )}
      </div>
    </article>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AnunciosFeed({ anuncios, token, isAdmin, onReaccion, onEdit, onDelete, onToggleAnclar, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (anuncios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
          <MegaphoneIcon />
        </div>
        <p className="font-medium text-gray-500 text-sm">No hay anuncios aún</p>
        <p className="text-xs mt-1">Los nuevos anuncios aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {anuncios.map(a => (
        <AnuncioCard
          key={a.id}
          anuncio={a}
          token={token}
          isAdmin={isAdmin}
          onReaccion={onReaccion}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleAnclar={onToggleAnclar}
        />
      ))}
    </div>
  );
}