const statCards = [
  {
    label: "Total Ingresos",
    value: "S/ 30,200",
    icon: "💰",
    change: "+10% este mes",
    changeUp: true,
    color: "amber",
  },
  {
    label: "Total Egresos",
    value: "S/ 12,450",
    icon: "📤",
    change: "-5% este mes",
    changeUp: false,
    color: "red",
  },
  {
    label: "Balance Neto",
    value: "S/ 17,750",
    icon: "📈",
    change: "+18% este mes",
    changeUp: true,
    color: "green",
  },
  {
    label: "Presupuesto",
    value: "S/ 25,000",
    icon: "📋",
    change: "71% ejecutado",
    changeUp: true,
    color: "purple",
  },
];

const colorMap = {
  amber:  { bg: "bg-amber-50",  text: "text-amber-600",  bar: "bg-amber-500",  badge: "bg-amber-500" },
  red:    { bg: "bg-red-50",    text: "text-red-500",    bar: "bg-red-500",    badge: "bg-red-500" },
  green:  { bg: "bg-green-50",  text: "text-green-600",  bar: "bg-green-500",  badge: "bg-green-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", bar: "bg-purple-500", badge: "bg-purple-500" },
};

const transactions = [
  { desc: "Pago proveedor A",  amount: "-S/ 2,300", date: "12 May", type: "egreso" },
  { desc: "Ingreso cliente B", amount: "+S/ 5,100", date: "11 May", type: "ingreso" },
  { desc: "Servicios TI",      amount: "-S/ 890",   date: "10 May", type: "egreso" },
  { desc: "Venta producto X",  amount: "+S/ 3,200", date: "09 May", type: "ingreso" },
  { desc: "Alquiler oficina",  amount: "-S/ 1,500", date: "08 May", type: "egreso" },
];

const traffic = [
  { label: "Ingresos Directos", pct: 80 },
  { label: "Ventas Online",     pct: 55 },
  { label: "Comisiones",        pct: 30 },
  { label: "Otros",             pct: 15 },
];

export default function DashboardContent({ role }) {
  return (
    <div className="p-6 space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen financiero — Mayo 2026</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const c = colorMap[card.color];
          return (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{card.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${c.text}`}>{card.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center text-xl`}>
                    {card.icon}
                  </div>
                </div>
              </div>
              <div className={`${c.badge} px-5 py-2.5 flex items-center justify-between`}>
                <span className="text-white text-xs font-medium">{card.change}</span>
                <span className="text-white text-sm">{card.changeUp ? "↗" : "↘"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart placeholder */}
        <div className="lg:col-span-2 bg-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-bold text-lg">Movimientos del Mes</p>
              <p className="text-purple-200 text-sm">Ingresos vs Egresos</p>
            </div>
            <span className="text-xs bg-white/20 rounded-lg px-3 py-1.5">↘ 3%</span>
          </div>
          {/* Simple SVG chart */}
          <svg viewBox="0 0 400 120" className="w-full" preserveAspectRatio="none">
            <polyline
              points="0,90 60,60 120,75 180,30 240,50 300,20 360,40 400,35"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
            />
            <polyline
              points="0,100 60,80 120,95 180,70 240,85 300,65 360,75 400,70"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
            />
            <polyline
              points="0,90 60,60 120,75 180,30 240,50 300,20 360,40 400,35"
              fill="rgba(255,255,255,0.1)"
              stroke="white"
              strokeWidth="2.5"
            />
          </svg>
          <div className="flex gap-8 mt-4">
            <div>
              <p className="text-2xl font-bold">S/ 17,750</p>
              <p className="text-purple-200 text-xs">Balance Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold">284</p>
              <p className="text-purple-200 text-xs">Transacciones</p>
            </div>
          </div>
        </div>

        {/* Traffic sources */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="font-bold text-gray-800 mb-5">Fuentes de Ingreso</p>
          <div className="space-y-4">
            {traffic.map((t) => (
              <div key={t.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-600 font-medium">{t.label}</span>
                  <span className="text-gray-800 font-bold">{t.pct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${t.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent transactions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="font-bold text-gray-800">Últimas Transacciones</p>
            <button className="text-xs text-purple-600 hover:underline font-medium">Ver todas</button>
          </div>
          <div className="divide-y divide-gray-50">
            {transactions.map((t) => (
              <div key={t.desc} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                  t.type === "ingreso" ? "bg-green-50" : "bg-red-50"
                }`}>
                  {t.type === "ingreso" ? "💹" : "📤"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">{t.desc}</p>
                  <p className="text-xs text-gray-400">{t.date}</p>
                </div>
                <span className={`text-sm font-bold ${
                  t.type === "ingreso" ? "text-green-600" : "text-red-500"
                }`}>
                  {t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="font-bold text-gray-800 mb-5">Resumen por Categoría</p>
          <div className="space-y-3">
            {[
              { label: "Operaciones",   value: "S/ 8,200",  pct: 65, color: "bg-purple-500" },
              { label: "Administrativo",value: "S/ 3,100",  pct: 40, color: "bg-amber-400" },
              { label: "Comercial",     value: "S/ 5,800",  pct: 80, color: "bg-green-500" },
              { label: "Tecnología",    value: "S/ 1,350",  pct: 25, color: "bg-blue-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-semibold text-gray-800">{item.value}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin only section */}
          {role === "admin" && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Solo Admin</p>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-purple-50 text-purple-700 rounded-xl py-2.5 text-sm font-medium hover:bg-purple-100 transition">
                  👥 Usuarios
                </button>
                <button className="bg-gray-50 text-gray-600 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-100 transition">
                  📊 Reportes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
