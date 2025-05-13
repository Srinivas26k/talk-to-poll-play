
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User, TranscriptEntry, PollQuestion, PollResponse, PollResult } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

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
  joinSession: (accessCode: string, userName: string) => Promise<boolean>;
  createSession: (title: string, settings: Session['settings']) => Promise<boolean>;
  endSession: () => Promise<boolean>;
  leaveSession: () => Promise<boolean>;
  participants: User[];
  generatePoll: () => Promise<boolean>;
  saveApiKey: (apiKey: string) => void;
  openAiApiKey: string | null;
  isMuted: boolean;
  toggleMute: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [activePolls, setActivePolls] = useState<PollQuestion[]>([]);
  const [pollResponses, setPollResponses] = useState<PollResponse[]>([]);
  const [pollResults, setPollResults] = useState<Record<string, PollResult>>({});
  const [participants, setParticipants] = useState<User[]>([]);
  const [openAiApiKey, setOpenAiApiKey] = useState<string | null>(
    localStorage.getItem('openrouter_api_key')
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Toggle mute state function
  const toggleMute = () => {
    setIsMuted(prevState => !prevState);
  };

  // Setup real-time listeners when session is active
  useEffect(() => {
    if (!activeSession) return;

    // Real-time transcription updates
    const transcriptChannel = supabase
      .channel('transcriptions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transcriptions',
          filter: `session_id=eq.${activeSession.id}`
        },
        (payload) => {
          const newTranscript: TranscriptEntry = {
            id: payload.new.id as string,
            text: payload.new.text as string,
            timestamp: new Date(payload.new.created_at as string)
          };
          
          setTranscriptEntries(prev => [...prev, newTranscript]);
        }
      )
      .subscribe();

    // Real-time poll updates
    const pollsChannel = supabase
      .channel('polls-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'polls',
          filter: `session_id=eq.${activeSession.id}`
        },
        (payload) => {
          let options: string[];
          
          if (Array.isArray(payload.new.options)) {
            options = payload.new.options as string[];
          } else if (typeof payload.new.options === 'string') {
            try {
              options = JSON.parse(payload.new.options);
            } catch (e) {
              options = ["Option 1", "Option 2"];
              console.error("Failed to parse poll options:", e);
            }
          } else {
            // If it's an object, try to convert it
            try {
              options = Object.values(payload.new.options as Record<string, string>);
            } catch (e) {
              options = ["Option 1", "Option 2"];
              console.error("Failed to convert poll options:", e);
            }
          }
          
          const newPoll: PollQuestion = {
            id: payload.new.id as string,
            question: payload.new.question as string,
            options: options,
            generatedFrom: '',
            createdAt: new Date(payload.new.created_at as string)
          };
          
          setActivePolls(prev => [...prev, newPoll]);
          
          if (currentUser?.role === 'participant') {
            toast({
              title: "New Poll Available",
              description: "A new poll has been created. Check it out!"
            });
          }
        }
      )
      .subscribe();
      
    // Real-time participant updates
    const participantsChannel = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public', 
          table: 'participants',
          filter: `session_id=eq.${activeSession.id}`
        },
        () => {
          // Update participants list on any change
          fetchParticipants();
        }
      )
      .subscribe();
      
    // Real-time poll answer updates
    const pollAnswersChannel = supabase
      .channel('poll-answers-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'poll_answers'
        },
        (payload) => {
          const pollId = payload.new.poll_id as string;
          const participantId = payload.new.participant_id as string;
          const answer = payload.new.answer as string;
          
          // Find the poll
          const poll = activePolls.find(p => p.id === pollId);
          if (!poll) return;
          
          // Find the option index
          const optionIndex = poll.options.findIndex(opt => opt === answer);
          if (optionIndex === -1) return;
          
          // Add to poll responses
          const newResponse: PollResponse = {
            questionId: pollId,
            participantId: participantId,
            selectedOption: optionIndex,
            timestamp: new Date(payload.new.created_at as string)
          };
          
          setPollResponses(prev => [...prev, newResponse]);
          
          // Update results if this poll has results published
          if (pollId in pollResults) {
            generatePollResults(pollId);
          }
        }
      )
      .subscribe();

    // Fetch initial data
    fetchTranscriptions();
    fetchPolls();
    fetchParticipants();
    fetchPollAnswers();
    
    // Cleanup function
    return () => {
      supabase.removeChannel(transcriptChannel);
      supabase.removeChannel(pollsChannel);
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(pollAnswersChannel);
    };
  }, [activeSession]);

  // Fetch initial data from Supabase
  const fetchTranscriptions = async () => {
    if (!activeSession) return;
    
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('session_id', activeSession.id)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching transcriptions:', error);
      return;
    }
    
    const entries: TranscriptEntry[] = data.map(item => ({
      id: item.id,
      text: item.text,
      timestamp: new Date(item.created_at as string)
    }));
    
    setTranscriptEntries(entries);
  };
  
  const fetchPolls = async () => {
    if (!activeSession) return;
    
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('session_id', activeSession.id)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error('Error fetching polls:', error);
      return;
    }
    
    const polls: PollQuestion[] = data.map(item => {
      let options: string[];
      
      if (Array.isArray(item.options)) {
        options = item.options as string[];
      } else if (typeof item.options === 'string') {
        try {
          options = JSON.parse(item.options);
        } catch (e) {
          options = ["Option 1", "Option 2"];
          console.error("Failed to parse poll options:", e);
        }
      } else {
        // If it's an object, try to convert it
        try {
          options = Object.values(item.options as Record<string, string>);
        } catch (e) {
          options = ["Option 1", "Option 2"];
          console.error("Failed to convert poll options:", e);
        }
      }
        
      return {
        id: item.id,
        question: item.question,
        options: options,
        generatedFrom: '',
        createdAt: new Date(item.created_at as string)
      };
    });
    
    setActivePolls(polls);
  };
  
  const fetchParticipants = async () => {
    if (!activeSession) return;
    
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('session_id', activeSession.id);
      
    if (error) {
      console.error('Error fetching participants:', error);
      return;
    }
    
    const participantsList: User[] = data.map(item => ({
      id: item.id,
      name: item.username,
      role: 'participant'
    }));
    
    setParticipants(participantsList);
  };
  
  const fetchPollAnswers = async () => {
    if (!activeSession) return;
    
    const { data, error } = await supabase
      .from('poll_answers')
      .select('*')
      .eq('session_id', activeSession.id);
      
    if (error) {
      console.error('Error fetching poll answers:', error);
      return;
    }
    
    // Process poll answers
    const answers: PollResponse[] = [];
    
    for (const item of data) {
      const poll = activePolls.find(p => p.id === item.poll_id);
      if (!poll) continue;
      
      const optionIndex = poll.options.findIndex(opt => opt === item.answer);
      if (optionIndex === -1) continue;
      
      answers.push({
        questionId: item.poll_id,
        participantId: item.participant_id,
        selectedOption: optionIndex,
        timestamp: new Date(item.created_at as string)
      });
    }
    
    setPollResponses(answers);
  };

  const addTranscriptEntry = async (entry: TranscriptEntry) => {
    setTranscriptEntries((prev) => [...prev, entry]);
    
    if (activeSession) {
      // Save transcript to Supabase
      const { error } = await supabase
        .from('transcriptions')
        .insert([{
          id: entry.id,
          text: entry.text,
          session_id: activeSession.id,
          created_at: entry.timestamp.toISOString()
        }]);
        
      if (error) {
        console.error('Error saving transcript:', error);
      }
    }
  };

  const addPoll = async (poll: PollQuestion) => {
    setActivePolls((prev) => [...prev, poll]);
    
    if (activeSession) {
      // Save poll to Supabase
      const { error } = await supabase
        .from('polls')
        .insert([{
          id: poll.id,
          question: poll.question,
          options: poll.options,
          session_id: activeSession.id,
          created_at: poll.createdAt.toISOString()
        }]);
        
      if (error) {
        console.error('Error saving poll:', error);
      }
    }
  };

  const addPollResponse = async (response: PollResponse) => {
    setPollResponses((prev) => [...prev, response]);
    
    if (activeSession && currentUser) {
      const poll = activePolls.find(p => p.id === response.questionId);
      if (!poll) return;
      
      // Save response to Supabase
      const { error } = await supabase
        .from('poll_answers')
        .insert([{
          poll_id: response.questionId,
          participant_id: response.participantId,
          answer: poll.options[response.selectedOption],
          created_at: response.timestamp.toISOString(),
          session_id: activeSession.id
        }]);
        
      if (error) {
        console.error('Error saving poll response:', error);
      }
    }
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
    
    // Update poll publish status in Supabase
    if (activeSession) {
      supabase
        .from('polls')
        .update({ published: true })
        .eq('id', questionId)
        .then(({ error }) => {
          if (error) {
            console.error('Error publishing poll results:', error);
          }
        });
    }
  };

  const joinSession = async (accessCode: string, userName: string) => {
    try {
      // Find session with this access code
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_code', accessCode)
        .eq('active', true)
        .single();
        
      if (sessionError || !sessionData) {
        toast({
          title: "Session not found",
          description: "Please check the access code and try again",
          variant: "destructive"
        });
        return false;
      }
      
      // Create participant
      const participantId = crypto.randomUUID();
      const { data: participantData, error: participantError } = await supabase
        .from('participants')
        .insert([{
          id: participantId,
          username: userName,
          session_id: sessionData.id
        }])
        .select()
        .single();
        
      if (participantError) {
        console.error('Error creating participant:', participantError);
        toast({
          title: "Failed to join session",
          description: "An error occurred while joining the session",
          variant: "destructive"
        });
        return false;
      }
      
      // Set user and session in state
      setCurrentUser({
        id: participantData.id,
        name: userName,
        role: 'participant'
      });
      
      setActiveSession({
        id: sessionData.id,
        title: sessionData.title || "Untitled Session",
        hostId: sessionData.host_id,
        accessCode: sessionData.session_code,
        status: sessionData.active ? 'active' : 'completed',
        settings: {
          pollFrequency: sessionData.quiz_interval || 5,
          saveTranscript: true,
          participantNames: true,
          autoPublishResults: false
        },
        createdAt: new Date(sessionData.created_at as string)
      });
      
      toast({
        title: "Session joined",
        description: `You have joined ${sessionData.title || "the session"}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: "Failed to join session",
        description: "An error occurred while joining the session",
        variant: "destructive"
      });
      return false;
    }
  };

  const createSession = async (title: string, settings: Session['settings']) => {
    try {
      // Generate a random 6-digit access code
      const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
      const hostId = crypto.randomUUID();
      
      // Create session in Supabase
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([{
          title,
          host_id: hostId,
          session_code: accessCode,
          quiz_interval: settings.pollFrequency,
          active: true
        }])
        .select()
        .single();
        
      if (sessionError) {
        console.error('Error creating session:', sessionError);
        toast({
          title: "Failed to create session",
          description: "An error occurred while creating the session",
          variant: "destructive"
        });
        return false;
      }
      
      // Set user and session state
      setCurrentUser({
        id: hostId,
        name: 'Session Host',
        role: 'host'
      });

      setActiveSession({
        id: sessionData.id,
        title,
        hostId,
        accessCode,
        status: 'active',
        settings,
        createdAt: new Date(sessionData.created_at as string)
      });
      
      // Automatically schedule the first poll if API key is available
      if (openAiApiKey) {
        setTimeout(() => {
          generatePoll().catch(console.error);
        }, 60000 * settings.pollFrequency);
      }
      
      toast({
        title: "Session created",
        description: `Your session "${title}" has been created with code: ${accessCode}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Failed to create session",
        description: "An error occurred while creating the session",
        variant: "destructive"
      });
      return false;
    }
  };

  const endSession = async () => {
    if (activeSession) {
      try {
        // Update session status in Supabase
        const { error } = await supabase
          .from('sessions')
          .update({ active: false })
          .eq('id', activeSession.id);
          
        if (error) {
          console.error('Error ending session:', error);
          toast({
            title: "Failed to end session",
            description: "An error occurred while ending the session",
            variant: "destructive"
          });
          return false;
        }
        
        setActiveSession({
          ...activeSession,
          status: 'completed'
        });
        
        toast({
          title: "Session ended",
          description: "The session has been ended successfully"
        });
        
        return true;
      } catch (error) {
        console.error('Error ending session:', error);
        toast({
          title: "Failed to end session",
          description: "An error occurred while ending the session",
          variant: "destructive"
        });
        return false;
      }
    }
    return false;
  };
  
  const leaveSession = async () => {
    if (!activeSession || !currentUser) return false;
    
    try {
      // If participant, remove from participants list
      if (currentUser.role === 'participant') {
        const { error } = await supabase
          .from('participants')
          .delete()
          .eq('id', currentUser.id);
          
        if (error) {
          console.error('Error leaving session:', error);
          toast({
            title: "Failed to leave session",
            description: "An error occurred while leaving the session",
            variant: "destructive"
          });
          return false;
        }
      }
      
      // Reset state
      setActiveSession(null);
      setCurrentUser(null);
      setTranscriptEntries([]);
      setActivePolls([]);
      setPollResponses([]);
      setPollResults({});
      setParticipants([]);
      
      toast({
        title: "Session left",
        description: "You have left the session successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error leaving session:', error);
      toast({
        title: "Failed to leave session",
        description: "An error occurred while leaving the session",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const generatePoll = async () => {
    if (!activeSession || !openAiApiKey) {
      toast({
        title: "Cannot generate poll",
        description: "Missing session or API key",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      const response = await fetch('https://hcfbtbunlqznieubakyf.supabase.co/functions/v1/generate-poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (await supabase.auth.getSession())?.data?.session?.access_token || ''
        },
        body: JSON.stringify({
          session_id: activeSession.id,
          api_key: openAiApiKey,
          minutes: activeSession.settings.pollFrequency
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error from generate-poll function:', errorData);
        toast({
          title: "Failed to generate poll",
          description: errorData.error || "An error occurred",
          variant: "destructive"
        });
        return false;
      }
      
      const data = await response.json();
      
      toast({
        title: "Poll generated",
        description: "A new poll has been created"
      });
      
      // Schedule next poll
      if (activeSession.status === 'active') {
        setTimeout(() => {
          generatePoll().catch(console.error);
        }, 60000 * activeSession.settings.pollFrequency);
      }
      
      return true;
    } catch (error) {
      console.error('Error generating poll:', error);
      toast({
        title: "Failed to generate poll",
        description: "An error occurred while generating the poll",
        variant: "destructive"
      });
      return false;
    }
  };
  
  const saveApiKey = (apiKey: string) => {
    localStorage.setItem('openrouter_api_key', apiKey);
    setOpenAiApiKey(apiKey);
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
        endSession,
        leaveSession,
        participants,
        generatePoll,
        saveApiKey,
        openAiApiKey,
        isMuted,
        toggleMute
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
