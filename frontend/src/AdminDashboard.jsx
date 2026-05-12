import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import DashboardContent from "./components/DashboardContent";

export default function AdminDashboard({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} role={user.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <DashboardContent role={user.role} />
        </main>
      </div>
    </div>
  );
}
