import { useState } from 'react';
import { useStore } from '../lib/store';
import { isDemoMode } from '../lib/config';
import { TYPE_BADGE, TYPE_LABELS, type TaskType } from '../lib/types';

export default function TaskList() {
  const { tasks, addTask, removeTask, toggleTask, openPaywall } = useStore((s) => ({
    tasks: s.tasks,
    addTask: s.addTask,
    removeTask: s.removeTask,
    toggleTask: s.toggleTask,
    openPaywall: s.openPaywall,
  }));

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TaskType>('deep');
  const [newDuration, setNewDuration] = useState(25);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function handleAdd() {
    if (!newTitle.trim()) return;
    if (isDemoMode) {
      addTask({ title: newTitle.trim(), type: newType, durationMin: newDuration });
      if (!useStore.getState().paywallOpen) {
        showToast('Demo mode — not saved');
      }
    } else {
      addTask({ title: newTitle.trim(), type: newType, durationMin: newDuration });
    }
    setNewTitle('');
    setShowForm(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/60">
        <div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wide uppercase">Tasks</h2>
          <p className="text-xs text-slate-500 mt-0.5">{tasks.length} total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-8 h-8 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-600/40 text-teal-400 font-bold text-lg flex items-center justify-center transition-colors"
        >
          +
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-4 py-3 border-b border-slate-700/60 bg-navy-800/50 space-y-2 animate-fade-in">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Task title…"
            autoFocus
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-teal-600"
          />
          <div className="flex gap-2">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as TaskType)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-teal-600"
            >
              <option value="deep">Deep Work</option>
              <option value="meeting">Meeting</option>
              <option value="shallow">Shallow</option>
            </select>
            <select
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-teal-600"
            >
              <option value={25}>25 min</option>
              <option value={50}>50 min</option>
              <option value={90}>90 min</option>
            </select>
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-navy-900 font-bold text-xs rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {tasks.length === 0 && (
          <p className="text-slate-600 text-sm text-center py-8">No tasks yet. Add one above.</p>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-opacity ${
              task.done ? 'opacity-50' : ''
            } bg-slate-800/50 border-slate-700/50`}
          >
            <button
              onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                task.done
                  ? 'bg-teal-500 border-teal-500'
                  : 'border-slate-600 hover:border-teal-500'
              }`}
            />
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  task.done ? 'line-through text-slate-500' : 'text-slate-100'
                }`}
              >
                {task.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${TYPE_BADGE[task.type]}`}
                >
                  {TYPE_LABELS[task.type]}
                </span>
                <span className="text-xs text-slate-600">{task.durationMin}m</span>
              </div>
            </div>
            <button
              onClick={() => removeTask(task.id)}
              className="text-slate-600 hover:text-red-400 text-sm transition-colors flex-shrink-0"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Sync Linear CTA */}
      <div className="px-4 py-3 border-t border-slate-700/60">
        <button
          onClick={openPaywall}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 hover:border-teal-700/50 text-slate-400 hover:text-teal-400 text-xs font-semibold transition-colors"
        >
          <span>⟳</span> Sync Linear
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-16 left-4 right-4 bg-slate-700 text-slate-200 text-xs rounded-xl px-4 py-2.5 text-center shadow-lg animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
