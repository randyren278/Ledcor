// /components/CameraRecorder.tsx
import { useEffect, useRef, useState } from "react";
import { Camera, Mic, Square, Circle, Play } from "lucide-react";

interface MediaData {
  audio: File;
  images: File[];
  transcription: string;
  duration: number;
}

interface CameraRecorderProps {
  onFinish: (data: MediaData) => void;
}

export default function CameraRecorder({ onFinish }: CameraRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState(-1);
  const [images, setImages] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recording]);

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }, 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setStream(s);
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    })();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  function startCountdown() {
    setCountdown(3);
    const int = setInterval(() => {
      setCountdown((c) => {
        if (c === 1) { 
          clearInterval(int); 
          beginRecord(); 
          return -1; 
        }
        return c - 1;
      });
    }, 1000);
  }

  function beginRecord() {
    if (!stream) return;

    const rec = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
    });

    mediaRecorderRef.current = rec;
    chunksRef.current = [];
    setTranscript('');

    // Start browser speech recognition if available
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) final += res[0].transcript;
        }
        if (final) {
          setTranscript((t) => (t + ' ' + final).trim());
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    }
    
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    rec.start();
    setRecording(true);
    setDuration(0);
  }

  function takePhoto() {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
          setImages((imgs) => [...imgs, file]);
        }
      }, "image/jpeg", 0.9);
    }
  }

  function endRecord() {
    const rec = mediaRecorderRef.current;
    if (!rec) return;

    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.stop();
      recognitionRef.current = null;
    }

    rec.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
      onFinish({ audio: audioFile, images, transcription: transcript, duration });
      setRecording(false);
      setImages([]);
      setDuration(0);
      setTranscript('');
    };

    rec.stop();
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl">
      {/* Video Feed */}
      <div className="relative aspect-[4/3] bg-gray-900">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ transform: "scaleX(-1)" }}
          className="w-full h-full object-cover"
        />
        
        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-8xl font-bold text-white animate-pulse drop-shadow-2xl">
              {countdown}
            </div>
          </div>
        )}
        
        {/* Recording Indicator */}
        {recording && (
          <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">REC {formatTime(duration)}</span>
          </div>
        )}
        
        {/* Photo Count */}
        {images.length > 0 && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-full">
            <span className="text-sm font-semibold">{images.length} photo{images.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="bg-gray-900 p-6">
        {!recording ? (
          <div className="flex justify-center">
            <button
              onClick={startCountdown}
              className="flex items-center justify-center w-20 h-20 bg-green-500 hover:bg-green-600 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Play className="w-8 h-8 text-white ml-1" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {/* Photo Button */}
            <button
              onClick={takePhoto}
              className="flex items-center justify-center w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            
            {/* Stop Button */}
            <button
              onClick={endRecord}
              className="flex items-center justify-center w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Square className="w-8 h-8 text-white" />
            </button>
            
            {/* Mic Indicator */}
            <div className="flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full">
              <Mic className="w-6 h-6 text-green-400" />
            </div>
          </div>
        )}
      </div>
      
      {/* Photo Preview Strip */}
      {images.length > 0 && (
        <div className="bg-gray-800 p-4">
          <div className="flex space-x-2 overflow-x-auto">
            {images.map((_, index) => (
              <div key={index} className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
