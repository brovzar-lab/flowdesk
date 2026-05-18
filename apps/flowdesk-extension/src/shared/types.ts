export interface ActiveSession {
  taskId: string;
  taskTitle: string;
  endsAt: number;
  blockedDomains: string[];
  overridesLeft: number;
  overrideExceptions: Array<{ domain: string; expiresAt: number }>;
}

export interface StorageData {
  activeSession?: ActiveSession;
}
