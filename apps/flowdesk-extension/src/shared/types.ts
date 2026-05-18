export interface ActiveSession {
  taskId: string;
  taskTitle: string;
  endsAt: number;
  blockedDomains: string[];
  overridesLeft: number;
  overrideExceptions: Array<{ domain: string; expiresAt: number }>;
}

export interface FlowdeskSettings {
  userId: string;
  focusMode: boolean;
  blockedSites: string[];
}

export interface StorageData {
  activeSession?: ActiveSession;
  flowdeskSettings?: FlowdeskSettings;
}
