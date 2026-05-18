import { isDemoMode } from './demo';
import {
  DEMO_VOICE_MEMO_TRANSCRIPTION,
  DEMO_SESSION,
} from '../data/demoContent';

export interface TranscribeResult {
  transcript: string;
}

export interface CoachingResult {
  coachingResponse: string;
  arcDirection: string;
  arcSummaryBullets: string[];
}

export interface TTSResult {
  audioUrl: string;
}

export function showDemoToast(message: string) {
  // Delegate to whatever toast library is available at the call site
  // Consumers import this and display it in their component context
  console.log('[Demo mode]', message);
}

export async function uploadAndTranscribeVoiceMemo(
  uid: string,
  sessionDate: string,
  audioUri: string
): Promise<TranscribeResult> {
  if (isDemoMode) {
    showDemoToast('Demo mode — transcript not saved');
    await simulateDelay(1200);
    return { transcript: DEMO_VOICE_MEMO_TRANSCRIPTION };
  }

  await uploadAudioToStorage(uid, sessionDate, audioUri);

  const { functions } = await import('./firebase');
  const { httpsCallable } = await import('firebase/functions');
  if (!functions) throw new Error('Functions not initialized');

  const fn = httpsCallable<{ uid: string; sessionDate: string }, TranscribeResult>(
    functions,
    'transcribeVoiceMemo'
  );
  const result = await fn({ uid, sessionDate });
  return result.data;
}

export async function generateTTSAudio(
  uid: string,
  sessionId: string,
  text: string,
  mentorId?: string
): Promise<TTSResult> {
  if (isDemoMode) {
    showDemoToast('Demo mode — audio not saved');
    await simulateDelay(800);
    return { audioUrl: '' };
  }

  const voiceMap: Record<string, string> = {
    alex_chen: 'onyx',
    maya_okafor: 'nova',
    james_navarro: 'echo',
  };
  const voiceId = mentorId ? (voiceMap[mentorId] ?? 'onyx') : 'onyx';

  const response = await fetch(`${FUNCTIONS_BASE_URL}/generateTTS`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, sessionId, text, voiceId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? 'TTS generation failed');
  }

  return response.json() as Promise<TTSResult>;
}

export async function pollForCoachingResponse(
  uid: string,
  sessionId: string,
  timeoutMs = 15000
): Promise<CoachingResult | null> {
  if (isDemoMode) {
    await simulateDelay(2000);
    return {
      coachingResponse: DEMO_SESSION.arcResponse,
      arcDirection: 'User is working on visibility and making their thought process legible to their manager.',
      arcSummaryBullets: [
        'Working on making private planning process visible to manager',
        'Small consistent signals matter more than big moments',
        'Moving from private planning to public impact',
      ],
    };
  }

  // Dynamic import to avoid loading firebase in demo mode
  const { db } = await import('./firebase');
  if (!db) return null;

  const { doc, onSnapshot } = await import('firebase/firestore');

  return new Promise((resolve) => {
    const sessionRef = doc(db, `users/${uid}/sessions/${sessionId}`);
    const deadline = Date.now() + timeoutMs;

    const unsubscribe = onSnapshot(sessionRef, (snap) => {
      const data = snap.data();
      if (data?.coachingResponse) {
        unsubscribe();
        resolve({
          coachingResponse: data.coachingResponse,
          arcDirection: data.arcDirection ?? '',
          arcSummaryBullets: data.arcSummaryBullets ?? [],
        });
      } else if (Date.now() > deadline) {
        unsubscribe();
        resolve(null);
      }
    });

    // Failsafe timeout
    setTimeout(() => {
      unsubscribe();
      resolve(null);
    }, timeoutMs + 1000);
  });
}

async function uploadAudioToStorage(
  uid: string,
  sessionDate: string,
  audioUri: string
): Promise<void> {
  const { storage } = await import('./firebase');
  const { ref, uploadBytes } = await import('firebase/storage');

  if (!storage) throw new Error('Storage not initialized');

  const storagePath = `users/${uid}/sessions/${sessionDate}/voice_memo.m4a`;
  const storageRef = ref(storage, storagePath);

  const response = await fetch(audioUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob, { contentType: 'audio/m4a' });
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
