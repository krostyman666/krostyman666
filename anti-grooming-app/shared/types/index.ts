export type UserRole = 'parent' | 'child';

export interface Device {
  id: string;
  publicKey: string;
  role: UserRole;
  name: string;
  pairedAt: number;
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'keyword_detected' | 'location_suspicious' | 'contact_unknown' | 'app_installed';
  title: string;
  description: string;
  context?: string;
  evidence?: string;
  reviewed: boolean;
}

export interface MonitoringEvent {
  id: string;
  timestamp: number;
  type: 'message' | 'contact' | 'location' | 'app' | 'search' | 'notification';
  app: string;
  content?: string;
  sender?: string;
  recipient?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  metadata?: Record<string, any>;
}

export interface GroomingKeyword {
  term: string;
  category: 'isolation' | 'grooming' | 'sexual' | 'exploitation' | 'meeting' | 'money';
  severity: 'low' | 'medium' | 'high' | 'critical';
  pattern?: string;
  languages?: string[];
}

export interface EncryptedMessage {
  ciphertext: string;
  nonce: string;
  publicKey: string;
}

export interface PairingChallenge {
  deviceId: string;
  code: string;
  expiresAt: number;
  publicKey: string;
}
