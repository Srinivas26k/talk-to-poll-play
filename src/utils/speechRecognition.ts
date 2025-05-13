
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
  private onInterimTranscriptCallback: ((text: string) => void) | null = null;
  private interimTranscript: string = '';
  private finalTranscript: string = '';
  private lastRestartTime: number = 0;
  private maxRestartFrequency: number = 500; // ms between restarts
  private restartTimeout: number | null = null;
  
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
          
          // Configure recognition with more robust settings
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';

          // Set up callbacks
          this.recognition.onresult = this.handleRecognitionResult.bind(this);
          this.recognition.onerror = this.handleRecognitionError.bind(this);
          this.recognition.onend = this.handleRecognitionEnd.bind(this);
          this.recognition.onstart = () => {
            console.log("Speech recognition started");
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
    
    // Always send interim transcript updates
    if (this.onInterimTranscriptCallback) {
      this.onInterimTranscriptCallback(this.interimTranscript);
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent) {
    console.error('Speech Recognition Error:', event.error, event.message);
    
    // Don't restart on these errors
    if (event.error === 'not-allowed' || event.error === 'audio-capture') {
      this.isListening = false;
      return;
    }
    
    // For other errors, try to restart after delay
    if (this.isListening) {
      this.scheduleRestart();
    }
  }

  private handleRecognitionEnd() {
    console.log("Speech recognition ended");
    // Auto restart if we're supposed to be listening
    if (this.isListening && this.recognition) {
      this.scheduleRestart();
    }
  }
  
  private scheduleRestart() {
    // Clear any existing restart timeout
    if (this.restartTimeout !== null) {
      clearTimeout(this.restartTimeout);
    }
    
    const now = Date.now();
    const timeSinceLastRestart = now - this.lastRestartTime;
    
    // If we've restarted very recently, add some delay to avoid rapid restarts
    const delay = timeSinceLastRestart < this.maxRestartFrequency 
      ? this.maxRestartFrequency - timeSinceLastRestart
      : 100;
    
    this.restartTimeout = window.setTimeout(() => {
      try {
        if (this.recognition && this.isListening) {
          console.log("Restarting speech recognition");
          this.recognition.start();
          this.lastRestartTime = Date.now();
        }
      } catch (error) {
        console.error('Error restarting speech recognition:', error);
        this.isListening = false;
      }
    }, delay);
  }

  public start() {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return false;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.lastRestartTime = Date.now();
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
      
      // Clear any pending restart
      if (this.restartTimeout !== null) {
        clearTimeout(this.restartTimeout);
        this.restartTimeout = null;
      }
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  public onTranscript(callback: (text: string) => void) {
    this.onTranscriptCallback = callback;
  }
  
  public onInterimTranscript(callback: (text: string) => void) {
    this.onInterimTranscriptCallback = callback;
  }

  public isSupported(): boolean {
    return !!(typeof window !== 'undefined' && 
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }

  public getInterimTranscript(): string {
    return this.interimTranscript;
  }
  
  public isActive(): boolean {
    return this.isListening;
  }
}

// Export a singleton instance
const speechRecognition = new SpeechRecognitionService();
export default speechRecognition;
