import type { Voice } from '../types';

export const AVAILABLE_VOICES: Voice[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Calm & Collected' },
  { id: '29vD33N1CtxCmqQRPOHJ', name: 'Drew', description: 'Well-Rounded' },
  { id: '2EiwWnXFnvU5JabPnv8n', name: 'Clyde', description: 'War Veteran' },
  { id: '5Q0t7uMcjvnagumLfvZi', name: 'Paul', description: 'Ground Reporter' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', description: 'Strong' },
  { id: 'CYw3kZ02Hs0563khs1Fj', name: 'Dave', description: 'British Conversational' },
  { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', description: 'Sailor' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Soft' },
];

export const DEFAULT_VOICE_ID = AVAILABLE_VOICES[0].id;
