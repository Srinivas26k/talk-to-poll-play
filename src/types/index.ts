
export interface User {
  id: string;
  name: string;
  role: 'host' | 'participant';
}

export interface Session {
  id: string;
  title: string;
  hostId: string;
  accessCode: string;
  status: 'pending' | 'active' | 'completed';
  settings: SessionSettings;
  createdAt: Date;
}

export interface SessionSettings {
  pollFrequency: number; // in minutes
  saveTranscript: boolean;
  participantNames: boolean; // whether participants need to provide names
  autoPublishResults: boolean;
}

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: Date;
}

export interface PollQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption?: number; // For quiz mode
  generatedFrom: string; // Part of transcript used to generate
  createdAt: Date;
}

export interface PollResponse {
  questionId: string;
  participantId: string;
  selectedOption: number;
  timestamp: Date;
}

export interface PollResult {
  questionId: string;
  options: string[];
  responses: { option: number; count: number }[];
  totalResponses: number;
}
