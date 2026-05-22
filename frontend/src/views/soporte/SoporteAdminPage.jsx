import { useState, useEffect, useRef } from "react";
import { authFetch } from "../../router/authFetch";
import {
  MessageCircle, RefreshCw, Send, Image,
  X, CheckCircle, Clock, AlertCircle, ArrowLeft
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

export default function SoporteAdminPage({ user }) {
  const [vista,        setVista]        = useState("lista");
  const [tickets,      setTickets]      = useState([]);
  const [ticketActual, setTicketActual] = useState(null);
  const [filtro,       setFiltro]       = useState("");
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [respuesta,    setRespuesta]    = useState("");
  const [foto,         setFoto]         = useState(null);
  const bottomRef = useRef(null);

  const cargarTickets = async () => {
    setLoading(true);
    try {
      const url = filtro ? `/admin/tickets?estado=${filtro}` : "/admin/tickets";
      const res  = await authFetch(url, user.token);
      const data = res.ok ? await res.json() : [];
      setTickets(data);
    } catch {}
    finally { setLoading(false); }
  };

  const cargarTicket = async (id) => {
    setLoading(true);
    try {
      const res  = await authFetch(`/admin/tickets/${id}`, user.token);
      const data = res.ok ? await res.json() : null;
      setTicketActual(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { cargarTickets(); }, [filtro]);

  useEffect(() => {
    if (vista === "ticket") {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [ticketActual, vista]);

  const abrirTicket = async (ticket) => {
    setVista("ticket");
    await cargarTicket(ticket.id);
  };

  const enviarRespuesta = async () => {
    if (!respuesta.trim()) return;
    setSending(true);
    try {
      const form = new FormData();
      form.append("mensaje", respuesta);
      if (foto) form.append("foto", foto);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/tickets/${ticketActual.id}/responder`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.token}`, Accept: "application/json" },
        body: form,
      });

      if (res.ok) {
        setRespuesta(""); setFoto(null);
        await cargarTicket(ticketActual.id);
      }
    } catch {}
    finally { setSending(false); }
  };

  const cambiarEstado = async (estado) => {
    await authFetch(`/admin/tickets/${ticketActual.id}/estado`, user.token, {
      method: "PATCH",
      body: JSON.stringify({ estado }),
    });
    await cargarTicket(ticketActual.id);
    cargarTickets();
  };

  // ── Lista ───────────────────────────────────────────────────────────────────
  if (vista === "lista") return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets de soporte</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona las solicitudes de los usuarios</p>
        </div>
        <button onClick={cargarTickets}
          className="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { value: "",           label: "Todos"       },
          { value: "pendiente",  label: "Pendientes"  },
          { value: "en_revision",label: "En revisión" },
          { value: "resuelto",   label: "Resueltos"   },
        ].map(f => (
          <button key={f.value} onClick={() => setFiltro(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              filtro === f.value
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
          <MessageCircle size={40} strokeWidth={1} className="mb-3" />
          <p className="text-sm font-medium text-gray-400">No hay tickets</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden rounded-2xl">
          <div className="grid grid-cols-4 px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest col-span-2">Asunto</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Usuario</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</p>
          </div>
          {tickets.map(ticket => (
            <button key={ticket.id} onClick={() => abrirTicket(ticket)}
              className="w-full grid grid-cols-4 px-6 py-4 border-b border-gray-50 hover:bg-gray-50 transition-all text-left items-center">
              <div className="col-span-2">
                <p className="text-sm font-semibold text-gray-800 truncate">{ticket.asunto}</p>
                <p className="text-xs text-gray-400">{ticket.mensajes_count} mensajes · {new Date(ticket.created_at).toLocaleDateString("es-PE")}</p>
              </div>
              <p className="text-sm text-gray-600 truncate">{ticket.user?.name}</p>
              <EstadoBadge estado={ticket.estado} />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // ── Chat ────────────────────────────────────────────────────────────────────
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
          <p className="text-xs text-gray-400">
            #{ticketActual?.id} · {ticketActual?.user?.name}
          </p>
        </div>

        {/* Cambiar estado */}
        <div className="flex gap-2">
          {["pendiente","en_revision","resuelto"].map(e => (
            <button key={e} onClick={() => cambiarEstado(e)}
              disabled={ticketActual?.estado === e}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                ticketActual?.estado === e
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-500 border-gray-200 hover:border-purple-300"
              }`}>
              {ESTADOS[e].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw size={20} className="animate-spin mr-2" /> Cargando…
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {ticketActual?.mensajes?.map(msg => {
              const esAdmin = msg.user?.role === "admin";
              return (
                <div key={msg.id} className={`flex ${esAdmin ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    esAdmin ? "bg-purple-600 text-white" : "bg-white border border-gray-100 text-gray-800"
                  }`}>
                    <p className={`text-xs font-bold mb-1 ${esAdmin ? "text-purple-200" : "text-purple-600"}`}>
                      {msg.user?.name ?? "Usuario"}
                    </p>
                    <p className="text-sm leading-relaxed">{msg.mensaje}</p>
                    {msg.foto_url && (
                      <a href={msg.foto_url} target="_blank" rel="noreferrer">
                        <img src={msg.foto_url} alt="adjunto"
                          className="mt-2 rounded-xl max-w-full max-h-48 object-cover" />
                      </a>
                    )}
                    <p className={`text-[10px] mt-1.5 ${esAdmin ? "text-purple-300" : "text-gray-400"}`}>
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

          {ticketActual?.estado !== "resuelto" ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
              <textarea rows={3} placeholder="Escribe tu respuesta…"
                value={respuesta} onChange={e => setRespuesta(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
              />
              <div className="flex items-center gap-3">
                {foto ? (
                  <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 flex-1">
                    <Image size={14} className="text-purple-500" />
                    <span className="text-xs text-purple-700 flex-1 truncate">{foto.name}</span>
                    <button onClick={() => setFoto(null)} className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 border border-dashed border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:border-purple-300 hover:bg-purple-50 transition-all">
                    <Image size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-400">Adjuntar</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => setFoto(e.target.files[0] ?? null)} />
                  </label>
                )}
                <button onClick={enviarRespuesta} disabled={sending || !respuesta.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 transition-all">
                  <Send size={14} /> {sending ? "Enviando…" : "Responder"}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500 shrink-0" />
              <p className="text-sm font-semibold text-green-700">Ticket resuelto.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}