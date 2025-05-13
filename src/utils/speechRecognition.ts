
// Define the missing TypeScript types for the Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

// Add the Web Speech API to the Window interface
interface Window {
  SpeechRecognition: new () => SpeechRecognition;
  webkitSpeechRecognition: new () => SpeechRecognition;
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((text: string) => void) | null = null;
  private interimTranscript: string = '';
  private finalTranscript: string = '';

  constructor() {
    this.initializeRecognition();
  }

  private initializeRecognition() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      try {
        // Use the browser implementation
        const SpeechRecognitionImpl = (window as any).SpeechRecognition || 
                                     (window as any).webkitSpeechRecognition;
        
        if (SpeechRecognitionImpl) {
          this.recognition = new SpeechRecognitionImpl();
          
          // Configure recognition
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';

          // Set up callbacks
          this.recognition.onresult = this.handleRecognitionResult.bind(this);
          this.recognition.onerror = this.handleRecognitionError.bind(this);
          this.recognition.onend = this.handleRecognitionEnd.bind(this);
          this.recognition.onstart = () => {
            this.isListening = true;
          };
        }
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
      }
    }
  }

  private handleRecognitionResult(event: SpeechRecognitionEvent) {
    this.interimTranscript = '';
    this.finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        this.finalTranscript += transcript;
      } else {
        this.interimTranscript += transcript;
      }
    }

    // If we have final text, send it to the callback
    if (this.finalTranscript && this.onTranscriptCallback) {
      this.onTranscriptCallback(this.finalTranscript);
      this.finalTranscript = '';
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent) {
    console.error('Speech Recognition Error:', event.error);
    
    // Try to restart recognition on some errors
    if (event.error !== 'no-speech' && this.isListening) {
      this.stop();
      setTimeout(() => {
        if (this.isListening) {
          this.start();
        }
      }, 1000);
    }
  }

  private handleRecognitionEnd() {
    // Auto restart if we're supposed to be listening
    if (this.isListening && this.recognition) {
      try {
        this.recognition.start();
      } catch (error) {
        console.error('Error restarting speech recognition:', error);
        this.isListening = false;
      }
    }
  }

  public start() {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  public stop() {
    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  public onTranscript(callback: (text: string) => void) {
    this.onTranscriptCallback = callback;
  }

  public isSupported(): boolean {
    return !!(typeof window !== 'undefined' && 
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }

  public getInterimTranscript(): string {
    return this.interimTranscript;
  }
}

// Export a singleton instance
const speechRecognition = new SpeechRecognitionService();
export default speechRecognition;
