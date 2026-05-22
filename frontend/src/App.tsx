import { useState, useEffect } from 'react'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-500 bg-background text-foreground">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Daltoks</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Minimalist tracking for Dalton
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-foreground/20 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-xl border border-border/50 transition-all hover:bg-muted hover:border-border group">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold block">Appearance</span>
                <span className="text-xs text-muted-foreground">Toggle between themes</span>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 dark:bg-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background cursor-pointer hover:opacity-80 active:scale-95"
                aria-label="Toggle dark mode"
              >
                <span
                  className={`${
                    isDarkMode ? 'translate-x-6 bg-zinc-100' : 'translate-x-1 bg-white'
                  } inline-block h-4 w-4 transform rounded-full shadow-md transition-all duration-300 ease-in-out`}
                />
              </button>
            </div>
          </div>

          <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-border flex items-center justify-center">
            <span className="text-xs text-muted-foreground italic">Ready for next phase: Login UI</span>
          </div>
        </div>
      </div>
      
      <footer className="mt-12 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium opacity-50">
        Design & Dev • 2026
      </footer>
    </div>
  )
}

export default App
