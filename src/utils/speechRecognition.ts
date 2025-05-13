
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
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      // Use the browser implementation
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      // Set up callbacks
      this.recognition.onresult = this.handleRecognitionResult.bind(this);
      this.recognition.onerror = this.handleRecognitionError.bind(this);
      this.recognition.onend = this.handleRecognitionEnd.bind(this);
    } else {
      console.error('Speech recognition not supported in this browser');
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
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent) {
    console.error('Speech Recognition Error:', event.error);
    
    // Try to restart recognition on some errors
    if (event.error !== 'no-speech' && this.isListening) {
      this.stop();
      this.start();
    }
  }

  private handleRecognitionEnd() {
    // Auto restart if we're supposed to be listening
    if (this.isListening && this.recognition) {
      this.recognition.start();
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
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

// Export a singleton instance
const speechRecognition = new SpeechRecognitionService();
export default speechRecognition;
