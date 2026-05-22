import { useState, useEffect, useRef } from "react";
import { authFetch } from "../../router/authFetch";
import {
  Plus, Send, ArrowLeft, RefreshCw,
  MessageCircle, Image, X, Clock, CheckCircle, AlertCircle
} from "lucide-react";

const ESTADOS = {
  pendiente:   { label: "Pendiente",   cls: "bg-amber-100 text-amber-700"  },
  en_revision: { label: "En revisión", cls: "bg-blue-100 text-blue-700"    },
  resuelto:    { label: "Resuelto",    cls: "bg-green-100 text-green-700"  },
};

function EstadoBadge({ estado }) {
  const { label, cls } = ESTADOS[estado] ?? { label: estado, cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function SoportePage({ user }) {
  const [vista,        setVista]        = useState("lista"); // lista | nuevo | ticket
  const [tickets,      setTickets]      = useState([]);
  const [ticketActual, setTicketActual] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [error,        setError]        = useState("");
  const bottomRef = useRef(null);

  // Form nuevo ticket
  const [nuevoAsunto,  setNuevoAsunto]  = useState("");
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [nuevoFoto,    setNuevoFoto]    = useState(null);

  // Form respuesta
  const [respuesta,     setRespuesta]     = useState("");
  const [respuestaFoto, setRespuestaFoto] = useState(null);

  const cargarTickets = async () => {
    setLoading(true);
    try {
      const res  = await authFetch("/tickets", user.token);
      const data = res.ok ? await res.json() : [];
      setTickets(data);
    } catch {}
    finally { setLoading(false); }
  };

  const cargarTicket = async (id) => {
    setLoading(true);
    try {
      const res  = await authFetch(`/tickets/${id}`, user.token);
      const data = res.ok ? await res.json() : null;
      setTicketActual(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { cargarTickets(); }, []);

  useEffect(() => {
    if (vista === "ticket" && ticketActual) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [ticketActual, vista]);

  const crearTicket = async () => {
    if (!nuevoAsunto.trim() || !nuevoMensaje.trim()) {
      setError("Completa el asunto y el mensaje.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const form = new FormData();
      form.append("asunto",  nuevoAsunto);
      form.append("mensaje", nuevoMensaje);
      if (nuevoFoto) form.append("foto", nuevoFoto);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/tickets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, Accept: "application/json" },
        body: form,
      });

      if (!res.ok) { setError("Error al crear el ticket."); return; }
      const data = await res.json();
      setNuevoAsunto(""); setNuevoMensaje(""); setNuevoFoto(null);
      setTicketActual(data.ticket);
      setVista("ticket");
      cargarTickets();
    } catch { setError("No se pudo conectar."); }
    finally { setSending(false); }
  };

  const enviarRespuesta = async () => {
    if (!respuesta.trim()) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("mensaje", respuesta);
      if (respuestaFoto) form.append("foto", respuestaFoto);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/tickets/${ticketActual.id}/responder`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, Accept: "application/json" },
        body: form,
      });

      if (res.ok) {
        setRespuesta(""); setRespuestaFoto(null);
        await cargarTicket(ticketActual.id);
      }
    } catch {}
    finally { setSending(false); }
  };

  const abrirTicket = async (ticket) => {
    setVista("ticket");
    await cargarTicket(ticket.id);
  };

  // ── Vista: lista ────────────────────────────────────────────────────────────
  if (vista === "lista") return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soporte</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona tus tickets de ayuda</p>
        </div>
        <button onClick={() => { setVista("nuevo"); setError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all">
          <Plus size={16} /> Nuevo ticket
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <MessageCircle size={40} strokeWidth={1} className="mb-3" />
          <p className="text-sm font-medium text-gray-400">No tienes tickets aún</p>
          <button onClick={() => setVista("nuevo")}
            className="mt-4 text-sm text-purple-600 font-semibold hover:underline">
            + Crear primer ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <button key={ticket.id} onClick={() => abrirTicket(ticket)}
              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md hover:border-purple-200 transition-all text-left flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                <MessageCircle size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold text-gray-800 truncate">{ticket.asunto}</p>
                  <EstadoBadge estado={ticket.estado} />
                </div>
                <p className="text-xs text-gray-400">
                  {ticket.mensajes_count} mensaje{ticket.mensajes_count !== 1 ? "s" : ""} · {new Date(ticket.created_at).toLocaleDateString("es-PE")}
                </p>
              </div>
              <span className="text-gray-300 text-lg">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Vista: nuevo ticket ─────────────────────────────────────────────────────
  if (vista === "nuevo") return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => setVista("lista")}
          className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo ticket</h1>
          <p className="text-sm text-gray-400">Describe tu problema y te ayudamos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Asunto</label>
          <input type="text" placeholder="Ej: No puedo registrar mi ingreso"
            value={nuevoAsunto} onChange={e => setNuevoAsunto(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Mensaje</label>
          <textarea rows={5} placeholder="Describe detalladamente tu problema…"
            value={nuevoMensaje} onChange={e => setNuevoMensaje(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Adjuntar imagen (opcional)</label>
          {nuevoFoto ? (
            <div className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
              <Image size={16} className="text-purple-500" />
              <span className="text-sm text-purple-700 flex-1 truncate">{nuevoFoto.name}</span>
              <button onClick={() => setNuevoFoto(null)} className="text-gray-400 hover:text-red-500 transition-all">
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex items-center gap-3 border border-dashed border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all">
              <Image size={16} className="text-gray-400" />
              <span className="text-sm text-gray-400">Seleccionar imagen</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => setNuevoFoto(e.target.files[0] ?? null)} />
            </label>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={16} />{error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => setVista("lista")}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={crearTicket} disabled={sending}
            className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all">
            {sending ? "Enviando…" : "Enviar ticket"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Vista: ticket (chat) ────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={() => { setVista("lista"); cargarTickets(); }}
          className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-gray-900">{ticketActual?.asunto}</h1>
            {ticketActual && <EstadoBadge estado={ticketActual.estado} />}
          </div>
          <p className="text-xs text-gray-400">Ticket #{ticketActual?.id}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : (
        <>
          {/* Mensajes */}
          <div className="space-y-4">
            {ticketActual?.mensajes?.map(msg => {
              const esMio = msg.user_id === user.id;
              return (
                <div key={msg.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    esMio ? "bg-purple-600 text-white" : "bg-white border border-gray-100 text-gray-800"
                  }`}>
                    <p className={`text-xs font-bold mb-1 ${esMio ? "text-purple-200" : "text-purple-600"}`}>
                      {esMio ? "Tú" : msg.user?.name ?? "Soporte"}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.mensaje}</p>
                    {msg.foto_url && (
                      <a href={msg.foto_url} target="_blank" rel="noreferrer">
                        <img src={msg.foto_url} alt="adjunto"
                          className="mt-2 rounded-xl max-w-full max-h-48 object-cover border border-white/20" />
                      </a>
                    )}
                    <p className={`text-[10px] mt-1.5 ${esMio ? "text-purple-300" : "text-gray-400"}`}>
                      {new Date(msg.created_at).toLocaleString("es-PE", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input respuesta */}
          {ticketActual?.estado !== "resuelto" ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
              <textarea rows={3} placeholder="Escribe tu mensaje…"
                value={respuesta} onChange={e => setRespuesta(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
              />
              <div className="flex items-center gap-3">
                {respuestaFoto ? (
                  <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 flex-1">
                    <Image size={14} className="text-purple-500" />
                    <span className="text-xs text-purple-700 flex-1 truncate">{respuestaFoto.name}</span>
                    <button onClick={() => setRespuestaFoto(null)} className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all">
                    <Image size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Adjuntar</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => setRespuestaFoto(e.target.files[0] ?? null)} />
                  </label>
                )}
                <button onClick={enviarRespuesta} disabled={sending || !respuesta.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 transition-all">
                  <Send size={14} /> {sending ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500 shrink-0" />
              <p className="text-sm font-semibold text-green-700">Este ticket fue marcado como resuelto.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}