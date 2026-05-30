import { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldAlert, RotateCcw, Archive, LayoutGrid, Edit3, Check, X } from 'lucide-react';
import type { Task } from '../types';
import { toast } from 'sonner';

interface Environment {
  id: number;
  name: string;
  description: string;
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [archivedEnvs, setArchivedEnvs] = useState<Environment[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Edit State
  const [editingEnvId, setEditingEnvId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (activeTab === 'active') {
      fetchEnvs();
    } else {
      fetchArchived();
    }
  }, [activeTab]);

  const fetchEnvs = async () => {
    try {
      const res = await fetch('/api/environments');
      if (res.ok) setEnvs(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchArchived = async () => {
    try {
      const resEnv = await fetch('/api/environments/archived');
      const resTask = await fetch('/api/tasks/archived');
      if (resEnv.ok) setArchivedEnvs(await resEnv.json());
      if (resTask.ok) setArchivedTasks(await resTask.json());
      fetchEnvs();
    } catch (err) { console.error(err); }
  };

  const getEnvName = (id: number) => {
    return envs.find(e => e.id === id)?.name || 'Deleted Environment';
  };

  const handleCreateEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if (res.ok) {
        setNewName(''); setNewDesc('');
        fetchEnvs();
      }
    } finally { setIsLoading(false); }
  };

  const startEditing = (env: Environment) => {
    setEditingEnvId(env.id);
    setEditName(env.name);
    setEditDesc(env.description);
  };

  const handleUpdateEnv = async (id: number) => {
    try {
      const res = await fetch('/api/environments/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, description: editDesc }),
      });
      if (res.ok) {
        setEditingEnvId(null);
        fetchEnvs();
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteEnv = async (id: number) => {
    toast.warning("Archive this environment?", {
      description: "It will be hidden from the workspace.",
      action: {
        label: "Archive",
        onClick: async () => {
          const res = await fetch('/api/environments/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });
          if (res.ok) {
            fetchEnvs();
            toast.success("Environment archived");
          } else {
            const data = await res.json();
            toast.error(data.message || "Cannot archive environment");
          }
        }
      }
    });
  };

  const handleRestoreEnv = async (id: number) => {
    const res = await fetch('/api/environments/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchArchived();
      toast.success("Environment restored");
    }
  };

  const handleRestoreTask = async (id: number) => {
    const res = await fetch('/api/tasks/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      fetchArchived();
      toast.success("Task restored");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspace Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure platforms and recover deleted data.</p>
        </div>
        
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'active' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="h-3 w-3" />
            Active
          </button>
          <button 
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'archived' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Archive className="h-3 w-3" />
            Archive
          </button>
        </div>
      </div>

      {activeTab === 'active' ? (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm self-start">
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Plus className="h-3.5 w-3.5" />New Environment</h4>
              <form onSubmit={handleCreateEnv} className="space-y-4">
                <input
                  type="text" placeholder="Environment Name" required
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/10"
                  value={newName} onChange={e => setNewName(e.target.value)}
                />
                <textarea
                  placeholder="Description..."
                  className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/10 resize-none h-20"
                  value={newDesc} onChange={e => setNewDesc(e.target.value)}
                />
                <button disabled={isLoading} className="w-full bg-foreground text-background py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all">
                  {isLoading ? 'Creating...' : 'Create Environment'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {envs.map(env => (
                <div key={env.id} className="group bg-card border border-border rounded-xl p-4 transition-all hover:border-ring/20">
                  {editingEnvId === env.id ? (
                    <div className="space-y-3">
                      <input 
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-1 text-sm font-bold focus:outline-none"
                        value={editName} onChange={e => setEditName(e.target.value)}
                      />
                      <textarea 
                        className="w-full bg-muted/50 border border-border rounded-lg px-3 py-1 text-xs focus:outline-none resize-none h-16"
                        value={editDesc} onChange={e => setEditDesc(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingEnvId(null)} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground"><X className="h-4 w-4" /></button>
                        <button onClick={() => handleUpdateEnv(env.id)} className="p-1.5 bg-foreground text-background rounded-md shadow-sm"><Check className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{env.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{env.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => startEditing(env)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg" title="Edit">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteEnv(env.id)} className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg" title="Archive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Archived Environments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archivedEnvs.map(env => (
                <div key={env.id} className="bg-muted/30 border border-border/50 rounded-xl p-4 flex items-center justify-between italic">
                  <div className="min-w-0 opacity-60">
                    <p className="text-sm font-bold truncate">{env.name}</p>
                    <p className="text-[10px]">Archived on {new Date().toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleRestoreEnv(env.id)} className="p-2 text-foreground hover:bg-card rounded-lg border border-transparent hover:border-border transition-all shadow-sm" title="Restore">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {archivedEnvs.length === 0 && <p className="text-sm text-muted-foreground italic ml-1">No archived environments.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Archived Tasks</h3>
            <div className="space-y-3">
              {archivedTasks.map(task => (
                <div key={task.id} className="bg-muted/30 border border-border/50 rounded-xl p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 opacity-60 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold truncate">{task.title}</p>
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">
                        {getEnvName(task.environment_id)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                      {task.description || "No description provided."}
                    </p>
                    <p className="text-[10px] font-medium italic">
                      Archived on {task.deleted_at ? new Date(task.deleted_at).toLocaleDateString() : 'N/A'} • ID: {task.id}
                    </p>
                  </div>
                  <button onClick={() => handleRestoreTask(task.id)} className="shrink-0 p-2 text-foreground hover:bg-card rounded-lg border border-transparent hover:border-border transition-all shadow-sm self-center" title="Restore Task">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {archivedTasks.length === 0 && <p className="text-sm text-muted-foreground italic ml-1">No archived tasks.</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
