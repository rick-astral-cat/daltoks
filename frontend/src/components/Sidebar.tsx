import { LayoutGrid, ClipboardList, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  username: string;
  onLogout: () => void;
}

export function Sidebar({ activeTab, setActiveTab, username, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen border-r border-border bg-card flex flex-col transition-all duration-300">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight">Daltoks</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-1 opacity-60">
          Internal Ops
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
              activeTab === item.id
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-background' : 'text-muted-foreground group-hover:text-foreground'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold uppercase border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
            {username.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{username}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
