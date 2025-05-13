
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Mic, MicOff, Volume, VolumeX } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import speechRecognition from '@/utils/speechRecognition';

const SpeechRecognitionController: React.FC = () => {
  const { addTranscriptEntry, isMuted, toggleMute } = useAppContext();
  const [listening, setListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [supported, setSupported] = useState<boolean>(true);
  
  // Initialize speech recognition
  useEffect(() => {
    // Check if speech recognition is supported
    const isSupported = speechRecognition.isSupported();
    setSupported(isSupported);
    
    // Set up transcript handler
    speechRecognition.onTranscript((text) => {
      if (!isMuted) {
        console.log("Final transcript received:", text);
        addTranscriptEntry({
          id: crypto.randomUUID(),
          text: text,
          timestamp: new Date()
        });
      }
    });
    
    // Set up interim transcript handler
    speechRecognition.onInterimTranscript((text) => {
      if (!isMuted) {
        setInterimTranscript(text);
      } else {
        setInterimTranscript('');
      }
    });
    
    // Check status every 2 seconds to ensure UI stays in sync
    const statusInterval = setInterval(() => {
      setListening(speechRecognition.isActive());
    }, 2000);
    
    return () => {
      // Cleanup
      clearInterval(statusInterval);
      if (listening) {
        speechRecognition.stop();
      }
    };
  }, [addTranscriptEntry, isMuted]);

  const handleStartListening = () => {
    const success = speechRecognition.start();
    if (success) {
      setListening(true);
      toast({
        title: "Listening started",
        description: "Speech recognition is now active"
      });
    } else {
      toast({
        title: "Failed to start speech recognition",
        description: "Please check your microphone permissions",
        variant: "destructive"
      });
    }
  };

  const handleStopListening = () => {
    speechRecognition.stop();
    setListening(false);
    setInterimTranscript('');
    toast({
      title: "Listening stopped",
      description: "Speech recognition has been paused"
    });
  };

  if (!supported) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Speech Recognition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-4">
            <p className="text-destructive">Browser doesn't support speech recognition</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please try using Chrome, Edge, or Safari
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Speech Recognition</span>
          {listening ? (
            <span className="flex items-center text-sm font-normal text-green-600">
              <Volume size={16} className="mr-1 animate-pulse" /> 
              Listening...
            </span>
          ) : (
            <span className="text-sm font-normal text-muted-foreground">Not listening</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {interimTranscript && (
            <div className="bg-muted/30 p-3 rounded-md italic text-sm">
              {interimTranscript}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {!listening ? (
              <Button 
                className="w-full" 
                onClick={handleStartListening}
              >
                <Mic size={16} className="mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={handleStopListening}
              >
                <MicOff size={16} className="mr-2" />
                Stop Recording
              </Button>
            )}
            
            <Button
              variant={isMuted ? "outline" : "secondary"}
              className="w-full"
              onClick={toggleMute}
            >
              {isMuted ? (
                <>
                  <VolumeX size={16} className="mr-2" />
                  Unmute Microphone
                </>
              ) : (
                <>
                  <Volume size={16} className="mr-2" />
                  Mute Microphone
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeechRecognitionController;
