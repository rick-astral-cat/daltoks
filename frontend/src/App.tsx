import { useState, useEffect, useRef } from 'react'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) return savedTheme === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    checkAuth()
    
    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch (err) {
      setUser(null)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        await checkAuth()
        setUsername('')
        setPassword('')
      } else {
        setError('Invalid credentials')
      }
    } catch (err) {
      setError('Server unreachable')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      setUser(null)
      setShowMenu(false)
    } catch (err) {
      console.error("Logout failed", err)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground transition-colors duration-500">
      
      {/* Top Right Actions Area */}
      <div className="absolute top-6 right-6 flex items-center gap-4">
        {user ? (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border group"
            >
              <span className="text-sm font-medium">{user.username}</span>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold uppercase overflow-hidden border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300">
                {user.username.charAt(0)}
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                <div className="px-4 py-3 border-bottom border-border bg-muted/20">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Account</p>
                  <p className="text-sm font-medium truncate">{user.username}</p>
                </div>
                
                <div className="p-1">
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {isDarkMode ? (
                        <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 18v1m9-9h1M4 12H3m15.364-6.364l.707-.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      ) : (
                        <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                      )}
                      <span>Theme</span>
                    </div>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold text-muted-foreground">
                      {isDarkMode ? 'Dark' : 'Light'}
                    </span>
                  </button>

                  <div className="my-1 border-t border-border mx-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-500 transition-colors group"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border"
          >
            {isDarkMode ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 18v1m9-9h1M4 12H3m15.364-6.364l.707-.707M6.343 17.657l-.707.707M16.95 16.95l.707.707M7.05 7.05l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
        )}
      </div>

      <div className="max-w-sm w-full bg-card border border-border rounded-2xl p-8 shadow-sm transition-all duration-300">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Daltoks</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {user ? `Connected as ${user.username}` : 'Private Tracking System'}
          </p>
        </div>

        {user ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
             <div className="h-16 w-16 rounded-full bg-foreground/5 flex items-center justify-center mb-2">
                <svg className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div className="text-center">
                <p className="text-sm font-medium">Authentication Verified</p>
                <p className="text-xs text-muted-foreground mt-1">Ready for Dalton's Workspace</p>
             </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground ml-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full mt-1.5 px-4 py-2.5 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/10 focus:border-ring transition-all placeholder:text-muted-foreground/40"
                placeholder="your_super_secret_username"
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
        )}
      </div>

      <footer className="absolute bottom-8 text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold opacity-20">
        Internal Access Only
      </footer>
    </div>
  )
}

export default App
