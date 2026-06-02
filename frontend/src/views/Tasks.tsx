import { useState, useEffect } from 'react';
import type { Task, TaskUpdate, User } from '../types';
import { toast } from 'sonner';
import { 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Plus, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Timer,
  X,
  UserPlus,
  Trash2
} from 'lucide-react';

interface Environment {
  id: number;
  name: string;
  description: string;
}

export function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [envs, setEnvs] = useState<Environment[]>([]);
  const [selectedEnvId, setSelectedEnvId] = useState<number | 'all'>('all');
  
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [updates, setUpdates] = useState<Record<number, TaskUpdate[]>>({});
  const [newUpdate, setNewUpdate] = useState('');
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignee_id: null as number | null, environment_id: 0 });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    fetchEnvs();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedEnvId]);

  const fetchEnvs = async () => {
    try {
      const res = await fetch('/api/environments');
      if (res.ok) {
        const data = await res.json();
        setEnvs(data);
      }
    } catch (err) {
      console.error("Failed to fetch environments", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const url = selectedEnvId === 'all' ? '/api/tasks' : `/api/tasks?environment_id=${selectedEnvId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchUpdates = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/updates?task_id=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setUpdates(prev => ({ ...prev, [taskId]: data }));
      }
    } catch (err) {
      console.error("Failed to fetch updates", err);
    }
  };

  const updateTask = async (taskId: number, updates: { status?: string, assignee_id?: number | null }) => {
    try {
      const res = await fetch('/api/tasks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, ...updates }),
      });
      if (res.ok) {
        fetchTasks();
        if (selectedTask && selectedTask.id === taskId) {
          setSelectedTask(prev => prev ? { ...prev, ...updates } as Task : null);
        }
      }
    } catch (err) {
      console.error("Failed to update task", err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    toast.warning("Move task to trash?", {
      description: "You can recover it later from settings.",
      action: {
        label: "Archive",
        onClick: async () => {
          try {
            const res = await fetch('/api/tasks/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: taskId }),
            });
            if (res.ok) {
              setSelectedTask(null);
              setExpandedTaskId(null);
              fetchTasks();
              toast.success("Task archived successfully");
            }
          } catch (err) {
            toast.error("Failed to archive task");
          }
        },
      },
    });
  };

  const toggleExpand = (taskId: number) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      if (!updates[taskId]) {
        fetchUpdates(taskId);
      }
    }
  };

  const handleAddUpdate = async (taskId: number) => {
    if (!newUpdate.trim()) return;
    try {
      const res = await fetch('/api/tasks/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, content: newUpdate }),
      });
      if (res.ok) {
        setNewUpdate('');
        fetchUpdates(taskId);
      }
    } catch (err) {
      console.error("Failed to add update", err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.environment_id === 0) {
      alert("Please select an environment");
      return;
    }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        setIsAddingTask(false);
        setNewTask({ title: '', description: '', assignee_id: null, environment_id: 0 });
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo': return <Circle className="h-4 w-4 text-zinc-400" />;
      case 'in progress': return <Timer className="h-4 w-4 text-orange-500" />;
      case 'resolved': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getAssigneeName = (id: number | null) => {
    if (!id) return 'Unassigned';
    return users.find(u => u.id === id)?.username || 'Unknown';
  };

  const getEnvName = (id: number) => {
    return envs.find(e => e.id === id)?.name || 'General';
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-4">
      {/* Detail Sidebar (Drawer) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-card h-full shadow-2xl border-l border-border p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Task Details • {getEnvName(selectedTask.environment_id)}</span>
              <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-2xl font-bold mb-8 leading-tight">{selectedTask.title}</h2>
            
            <div className="space-y-8 mb-10 pb-8 border-b border-border">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Status</p>
                <div className="flex gap-2">
                  {['todo', 'in progress', 'resolved'].map((s) => (
                    <button
                      key={s}
                      onClick={() => updateTask(selectedTask.id, { status: s })}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedTask.status === s 
                          ? 'bg-foreground text-background border-foreground shadow-sm scale-[1.02]' 
                          : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {getStatusIcon(s)}
                      <span className="capitalize">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Assignee</p>
                <div className="relative group">
                  <select
                    value={selectedTask.assignee_id || ''}
                    onChange={(e) => updateTask(selectedTask.id, { assignee_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full appearance-none bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/10 transition-all cursor-pointer hover:bg-muted"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <UserPlus className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10">
              <p className="text-[10px] font-bold uppercase text-muted-foreground mb-3">Description</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/50">
                {selectedTask.description || "No description provided."}
              </p>
            </div>

            <div className="pt-6 border-t border-border mb-10">
              <button 
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="flex items-center gap-2 text-xs font-bold text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Move Task to Trash
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Complete Activity Log</p>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold">{(updates[selectedTask.id] || []).length} Updates</span>
              </div>
              <div className="space-y-6">
                {(updates[selectedTask.id] || []).map((update, idx) => (
                  <div key={update.id} className="relative pl-6">
                    {idx !== (updates[selectedTask.id]?.length - 1) && (
                      <div className="absolute left-[7px] top-4 bottom-[-24px] w-px bg-border" />
                    )}
                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-background bg-zinc-200 dark:bg-zinc-800" />
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{update.author_name}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(update.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {update.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Engineering Workspace</h1>
            <p className="text-muted-foreground text-sm mt-1">Categorized telephony and infrastructure management.</p>
          </div>
          <button 
            onClick={() => setIsAddingTask(true)}
            className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Request
          </button>
        </div>

        {/* Environment Filter Tabs */}
        <div className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedEnvId('all')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all relative ${
              selectedEnvId === 'all' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Platforms
            {selectedEnvId === 'all' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground animate-in fade-in duration-300" />}
          </button>
          {envs.map(env => (
            <button
              key={env.id}
              onClick={() => setSelectedEnvId(env.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${
                selectedEnvId === env.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {env.name}
              {selectedEnvId === env.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground animate-in fade-in duration-300" />}
            </button>
          ))}
        </div>
      </div>

      {isAddingTask && (
        <div className="mb-8 p-6 bg-card border border-border rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreateTask} className="space-y-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Request Title"
                className="w-full bg-transparent text-xl font-semibold focus:outline-none placeholder:opacity-30"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Describe the technical requirement..."
                className="w-full bg-transparent text-sm min-h-[80px] focus:outline-none resize-none placeholder:opacity-30"
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Platform Environment</label>
                <select 
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  value={newTask.environment_id}
                  onChange={e => setNewTask({ ...newTask, environment_id: Number(e.target.value) })}
                  required
                >
                  <option value="0">Select Environment...</option>
                  {envs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Initial Assignee</label>
                <select 
                  className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
                  value={newTask.assignee_id || ''}
                  onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Leave Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAddingTask(false)} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors">Cancel</button>
              <button type="submit" className="bg-foreground text-background px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90">Create Request</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
            <p className="text-muted-foreground text-sm italic">No active tasks found in this category.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div 
              key={task.id} 
              className={`bg-card border transition-all duration-300 overflow-hidden ${
                expandedTaskId === task.id ? 'rounded-3xl border-ring/20 shadow-md' : 'rounded-2xl border-border hover:border-ring/30'
              }`}
            >
              <div onClick={() => toggleExpand(task.id)} className="p-5 flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-4 min-w-0">
                  {getStatusIcon(task.status)}
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm truncate group-hover:text-ring transition-colors">{task.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-bold text-muted-foreground">{getEnvName(task.environment_id)}</span>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(task.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                      task.assignee_id ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' : 'bg-orange-500/10 text-orange-600'
                    }`}>
                      {getAssigneeName(task.assignee_id)}
                    </div>
                  </div>
                  {expandedTaskId === task.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedTaskId === task.id && (
                <div className="px-5 pb-6 animate-in fade-in duration-500">
                  <div className="pl-6 border-l-2 border-muted ml-1 mb-6">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {task.description || "No description provided."}
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        Recent Updates
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedTask(task); }}
                        className="flex items-center gap-1 text-foreground hover:underline"
                      >
                        Full History & Actions <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(updates[task.id] || []).slice(0, 3).map(update => (
                        <div key={update.id} className="bg-muted/30 rounded-xl p-3 border border-border/30">
                          <p className="text-[10px] font-bold mb-1 opacity-70">{update.author_name}</p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{update.content}</p>
                        </div>
                      ))}
                      
                      <div className="relative pt-2">
                        <input
                          placeholder="Quick log update..."
                          className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring/20 focus:border-ring"
                          value={newUpdate}
                          onChange={e => setNewUpdate(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddUpdate(task.id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
