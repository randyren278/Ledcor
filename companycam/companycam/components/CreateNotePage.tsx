import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Upload, Brain, FileText } from 'lucide-react';

interface MediaData {
  audio: File;
  images: File[];
  transcription: string;
  duration: number;
}

interface CreateNotePageProps {
  projectId: string;
  projectName: string;
  onBack: () => void;
  onComplete: () => void;
}

type Status = 'idle' | 'recording' | 'uploading' | 'processing' | 'success' | 'error';

// Import the CameraRecorder component (in real implementation this would be imported)
const CameraRecorder = ({ onFinish }: { onFinish: (data: MediaData) => void }) => (
  <div className="bg-gray-800 rounded-2xl p-8 text-center text-white">
    <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
      <span className="text-2xl">📹</span>
    </div>
    <h3 className="text-xl font-semibold mb-2">Camera Recorder</h3>
    <p className="text-gray-300 mb-4">Camera component would go here</p>
    <button
      onClick={() => onFinish({
        audio: new File([], 'test.webm'),
        images: [],
        transcription: '',
        duration: 0
      })}
      className="bg-blue-500 px-4 py-2 rounded-lg"
    >
      Simulate Recording
    </button>
  </div>
);

export default function CreateNotePage({ projectId, projectName, onBack, onComplete }: CreateNotePageProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');

  // Simulate progress updates during processing
  useEffect(() => {
    if (status === 'uploading' || status === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [status]);

  async function handleFinish({ audio, images, transcription, duration }: MediaData) {
    try {
      setStatus('uploading');
      setProgress(0);
      setError(null);

      // Upload files
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("audio", audio);
      formData.append("transcription", transcription);
      formData.append("duration", String(duration));
      images.forEach((img) => formData.append("images", img));

      const uploadResponse = await fetch("/api/upload", { 
        method: "POST", 
        body: formData 
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Upload failed");
      }

      setStatus('processing');
      setProcessingStep('Transcribing audio...');
      setProgress(30);

      // Simulate processing steps
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep('Analyzing content...');
      setProgress(60);

      await new Promise(resolve => setTimeout(resolve, 1500));
      setProcessingStep('Generating summary...');
      setProgress(90);

      const result = await uploadResponse.json();
      
      if (!result.ok) {
        throw new Error(result.error || "Processing failed");
      }

      setProgress(100);
      setStatus('success');
      
      // Auto-redirect after success
      setTimeout(() => {
        onComplete();
      }, 2000);

    } catch (e) {
      console.error('Processing error:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      setStatus('error');
      setProgress(0);
    }
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
      case 'recording':
        return {
          icon: null,
          title: 'Record Your Note',
          subtitle: `Adding to ${projectName}`,
          color: 'text-gray-900'
        };
      case 'uploading':
        return {
          icon: <Upload className="w-8 h-8 text-blue-600" />,
          title: 'Uploading Files',
          subtitle: 'Sending your audio and images...',
          color: 'text-blue-600'
        };
      case 'processing':
        return {
          icon: <Brain className="w-8 h-8 text-purple-600" />,
          title: 'AI Processing',
          subtitle: processingStep,
          color: 'text-purple-600'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          title: 'Note Created Successfully!',
          subtitle: 'Redirecting to your project...',
          color: 'text-green-600'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-600" />,
          title: 'Something went wrong',
          subtitle: error || 'Please try again',
          color: 'text-red-600'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                disabled={status === 'uploading' || status === 'processing'}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-xl font-bold ${statusConfig.color}`}>
                  {statusConfig.title}
                </h1>
                <p className="text-sm text-gray-500">
                  {statusConfig.subtitle}
                </p>
              </div>
            </div>
            
            {statusConfig.icon && (
              <div className="flex items-center space-x-2">
                {status === 'uploading' || status === 'processing' ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  statusConfig.icon
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(status === 'idle' || status === 'recording') && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Create a New Note
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Record audio, capture images, and let AI create structured notes for you.
              </p>
            </div>
            
            <CameraRecorder onFinish={handleFinish} />
            
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Record your voice while taking photos</li>
                <li>• AI transcribes and analyzes your content</li>
                <li>• Get organized notes with summaries and insights</li>
              </ul>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {statusConfig.title}
              </h3>
              <p className="text-gray-600 mb-6">
                {statusConfig.subtitle}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500">
                {progress}% complete
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Note Created Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your note has been processed and added to {projectName}.
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={onComplete}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  View Project
                </button>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setProgress(0);
                    setError(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-600 mb-6">
                {error || 'An unexpected error occurred. Please try again.'}
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setStatus('idle');
                    setProgress(0);
                    setError(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onBack}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
