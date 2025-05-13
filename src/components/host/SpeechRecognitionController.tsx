
import React, { useEffect, useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Mic, MicOff, Volume } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

const SpeechRecognitionController: React.FC = () => {
  const { addTranscriptEntry } = useAppContext();
  const [lastProcessedIndex, setLastProcessedIndex] = useState<number>(0);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    interimTranscript,
    finalTranscript
  } = useSpeechRecognition();

  // Process new transcript segments
  useEffect(() => {
    if (finalTranscript && finalTranscript.trim() !== '') {
      addTranscriptEntry({
        id: `transcript-${Date.now()}`,
        text: finalTranscript,
        timestamp: new Date()
      });
      resetTranscript();
    }
  }, [finalTranscript, addTranscriptEntry, resetTranscript]);

  const handleStartListening = () => {
    SpeechRecognition.startListening({ 
      continuous: true,
      interimResults: true
    })
      .then(() => {
        toast.success('Listening started');
      })
      .catch((error) => {
        toast.error(`Error starting speech recognition: ${error.message}`);
      });
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
    toast.info('Listening stopped');
  };

  if (!browserSupportsSpeechRecognition) {
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
          
          <div className="flex gap-2">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeechRecognitionController;
