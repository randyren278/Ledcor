interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResult[] & { length: number };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: { new (): SpeechRecognition };
    SpeechRecognition?: { new (): SpeechRecognition };
  }
}
export {};
