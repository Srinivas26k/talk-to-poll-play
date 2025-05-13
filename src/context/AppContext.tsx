
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User, TranscriptEntry, PollQuestion, PollResponse, PollResult } from '@/types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  activeSession: Session | null;
  setActiveSession: React.Dispatch<React.SetStateAction<Session | null>>;
  transcriptEntries: TranscriptEntry[];
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  activePolls: PollQuestion[];
  addPoll: (poll: PollQuestion) => void;
  pollResponses: PollResponse[];
  addPollResponse: (response: PollResponse) => void;
  pollResults: Record<string, PollResult>;
  generatePollResults: (questionId: string) => void;
  joinSession: (accessCode: string, userName: string) => void;
  createSession: (title: string, settings: Session['settings']) => void;
  endSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [activePolls, setActivePolls] = useState<PollQuestion[]>([]);
  const [pollResponses, setPollResponses] = useState<PollResponse[]>([]);
  const [pollResults, setPollResults] = useState<Record<string, PollResult>>({});

  const addTranscriptEntry = (entry: TranscriptEntry) => {
    setTranscriptEntries((prev) => [...prev, entry]);
  };

  const addPoll = (poll: PollQuestion) => {
    setActivePolls((prev) => [...prev, poll]);
  };

  const addPollResponse = (response: PollResponse) => {
    setPollResponses((prev) => [...prev, response]);
  };

  const generatePollResults = (questionId: string) => {
    const question = activePolls.find((p) => p.id === questionId);
    
    if (!question) return;
    
    const responses = pollResponses.filter((r) => r.questionId === questionId);
    const optionCounts = question.options.map((_, index) => {
      return {
        option: index,
        count: responses.filter((r) => r.selectedOption === index).length
      };
    });

    const result: PollResult = {
      questionId,
      options: question.options,
      responses: optionCounts,
      totalResponses: responses.length
    };

    setPollResults((prev) => ({
      ...prev,
      [questionId]: result
    }));
  };

  const joinSession = (accessCode: string, userName: string) => {
    // In a real app, this would verify the access code with the backend
    // For demo purposes, we'll create a mock session
    if (accessCode) {
      const userId = `participant-${Date.now()}`;
      setCurrentUser({
        id: userId,
        name: userName,
        role: 'participant'
      });

      const mockSession: Session = {
        id: `session-${accessCode}`,
        title: "Demo Session",
        hostId: "host-1",
        accessCode,
        status: 'active',
        settings: {
          pollFrequency: 5,
          saveTranscript: true,
          participantNames: true,
          autoPublishResults: false
        },
        createdAt: new Date()
      };
      
      setActiveSession(mockSession);
    }
  };

  const createSession = (title: string, settings: Session['settings']) => {
    // Generate a random 6-digit access code
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hostId = `host-${Date.now()}`;
    
    setCurrentUser({
      id: hostId,
      name: 'Session Host',
      role: 'host'
    });

    const newSession: Session = {
      id: `session-${Date.now()}`,
      title,
      hostId,
      accessCode,
      status: 'active',
      settings,
      createdAt: new Date()
    };

    setActiveSession(newSession);
  };

  const endSession = () => {
    if (activeSession) {
      setActiveSession({
        ...activeSession,
        status: 'completed'
      });
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // If we had real-time connections, we'd close them here
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeSession,
        setActiveSession,
        transcriptEntries,
        addTranscriptEntry,
        activePolls,
        addPoll,
        pollResponses,
        addPollResponse,
        pollResults,
        generatePollResults,
        joinSession,
        createSession,
        endSession
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
}
