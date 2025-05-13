
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { Clock, Users, BarChart, Mic, MicOff, FileDown } from 'lucide-react';
import speechRecognition from '@/utils/speechRecognition';
import TranscriptView from '../shared/TranscriptView';
import ActivePollsList from './ActivePollsList';
import PollResultsView from './PollResultsView';
import SessionInfo from './SessionInfo';

const HostDashboard: React.FC = () => {
  const { 
    activeSession, 
    transcriptEntries, 
    addTranscriptEntry, 
    endSession,
    activePolls,
    pollResults
  } = useAppContext();
  
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [activeTab, setActiveTab] = useState('transcript');
  
  // Start/stop speech recognition
  const toggleRecording = () => {
    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
      toast.info('Recording stopped');
    } else {
      const success = speechRecognition.start();
      if (success) {
        setIsRecording(true);
        toast.success('Recording started');
      } else {
        toast.error('Could not start recording. Check browser permissions.');
      }
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (!speechRecognition.isSupported()) {
      toast.error('Speech recognition is not supported in this browser');
    }
    
    speechRecognition.onTranscript((text) => {
      addTranscriptEntry({
        id: `transcript-${Date.now()}`,
        text,
        timestamp: new Date()
      });
    });

    // Clean up on unmount
    return () => {
      if (isRecording) {
        speechRecognition.stop();
      }
    };
  }, [addTranscriptEntry]);

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

  const handleEndSession = () => {
    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    }
    endSession();
    toast.info('Session ended');
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
    
    toast.success('Transcript downloaded');
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
                0 participants
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart size={14} />
                {activePolls.length} polls
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              className="flex items-center gap-2"
              onClick={toggleRecording}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Session info card */}
          <div className="md:col-span-1">
            <SessionInfo session={activeSession} />
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
                </Tabs>
              </CardHeader>
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostDashboard;
