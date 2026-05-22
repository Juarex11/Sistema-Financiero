import { useState } from "react";
import logo from "../assets/logo.png";
import {
  Home, TrendingUp, TrendingDown, BarChart3,
  Wallet, Users, Settings, MessageCircle,
  Megaphone, Award, Calendar, ArrowDownCircle, Receipt,
} from "lucide-react";

const navItems = [
  {
    section: "PRINCIPAL",
    items: [
      { label: "Dashboard", path: "/dashboard", Icon: Home },
    ],
  },
{
  section: "FINANZAS",
  items: [
    { label: "Ingreso Salarial", path: "/ingresos",      Icon: TrendingUp      },
    { label: "Mis Entradas",     path: "/mis-entradas",  Icon: ArrowDownCircle },
    { label: "Egreso Gastos",    path: "/gastos",        Icon: Receipt         },
    { label: "Egresos",          path: "/egresos",        Icon: TrendingDown    },
    { label: "Reportes",         path: "/reportes",       Icon: BarChart3       },
    { label: "Presupuestos",     path: "/presupuestos",   Icon: Wallet          },
  ],
},
  {
    section: "AGENDA",
    items: [
      { label: "Agenda", path: "/agenda", Icon: Calendar },
    ],
  },
  {
    section: "COMUNIDAD",
    items: [
      { label: "Anuncios",    path: "/anuncios",    Icon: Megaphone },
      { label: "Testimonios", path: "/testimonios", Icon: MessageCircle },
    ],
  },
  {
    section: "CONFIGURACIÓN",
    items: [
      { label: "Usuarios", path: "/usuarios", Icon: Users,       adminOnly: true },
    { label: "Soporte",  path: "/soporte",  Icon: MessageCircle },
    { label: "Ajustes",  path: "/ajustes",  Icon: Settings },
    ],
  },
];

function NavContent({ collapsed, forceExpanded, role, activePage, onNavigate, pendientes = 0 }) {
  const [tooltip, setTooltip] = useState(null);
  const isCollapsedMode = !forceExpanded && collapsed;

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5 mt-1 custom-scroll">
      {navItems.map((group) => {
        const visibleItems = group.items.filter(item => !item.adminOnly || role === "admin");
        if (!visibleItems.length) return null;

        return (
          <div key={group.section}>
            {!isCollapsedMode && (
              <p className="text-[11px] font-black text-purple-600 tracking-wider mb-3 px-3">
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
                        w-full flex items-center gap-3 transition-all duration-150
                        ${isCollapsedMode ? "justify-center px-0 py-3" : "px-4 py-3"}
                        ${isActive
                          ? "bg-purple-100 text-purple-700 font-bold"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium"
                        }
                      `}
                    >
                      <span className={`shrink-0 relative ${isActive ? "text-purple-700" : "text-gray-500"}`}>
                        <Icon size={20} strokeWidth={1.75} />
                        {showBadge && isCollapsedMode && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
                        )}
                      </span>
                      {!isCollapsedMode && (
                        <>
                          <span className="flex-1 text-left text-sm font-semibold tracking-wide">
                            {label}
                          </span>
                          {showBadge && (
                            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight shadow-sm">
                              {pendientes}
                            </span>
                          )}
                        </>
                      )}
                    </button>

                    {isCollapsedMode && tooltip === path && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none">
                        <div className="bg-gray-800 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
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
  const currentYear = new Date().getFullYear();

  return isCollapsedMode ? (
    <div className="py-4 flex justify-center border-t border-gray-100">
      <div className="w-8 h-8 bg-purple-600 flex items-center justify-center shadow-sm">
        <Award size={14} className="text-white" strokeWidth={1.75} />
      </div>
    </div>
  ) : (
    <div className="px-3 py-4 border-t border-gray-100">
      <div className="flex items-center justify-center">
        <p className="text-[10px] font-medium text-gray-400">© {currentYear} - Todos los derechos reservados</p>
      </div>
    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onMobileClose, role, activePage, onNavigate, pendientesTestimonios = 0 }) {
  return (
    <>
      <style>{`
        .custom-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #c4b5fd;
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #a78bfa;
        }
      `}</style>

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