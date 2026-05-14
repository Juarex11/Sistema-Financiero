const LoginIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const EditIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const KeyIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
const InfoIcon   = () => <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const CalIcon    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;

const activities = [
  { action: "Inicio de sesión exitoso", time: "Hace 2 minutos", Icon: LoginIcon, color: "text-emerald-500 bg-emerald-50" },
  { action: "Perfil actualizado",       time: "Hace 3 días",    Icon: EditIcon,  color: "text-indigo-500  bg-indigo-50"  },
  { action: "Contraseña cambiada",      time: "Hace 1 semana",  Icon: KeyIcon,   color: "text-amber-500   bg-amber-50"   },
];

export default function UserDashboard({ user }) {
  const initials = (user.name ?? "U")
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Bienvenida */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-purple-600 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
              {user.photo
                ? <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-purple-600">{initials}</span>
              }
            </div>
            <span className="mb-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
              <CheckIcon /> Activo
            </span>
          </div>
          <div className="mt-3">
            <h1 className="text-xl font-bold text-slate-800">¡Bienvenido, {user.name}!</h1>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
            {user.cargo && (
              <p className="text-slate-500 text-sm mt-1 font-medium">{user.cargo}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Sesiones este mes", value: "12",    icon: <LoginIcon /> },
          { label: "Último acceso",     value: "Hoy",   icon: <CalIcon />   },
          { label: "Estado cuenta",     value: "Activo",icon: <CheckIcon /> },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400">{s.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Actividad reciente</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {activities.map(a => (
            <div key={a.action} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.color}`}>
                <a.Icon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{a.action}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-5 py-4 text-sm text-indigo-700">
        <InfoIcon />
        Tienes acceso de usuario estándar. Para solicitar permisos adicionales, contacta al administrador.
      </div>

    </div>
  );
}