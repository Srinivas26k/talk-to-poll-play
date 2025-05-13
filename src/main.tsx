
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add types to Window object for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

createRoot(document.getElementById("root")!).render(<App />);
