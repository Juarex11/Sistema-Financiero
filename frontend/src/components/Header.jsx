import { useState } from "react";

const SidebarToggleIcon = ({ collapsed }) => collapsed
  ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
  : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>;

const ChevronIcon  = () => <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
const ProfileIcon  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SettingsIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const BellIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

export default function Header({ user, onLogout, sidebarCollapsed, onToggleSidebar }) {
  const [dropOpen, setDropOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-md flex items-center px-5 gap-4 sticky top-0 z-10 w-full">

      {/* Left: Logo + gap + toggle */}
      <div className="flex items-center shrink-0">
        <img
          src="https://placehold.co/36x36/7c3aed/ffffff?text=M"
          alt="Milenco"
          className="w-9 h-9 rounded-xl object-cover shadow-md shadow-purple-100"
        />
        {/* Extra gap between logo and toggle */}
        <div className="w-6" />
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-purple-600 transition"
          title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <SidebarToggleIcon collapsed={sidebarCollapsed} />
        </button>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotiOpen(!notiOpen); setDropOpen(false); }}
            className="relative w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-300 hover:text-purple-600 transition"
          >
            <BellIcon />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {notiOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Notificaciones</p>
                <span className="text-xs bg-purple-100 text-purple-600 font-semibold px-2 py-0.5 rounded-full">3 nuevas</span>
              </div>
              {[
                { title: "Nuevo ingreso registrado", time: "Hace 5 min", color: "bg-green-100 text-green-600" },
                { title: "Presupuesto al 71%", time: "Hace 1 hora", color: "bg-yellow-100 text-yellow-600" },
                { title: "Reporte mensual listo", time: "Hace 3 horas", color: "bg-purple-100 text-purple-600" },
              ].map((n, i) => (
                <div key={i} className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-3">
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.color.split(" ")[0]}`} />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2.5 text-center">
                <button className="text-xs text-purple-600 font-semibold hover:underline">Ver todas</button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative">
          <button
            onClick={() => { setDropOpen(!dropOpen); setNotiOpen(false); }}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-purple-200">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-700 leading-tight">{user.name}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <span className="hidden md:block">
              <ChevronIcon />
            </span>
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-700">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition">
                <ProfileIcon /> Mi perfil
              </button>
              <button className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition">
                <SettingsIcon /> Ajustes
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={onLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition"
              >
                <LogoutIcon /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}