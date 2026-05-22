import { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { authFetch } from "../router/authFetch";

import Header             from "../components/Header";
import Sidebar            from "../components/Sidebar";
import AdminDashboard     from "../views/admin/AdminDashboard";
import UserDashboard      from "../views/user/UserDashboard";
import AnunciosPage       from "../views/AnunciosPage";
import AgendaPage         from "../views/eventos/AgendaPage";
import TestimoniosAdmin   from "../views/admin/TestimoniosAdmin";
import TestimoniosUsuario from "../views/user/TestimoniosUsuario";
import SettingsView       from "../views/SettingsPanel";
import IngresosPage from "../views/ingresos/IngresosPage";
import HistorialSalarialPage from "../views/ingresos/HistorialSalarialPage";
import SoportePage      from "../views/soporte/SoportePage";
import SoporteAdminPage from "../views/soporte/SoporteAdminPage";
import MisEntradasPage from "../views/entradas/MisEntradasPage";
import HistorialEntradasPage from "../views/entradas/HistorialEntradasPage";
import GastosPage          from "../views/gastos/GastosPage";
import HistorialGastosPage from "../views/gastos/HistorialGastosPage";
export default function AppLayout({ session, onLogout, onUpdateUser }) {
  const [collapsed,             setCollapsed]             = useState(false);
  const [mobileOpen,            setMobileOpen]            = useState(false);
  const [pendientesTestimonios, setPendientesTestimonios] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (session.role !== "admin") return;
    authFetch("/admin/testimonios?estado=pendiente", session.token)
      .then(r => r.ok ? r.json() : [])
      .then(data => setPendientesTestimonios(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, [session.token, session.role]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        user={session}
        onLogout={onLogout}
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => setCollapsed(c => !c)}
        onMobileMenuToggle={() => setMobileOpen(o => !o)}
        onOpenSettings={() => navigate("/ajustes")}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          role={session.role}
          activePage={location.pathname}
          onNavigate={(path) => { navigate(path); setMobileOpen(false); }}
          pendientesTestimonios={pendientesTestimonios}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={
              session.role === "admin"
                ? <AdminDashboard user={session} onLogout={onLogout} />
                : <UserDashboard  user={session} onLogout={onLogout} />
            } />
            <Route path="/anuncios"    element={<AnunciosPage user={session} />} />
            <Route path="/agenda"      element={<AgendaPage   user={session} />} />
            <Route path="/ingresos" element={<IngresosPage user={session} />} />
<Route path="/ingresos/historial" element={<HistorialSalarialPage user={session} />} />
            <Route path="/testimonios" element={
              session.role === "admin"
                ? <TestimoniosAdmin   user={session} onPendientesChange={setPendientesTestimonios} />
                : <TestimoniosUsuario user={session} />
            } />
            <Route path="/ajustes" element={<SettingsView user={session} onUpdateUser={onUpdateUser} />} />
            <Route path="*"        element={<Navigate to="/dashboard" replace />} />
            <Route path="/soporte" element={
  session.role === "admin"
    ? <SoporteAdminPage user={session} />
    : <SoportePage      user={session} />
} />
<Route path="/soporte/:id" element={
  session.role === "admin"
    ? <SoporteAdminPage user={session} />
    : <SoportePage      user={session} />
} /><Route path="/mis-entradas" element={<MisEntradasPage user={session} />} />
<Route path="/mis-entradas/historial" element={<HistorialEntradasPage user={session} />} />          <Route path="/gastos"            element={<GastosPage          user={session} />} />
<Route path="/gastos/historial"  element={<HistorialGastosPage user={session} />} /></Routes>
        </main>
      </div>
    </div>
  );
}