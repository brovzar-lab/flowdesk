'use client';

import { useState } from 'react';
import type { Task } from '@/lib/types';

type Props = {
  task: Task | null;
  position: 1 | 2 | 3;
  onSave: (title: string, note: string) => Promise<void>;
  onStatusChange: (taskId: string, status: Task['status']) => Promise<void>;
  onFocus: (task: Task) => void;
};

export default function TaskCard({
  task,
  position,
  onSave,
  onStatusChange,
  onFocus,
}: Props): React.JSX.Element {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [saving, setSaving] = useState(false);

  const positionLabel = ['1st', '2nd', '3rd'][position - 1];
  const isDone = task?.status === 'done';

  async function handleSave(): Promise<void> {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(title.trim(), note.trim());
    setSaving(false);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSave();
    }
    if (e.key === 'Escape') {
      setEditing(false);
      setTitle(task?.title ?? '');
      setNote(task?.note ?? '');
    }
  }

  if (editing || !task) {
    return (
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
            MIT #{position}
          </span>
        </div>
        <input
          autoFocus
          type="text"
          placeholder={`Your ${positionLabel} most important task…`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-base font-medium bg-transparent outline-none
                     placeholder-slate-300 text-slate-900"
        />
        <textarea
          rows={2}
          placeholder="Add a note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm bg-transparent outline-none resize-none
                     placeholder-slate-300 text-slate-500"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => {
              setEditing(false);
              setTitle(task?.title ?? '');
              setNote(task?.note ?? '');
            }}
            className="btn-ghost text-sm py-1.5"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={!title.trim() || saving}
            className="btn-primary text-sm py-1.5"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card flex items-start gap-3 cursor-pointer group
        ${isDone ? 'opacity-60' : ''}`}
    >
      {/* Checkmark */}
      <button
        onClick={() => void onStatusChange(task.id, isDone ? 'todo' : 'done')}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
          transition-colors ${isDone
            ? 'bg-primary-500 border-primary-500 text-white'
            : 'border-slate-300 hover:border-primary-400'}`}
        aria-label={isDone ? 'Mark incomplete' : 'Mark done'}
      >
        {isDone && (
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3 h-3">
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={() => !isDone && setEditing(true)}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
            MIT #{position}
          </span>
        </div>
        <p className={`font-medium text-slate-900 ${isDone ? 'line-through' : ''}`}>
          {task.title}
        </p>
        {task.note && (
          <p className="text-sm text-slate-400 mt-0.5 truncate">{task.note}</p>
        )}
      </div>

      {/* Focus button */}
      {!isDone && (
        <button
          onClick={() => onFocus(task)}
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-primary-500
                     hover:bg-primary-50 transition-colors"
          aria-label="Start focus session"
          title="Focus on this task"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </button>
      )}
    </div>
  );
}
