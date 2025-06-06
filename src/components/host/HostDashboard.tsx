
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Clock, Users, BarChart, FileDown, LogOut } from 'lucide-react';
import TranscriptView from '../shared/TranscriptView';
import ActivePollsList from './ActivePollsList';
import PollResultsView from './PollResultsView';
import SessionInfo from './SessionInfo';
import ApiKeyConfig from './ApiKeyConfig';
import SpeechRecognitionController from './SpeechRecognitionController';

const HostDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    activeSession, 
    transcriptEntries, 
    endSession,
    leaveSession,
    activePolls,
    pollResults,
    participants
  } = useAppContext();
  
  const [sessionTime, setSessionTime] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');
  const [isApiConfigured, setIsApiConfigured] = useState(false);
  
  // Track session time
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Format session time
  const formatSessionTime = () => {
    const minutes = Math.floor(sessionTime / 60);
    const seconds = sessionTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEndSession = async () => {
    const success = await endSession();
    if (success) {
      toast({
        title: "Session Ended",
        description: "The session has been ended successfully"
      });
    }
  };

  const handleLeaveSession = async () => {
    const success = await leaveSession();
    if (success) {
      navigate('/');
    }
  };

  const downloadTranscript = () => {
    const content = transcriptEntries.map(entry => 
      `[${entry.timestamp.toLocaleTimeString()}] ${entry.text}`
    ).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${activeSession?.title}-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Transcript Downloaded",
      description: "Transcript has been saved to your device"
    });
  };

  const handleApiConfigured = () => {
    setIsApiConfigured(true);
  };

  if (!activeSession) {
    return <div>No active session</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col gap-6">
        {/* Session header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{activeSession.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock size={14} />
                {formatSessionTime()}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users size={14} />
                {participants.length} participants
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart size={14} />
                {activePolls.length} polls
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={downloadTranscript}
              disabled={transcriptEntries.length === 0}
            >
              <FileDown size={16} />
              Download Transcript
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEndSession}
            >
              End Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLeaveSession}
            >
              <LogOut size={16} className="mr-1" />
              Leave Session
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="md:col-span-1 space-y-6">
            <SessionInfo session={activeSession} />
            <SpeechRecognitionController />
            {!isApiConfigured && <ApiKeyConfig onConfigured={handleApiConfigured} />}
          </div>

          {/* Main content area */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="polls">
                      Active Polls
                      {activePolls.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{activePolls.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="results">
                      Results
                      {Object.keys(pollResults).length > 0 && (
                        <Badge variant="secondary" className="ml-2">{Object.keys(pollResults).length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                
                  <CardContent className="pt-2">
                    <TabsContent value="transcript" className="m-0">
                      <TranscriptView entries={transcriptEntries} />
                    </TabsContent>
                    <TabsContent value="polls" className="m-0">
                      <ActivePollsList />
                    </TabsContent>
                    <TabsContent value="results" className="m-0">
                      <PollResultsView />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
