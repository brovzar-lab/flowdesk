import express from 'express';
import cors from 'cors';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import planRouter from './routes/plan';

const PORT = process.env['PORT'] ?? 3001;
const ALLOWED_ORIGINS = process.env['ALLOWED_ORIGINS'] ?? '*';

function initFirebase(): void {
  if (getApps().length > 0) return;

  const serviceAccountJson = process.env['FIREBASE_SERVICE_ACCOUNT_JSON'];
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is required');
  }

  const serviceAccount = JSON.parse(serviceAccountJson) as object;
  initializeApp({ credential: cert(serviceAccount) });
}

initFirebase();

const app = express();

const corsOrigins: string | string[] =
  ALLOWED_ORIGINS === '*' ? '*' : ALLOWED_ORIGINS.split(',').map((s) => s.trim());

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/plan', planRouter);

app.listen(PORT, () => {
  console.log(`flowdesk-planner listening on port ${PORT}`);
});
