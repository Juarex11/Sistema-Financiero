export default function UserDashboard({ user, onLogout }) {
  const activities = [
    { action: "Inicio de sesión exitoso", time: "Hace 2 minutos", icon: "🔐" },
    { action: "Perfil actualizado", time: "Hace 3 días", icon: "✏️" },
    { action: "Contraseña cambiada", time: "Hace 1 semana", icon: "🔑" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-sm font-bold">U</div>
            <span className="font-semibold text-slate-100">Mi Panel</span>
            <span className="hidden sm:inline-block text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full px-2.5 py-0.5">Usuario</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400 hidden sm:block">Hola, <span className="text-white font-medium">{user.name}</span></span>
            <button
              onClick={onLogout}
              className="text-sm bg-slate-800 hover:bg-red-900/40 border border-slate-700 hover:border-red-800 text-slate-300 hover:text-red-400 rounded-lg px-4 py-1.5 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-900/50 rounded-2xl p-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-700 flex items-center justify-center text-2xl font-bold text-emerald-400">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">¡Bienvenido, {user.name}!</h1>
              <p className="text-slate-400 text-sm mt-1">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Sesiones este mes", value: "12" },
            { label: "Último acceso", value: "Hoy" },
            { label: "Estado", value: "Activo" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
              <div className="text-xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-slate-100">Actividad reciente</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {activities.map((a) => (
              <div key={a.action} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-800/30 transition">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-lg">{a.icon}</div>
                <div className="flex-1">
                  <p className="text-sm text-slate-200">{a.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-3 bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-4 text-sm text-slate-400">
          <svg className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tienes acceso de usuario estándar. Para solicitar permisos adicionales, contacta al administrador.
        </div>
      </div>
    </div>
  );
}
