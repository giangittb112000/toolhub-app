import { Activity, FileJson, LayoutDashboard, Network, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "System Monitor", path: "/modules/system-monitor", icon: Activity },
    { name: "Mock API", path: "/modules/mock-api", icon: Network },
    { name: "JSON Formatter", path: "/modules/json-formatter", icon: FileJson },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-50 font-sans antialiased">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-950/50 flex flex-col pt-8">
        {/* macOS Traffic Lights drag region padding */}
        <div className="drag-region h-6 w-full shrink-0 mb-4" />

        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" />
            ToolHub
          </h2>
          <p className="text-xs text-zinc-500 font-medium">Developer tools suite</p>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-drag-region">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-zinc-800/80 text-orange-500"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Update Banner placeholder for Phase 3 */}
        <div className="p-4 mt-auto">{/* Update ready banner goes here */}</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <header className="drag-region h-12 shrink-0 border-b border-zinc-800/50 flex items-center px-6">
          {/* Draggable header area */}
        </header>
        <main className="flex-1 overflow-y-auto p-6 no-drag-region relative">{children}</main>
      </div>
    </div>
  );
}
