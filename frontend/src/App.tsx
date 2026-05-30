import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Tasks } from './views/Tasks';
import { Settings } from './views/Settings';
import type { User } from './types';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [activeTab, setActiveTab] = useState('tasks');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        await checkAuth();
        setUsername('');
        setPassword('');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Server unreachable');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground transition-colors duration-500">
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Daltoks</h1>
            <p className="text-muted-foreground text-sm mt-2">Private Tracking System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/10 focus:border-ring transition-all placeholder:text-muted-foreground/40"
                placeholder="ricardo"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/10 focus:border-ring transition-all placeholder:text-muted-foreground/40"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-xs font-semibold text-red-500 ml-1 mt-2">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-500 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        username={user.username} 
        onLogout={handleLogout} 
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          title={activeTab} 
          isDarkMode={isDarkMode} 
          toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        />
        
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && (
            <div className="max-w-4xl mx-auto">
              <h3 className="text-lg font-medium">Dashboard</h3>
              <p className="text-muted-foreground mt-1">Overview of your telemetry and tasks.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-xl border border-border bg-card p-6 animate-pulse" />
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'tasks' && <Tasks />}

          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}

export default App;
