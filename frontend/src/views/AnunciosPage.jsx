import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import AnunciosFeed from "./AnunciosFeed";

const API = import.meta.env.VITE_API_URL;

const apiFetch = (url, token, opts = {}) =>
  fetch(`${API}${url}`, {
    ...opts,
    headers: { Accept: "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  });

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const ImageIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const DURACIONES_ANCLADO = [
  { value: "1d",      label: "1 día"    },
  { value: "1w",      label: "1 semana" },
  { value: "1m",      label: "1 mes"    },
  { value: "siempre", label: "Siempre"  },
];

// ── Modal Anuncio ─────────────────────────────────────────────────────────────
function ModalAnuncio({ editando, token, onClose, onGuardado }) {
  const [form, setForm] = useState({
    titulo:           editando?.titulo           ?? "",
    contenido:        editando?.contenido        ?? "",
    anclado:          editando?.anclado          ?? false,
    duracion_anclado: editando?.duracion_anclado ?? "siempre",
  });
  const [imagen,  setImagen]  = useState(null);
  const [preview, setPreview] = useState(editando?.imagen ?? null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError("La imagen no debe superar 4 MB."); return; }
    setImagen(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) { setError("El título es obligatorio."); return; }
    setSaving(true);
    setError(null);
    try {
      let anuncioId;

      if (editando) {
        const payload = {
          titulo:    form.titulo,
          contenido: form.contenido,
          anclado:   form.anclado,
          ...(form.anclado && { duracion_anclado: form.duracion_anclado }),
        };
        const res  = await apiFetch(`/admin/anuncios/${editando.id}`, token, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Error al guardar.");
        anuncioId = editando.id;
      } else {
        const fd = new FormData();
        fd.append("titulo",  form.titulo);
        fd.append("anclado", form.anclado ? "1" : "0");
        if (form.contenido) fd.append("contenido", form.contenido);
        if (imagen)         fd.append("imagen",    imagen);

        if (form.anclado) {
          fd.append("duracion_anclado", form.duracion_anclado);
          if (form.duracion_anclado !== "siempre") {
            fd.append("expira_en", "1m");
          }
        } else {
          fd.append("expira_en", "1m");
        }

        const res  = await fetch(`${API}/admin/anuncios`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? "Error al crear.");
        anuncioId = data.id;
      }

      if (editando && imagen) {
        const fd = new FormData();
        fd.append("imagen", imagen);
        await fetch(`${API}/admin/anuncios/${anuncioId}/imagen`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          body: fd,
        });
      }

      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      onTouchEnd={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh]">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {editando ? "Editar anuncio" : "Nuevo anuncio"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Los anuncios son visibles hasta que los elimines</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition">
            <XIcon />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Título *</label>
              <input
                type="text"
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                maxLength={255}
                placeholder="¿De qué trata el anuncio?"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Descripción <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={form.contenido}
                onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                rows={3}
                maxLength={2000}
                placeholder="Añade más detalles..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Imagen <span className="text-gray-400 font-normal">(opcional · máx 4 MB)</span>
              </label>
              {preview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={preview} alt="preview" className="w-full max-h-52 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImagen(null); setPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/50 hover:bg-red-500 text-white rounded-full transition"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl py-7 flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500 transition"
                >
                  <ImageIcon />
                  <span className="text-xs font-medium">Haz clic para subir imagen</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />
            </div>

            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  anclado: !f.anclado,
                  duracion_anclado: !f.anclado ? f.duracion_anclado : "siempre",
                }))}
                className={`w-full flex items-center justify-between px-4 py-3 transition ${
                  form.anclado ? "bg-amber-500 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{form.anclado ? "📌" : "📍"}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold leading-tight">
                      {form.anclado ? "Anclado al inicio del feed" : "Anclar anuncio"}
                    </p>
                    <p className={`text-xs leading-tight mt-0.5 ${form.anclado ? "text-amber-100" : "text-gray-400"}`}>
                      Aparece primero para todos
                    </p>
                  </div>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${form.anclado ? "bg-amber-300" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.anclado ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>

              {form.anclado && (
                <div className="px-4 py-4 bg-amber-50 border-t border-amber-100">
                  <p className="text-xs font-medium text-amber-800 mb-3">¿Cuánto tiempo estará anclado?</p>
                  <div className="grid grid-cols-4 gap-2">
                    {DURACIONES_ANCLADO.map(d => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, duracion_anclado: d.value }))}
                        className={`py-2 rounded-lg text-xs font-semibold border transition ${
                          form.duracion_anclado === d.value
                            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                            : "bg-white text-amber-700 border-amber-200 hover:border-amber-400"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando…
                  </>
                ) : editando ? "Guardar cambios" : "Publicar anuncio"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AnunciosPage({ user }) {
  const [anuncios,       setAnuncios]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modalAbierto,   setModalAbierto]   = useState(false);
  const [editando,       setEditando]       = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null);

  const isAdmin  = user.role === "admin";
  const endpoint = isAdmin ? "/admin/anuncios" : "/anuncios";

  const cargar = useCallback(() => {
    setLoading(true);
    apiFetch(endpoint, user.token)
      .then(r => r.json())
      .then(data => setAnuncios(Array.isArray(data) ? data : []))
      .catch(() => setAnuncios([]))
      .finally(() => setLoading(false));
  }, [user.token, endpoint]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleReaccion = (id, reacciones, miReaccion) =>
    setAnuncios(prev => prev.map(a => a.id === id ? { ...a, reacciones, mi_reaccion: miReaccion } : a));

  const handleDelete = (id) => setConfirmDelete(id);

  const confirmarDelete = async () => {
    await apiFetch(`/admin/anuncios/${confirmDelete}`, user.token, { method: "DELETE" });
    setAnuncios(prev => prev.filter(a => a.id !== confirmDelete));
    setConfirmDelete(null);
  };

  const handleToggleAnclar = async (id) => {
    const res  = await apiFetch(`/admin/anuncios/${id}/anclar`, user.token, { method: "PATCH" });
    const data = await res.json();
    setAnuncios(prev => prev.map(a => a.id === id ? { ...a, anclado: data.anclado } : a));
  };

  const handleEdit     = (anuncio) => { setEditando(anuncio); setModalAbierto(true); };
  const handleGuardado = () => { setModalAbierto(false); setEditando(null); cargar(); };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Anuncios</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin ? "Comunica novedades a tu equipo" : "Novedades del equipo"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditando(null); setModalAbierto(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <PlusIcon />
            Nuevo
          </button>
        )}
      </div>

      <AnunciosFeed
        anuncios={anuncios}
        token={user.token}
        isAdmin={isAdmin}
        loading={loading}
        onReaccion={handleReaccion}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleAnclar={handleToggleAnclar}
      />

      {modalAbierto && (
        <ModalAnuncio
          editando={editando}
          token={user.token}
          onClose={() => { setModalAbierto(false); setEditando(null); }}
          onGuardado={handleGuardado}
        />
      )}

      {confirmDelete && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Eliminar anuncio</h3>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer. ¿Estás seguro?</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <div className="w-px bg-gray-100" />
              <button
                onClick={confirmarDelete}
                className="flex-1 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}