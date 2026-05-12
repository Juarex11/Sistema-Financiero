import { useState } from "react";
import LoginPage from "./LoginPage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import DashboardContent from "./components/DashboardContent";
import UserDashboard from "./UserDashboard";

export default function App() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("session");
    return saved ? JSON.parse(saved) : null;
  });

  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogin = (data) => {
    localStorage.setItem("session", JSON.stringify(data));
    setSession(data);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("session");
    setSession(null);
  };

  if (!session) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        user={session}
        onLogout={handleLogout}
        sidebarCollapsed={collapsed}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onMobileMenuToggle={() => setMobileOpen((o) => !o)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
          role={session.role}
        />
        <main className="flex-1 overflow-y-auto">
          {session.role === "admin"
            ? <DashboardContent user={session} onLogout={handleLogout} />
            : <UserDashboard    user={session} onLogout={handleLogout} />
          }
        </main>
      </div>
    </div>
  );
}