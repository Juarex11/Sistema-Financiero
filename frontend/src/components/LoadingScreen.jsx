import logo from "../assets/logo.png";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">

      {/* Fondo sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-100/80 blur-[120px]" />
      </div>

      {/* Anillos + logo */}
      <div className="relative flex items-center justify-center w-52 h-52">
        {/* Anillo exterior */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ animation: "ls-spin 2s linear infinite" }}
          viewBox="0 0 208 208"
          fill="none"
        >
          <circle cx="104" cy="104" r="96" stroke="#e0e7ff" strokeWidth="5" />
          <path d="M104 8 a96 96 0 0 1 96 96" stroke="#6366f1" strokeWidth="5" strokeLinecap="round" />
        </svg>
        {/* Anillo interior punteado */}
        <svg
          className="absolute"
          style={{
            animation: "ls-spin 3s linear infinite reverse",
            width: "80%", height: "80%", top: "10%", left: "10%",
          }}
          viewBox="0 0 208 208"
          fill="none"
        >
          <circle cx="104" cy="104" r="96" stroke="#c7d2fe" strokeWidth="3" strokeDasharray="8 16" />
        </svg>
        {/* Logo más grande */}
        <img src={logo} alt="Logo" className="w-36 h-36 object-contain rounded-full z-10" />
      </div>

   

      <style>{`
        @keyframes ls-spin   { to { transform: rotate(360deg); } }
        @keyframes ls-pulse  { 0%,100% { opacity:.4; } 50% { opacity:1; } }
        @keyframes ls-bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
      `}</style>
    </div>
  );
}