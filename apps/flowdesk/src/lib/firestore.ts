import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  query,
  getDoc,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { db } from './firebase';
import type { Task } from './types';
import type { FocusBlock } from './schedulingEngine';

// ── Settings ──────────────────────────────────────────────────────────────

export type Tier = 'free' | 'pro';

function parseTier(data: DocumentData | undefined): Tier {
  return data?.settings?.tier === 'pro' ? 'pro' : 'free';
}

export async function getSettings(userId: string): Promise<{ tier: Tier }> {
  const snap = await getDoc(doc(db, 'users', userId));
  return { tier: parseTier(snap.data()) };
}

// ── Tasks ──────────────────────────────────────────────────────────────────

export async function addTaskToFirestore(
  userId: string,
  task: Omit<Task, 'id'>,
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'tasks'), task);
  return ref.id;
}

export async function updateTaskInFirestore(
  userId: string,
  taskId: string,
  data: Partial<Task>,
): Promise<void> {
  await updateDoc(doc(db, 'users', userId, 'tasks', taskId), data as Record<string, unknown>);
}

export async function deleteTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'tasks', taskId));
}

export function useTasks(userId: string | null): { tasks: Task[]; loading: boolean } {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const q = query(collection(db, 'users', userId, 'tasks'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Task, 'id'>) })));
      setLoading(false);
    });
    return unsubscribe;
  }, [userId]);

  return { tasks, loading };
}

// ── Schedules ─────────────────────────────────────────────────────────────

interface StoredSchedule {
  date: string;
  blocks: Array<{
    startIso: string;
    endIso: string;
    taskId: string;
    taskTitle: string;
    type: string;
  }>;
  savedAt: ReturnType<typeof serverTimestamp>;
}

export async function saveScheduleToFirestore(
  userId: string,
  date: string,
  blocks: FocusBlock[],
): Promise<void> {
  const payload: StoredSchedule = {
    date,
    blocks: blocks.map((b) => ({
      startIso: b.start.toISOString(),
      endIso: b.end.toISOString(),
      taskId: b.task.id,
      taskTitle: b.task.title,
      type: b.type,
    })),
    savedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'users', userId, 'schedules', date), payload);
}

export function useSchedule(userId: string | null, date: string) {
  return useQuery({
    queryKey: ['schedule', userId, date],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const snap = await getDoc(doc(db, 'users', userId, 'schedules', date));
      return snap.exists() ? (snap.data() as StoredSchedule) : null;
    },
    staleTime: 60_000,
  });
}

// ── Sessions ──────────────────────────────────────────────────────────────

export interface SessionData {
  taskId: string;
  taskTitle: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  completed: boolean;
}

export async function saveSessionToFirestore(
  userId: string,
  session: SessionData,
): Promise<string> {
  const ref = await addDoc(collection(db, 'users', userId, 'sessions'), {
    ...session,
    savedAt: serverTimestamp(),
  });
  return ref.id;
}

export function useSaveSession(userId: string | null) {
  return useMutation({
    mutationFn: async (session: SessionData) => {
      if (!userId) throw new Error('Not authenticated');
      return saveSessionToFirestore(userId, session);
    },
  });
}

// ── Calendar Sync ─────────────────────────────────────────────────────────

export async function updateCalendarSyncAt(userId: string): Promise<void> {
  await setDoc(
    doc(db, 'users', userId),
    { calendarSync: { lastSyncAt: serverTimestamp() } },
    { merge: true },
  );
}

export async function getCalendarSyncAt(userId: string): Promise<Date | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  const lastSyncAt = snap.data()?.calendarSync?.lastSyncAt;
  if (!lastSyncAt) return null;
  return lastSyncAt.toDate ? lastSyncAt.toDate() : new Date(lastSyncAt);
}
