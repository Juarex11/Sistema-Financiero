import { useState } from "react";
import LoginPage from "./LoginPage";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import AdminDashboard from "./components/DashboardContent";
import UserDashboard from "./UserDashboard";

export default function App() {
  const [session, setSession] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogin = (data) => setSession(data);
  const handleLogout = () => {
    localStorage.removeItem("token");
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
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} role={session.role} />

        <main className="flex-1 overflow-y-auto">
          {session.role === "admin"
            ? <AdminDashboard user={session} onLogout={handleLogout} />
            : <UserDashboard  user={session} onLogout={handleLogout} />
          }
        </main>
      </div>

    </div>
  );
}