import { useState } from "react";
import logo from "../assets/logo.png";

const HomeIcon       = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const IncomeIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const EgresoIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const ReportIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const BudgetIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const UsersIcon      = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ProfileIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SettingsIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const TestimonioIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const AnuncioIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>;
const BadgeIcon      = () => <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
const AgendaIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const navItems = [
  {
    section: "PRINCIPAL",
    items: [
      { label: "Dashboard", path: "/dashboard", Icon: HomeIcon },
    ],
  },
  {
    section: "FINANZAS",
    items: [
      { label: "Ingresos",     path: "/ingresos",     Icon: IncomeIcon },
      { label: "Egresos",      path: "/egresos",      Icon: EgresoIcon },
      { label: "Reportes",     path: "/reportes",     Icon: ReportIcon },
      { label: "Presupuestos", path: "/presupuestos", Icon: BudgetIcon },
    ],
  },
   {
    section: "AGENDA",                                          // ← nueva
    items: [
      { label: "Agenda", path: "/agenda", Icon: AgendaIcon },
    ],
  },
  {
    section: "COMUNIDAD",
    items: [
      { label: "Anuncios",    path: "/anuncios",    Icon: AnuncioIcon    },
      { label: "Testimonios", path: "/testimonios", Icon: TestimonioIcon },
    ],
  },
  {
    section: "CONFIGURACIÓN",
    items: [
      { label: "Usuarios",  path: "/usuarios", Icon: UsersIcon,   adminOnly: true },
      { label: "Ajustes",   path: "/ajustes",  Icon: SettingsIcon },
    ],
  },
];

function NavContent({ collapsed, forceExpanded, role, activePage, onNavigate, pendientes = 0 }) {
  const [tooltip, setTooltip] = useState(null);
  const isCollapsedMode = !forceExpanded && collapsed;

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5 mt-1">
      {navItems.map((group) => {
        const visibleItems = group.items.filter(item => !item.adminOnly || role === "admin");
        if (!visibleItems.length) return null;

        return (
          <div key={group.section}>
            {!isCollapsedMode && (
              <p className="text-[10px] font-bold text-purple-500 tracking-widest mb-2 px-3">
                {group.section}
              </p>
            )}
            {isCollapsedMode && <div className="border-t border-purple-100 mb-2 mx-2" />}

            <ul className="space-y-1">
              {visibleItems.map(({ label, path, Icon }) => {
                const isActive  = activePage === path;
                const showBadge = path === "/testimonios" && role === "admin" && pendientes > 0;

                return (
                  <li key={path} className="relative px-1">
                    <button
                      onClick={() => onNavigate(path)}
                      onMouseEnter={() => isCollapsedMode && setTooltip(path)}
                      onMouseLeave={() => setTooltip(null)}
                      className={`
                        w-full flex items-center gap-3 rounded-lg text-sm font-medium
                        transition-all duration-150
                        ${isCollapsedMode ? "justify-center px-0 py-3" : "px-4 py-3"}
                        ${isActive
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        }
                      `}
                    >
                      <span className={`shrink-0 relative ${isActive ? "text-purple-600" : ""}`}>
                        <Icon />
                        {showBadge && isCollapsedMode && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
                        )}
                      </span>
                      {!isCollapsedMode && (
                        <>
                          <span className="flex-1 text-left">{label}</span>
                          {showBadge && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                              {pendientes}
                            </span>
                          )}
                        </>
                      )}
                    </button>

                    {isCollapsedMode && tooltip === path && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none">
                        <div className="bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                          {label}{showBadge && ` (${pendientes})`}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function Footer({ collapsed, forceExpanded }) {
  const isCollapsedMode = !forceExpanded && collapsed;
  return isCollapsedMode ? (
    <div className="py-4 flex justify-center border-t border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center"><BadgeIcon /></div>
    </div>
  ) : (
    <div className="px-3 py-4 border-t border-gray-100">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50">
        <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center shrink-0"><BadgeIcon /></div>
        <div>
          <p className="text-xs font-semibold text-purple-700">Plan Activo</p>
          <p className="text-[10px] text-purple-400">Sistema v1.0</p>
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose, role, activePage, onNavigate, pendientesTestimonios = 0 }) {
  return (
    <>
      <aside className={`hidden lg:flex flex-col h-full bg-white border-r border-gray-100 shrink-0 transition-all duration-300 ease-in-out ${collapsed ? "w-16" : "w-64"}`}>
        <NavContent collapsed={collapsed} role={role} activePage={activePage} onNavigate={onNavigate} pendientes={pendientesTestimonios} />
        <Footer collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onMobileClose} />
          <aside className="fixed top-0 left-0 h-full w-64 bg-white shadow-2xl z-50 flex flex-col lg:hidden">
            <div className="flex items-center px-5 py-4 border-b border-gray-100">
              <img src={logo} alt="Milenco" className="h-10 w-auto object-contain" />
            </div>
            <NavContent collapsed={false} forceExpanded role={role} activePage={activePage} onNavigate={onNavigate} pendientes={pendientesTestimonios} />
            <Footer collapsed={false} forceExpanded />
          </aside>
        </>
      )}
    </>
  );
}