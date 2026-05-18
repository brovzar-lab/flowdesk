import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export { transcribeVoiceMemo } from './transcribeVoiceMemo';
export { generateCoachingResponse } from './generateCoachingResponse';
export { generateTTS } from './generateTTS';
export { weeklySynthesis } from './weeklySynthesis';
