export function initializeSpeechRecognition() {
  if (typeof window === 'undefined') return null;
  
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (window as any).mozSpeechRecognition ||
    (window as any).msSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported in this browser');
    return null;
  }

  return SpeechRecognition;
}

export function isSpeechRecognitionSupported(): boolean {
  return initializeSpeechRecognition() !== null;
}

export async function getSupportedLanguages(): Promise<string[]> {
  return [
    'en-US', 'en-GB', 'es-ES', 'es-MX', 'fr-FR', 'de-DE',
    'it-IT', 'pt-BR', 'ru-RU', 'zh-CN', 'ja-JP', 'ko-KR'
  ];
}
