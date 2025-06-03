// /pages/project/[id]/create.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  Brain,
  FileText,
  Camera,
  Mic,
  Sparkles,
} from 'lucide-react';
import CameraRecorder from '@/components/CameraRecorder';
import { Project, RecordingStatus } from '../../../types'; // Adjusted path based on directory structure

import { GetServerSideProps, NextPage } from 'next';
import { getProject } from '@/lib/data'; // Adjusted path to use absolute imports

interface Props {
  project: Project;
}

const CreateNote: NextPage<Props> = ({ project }) => {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');

  // Simulate progress updates
  useEffect(() => {
    if (status === 'uploading' || status === 'processing') {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handleFinish = async ({
    audio,
    images,
    transcription,
    duration,
  }: {
    audio: File;
    images: File[];
    transcription: string;
    duration: number;
  }) => {
    setStatus('uploading');
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('projectId', project.id);
      formData.append('audio', audio);
      formData.append('transcription', transcription);
      formData.append('duration', String(duration));
      images.forEach((img) => formData.append('images', img));

      setProcessingStep('Uploading files...');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errData = await uploadResponse.json();
        throw new Error(errData.error || 'Upload failed');
      }

      setStatus('processing');
      setProcessingStep('Transcribing audio...');
      setProgress(30);

      // Simulate delays
      await new Promise((r) => setTimeout(r, 2000));
      setProcessingStep('Analyzing content with AI...');
      setProgress(60);

      await new Promise((r) => setTimeout(r, 2000));
      setProcessingStep('Generating summary and insights...');
      setProgress(80);

      await new Promise((r) => setTimeout(r, 1500));
      setProcessingStep('Finalizing your note...');
      setProgress(95);

      const result = await uploadResponse.json();
      if (!result.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      setProgress(100);
      setStatus('success');

      // Redirect back to project page after a short delay
      setTimeout(() => {
        router.push(`/project/${project.id}`);
      }, 2000);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      setStatus('error');
      setProgress(0);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'idle':
      case 'recording':
        return {
          icon: <FileText className="w-8 h-8 text-blue-600" />,
          title: 'Record Your Note',
          subtitle: `Adding to ${project.name}`,
          color: 'text-gray-900',
        };
      case 'uploading':
        return {
          icon: <Upload className="w-8 h-8 text-blue-600 animate-bounce" />,
          title: 'Uploading Files',
          subtitle: processingStep,
          color: 'text-blue-600',
        };
      case 'processing':
        return {
          icon: <Brain className="w-8 h-8 text-purple-600 animate-pulse" />,
          title: 'AI Processing',
          subtitle: processingStep,
          color: 'text-purple-600',
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-600" />,
          title: 'Note Created Successfully!',
          subtitle: 'Redirecting to your project...',
          color: 'text-green-600',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-8 h-8 text-red-600" />,
          title: 'Something went wrong',
          subtitle: error || 'Please try again',
          color: 'text-red-600',
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
                onClick={() => router.push(`/project/${project.id}`)}
                disabled={status === 'uploading' || status === 'processing'}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-xl font-bold ${statusConfig.color}`}>
                  {statusConfig.title}
                </h1>
                <p className="text-sm text-gray-500">{statusConfig.subtitle}</p>
              </div>
            </div>

            {statusConfig.icon && (
              <div className="flex items-center space-x-2">
                {(status === 'uploading' || status === 'processing') && (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                )}
                {!['uploading', 'processing'].includes(status) && statusConfig.icon}
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
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Create a New Note</h2>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                Record audio, capture images, and let AI create structured notes for you.
              </p>
            </div>

            <CameraRecorder onFinish={handleFinish} />

            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-blue-900">Voice Recording</h3>
                </div>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• High-quality audio capture</li>
                  <li>• Automatic noise reduction</li>
                  <li>• Real-time transcription</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-green-900">Photo Capture</h3>
                </div>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>• Multiple image support</li>
                  <li>• Automatic organization</li>
                  <li>• Smart image analysis</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-purple-900">AI Processing</h3>
              </div>
              <p className="text-sm text-purple-800">
                Our AI will transcribe your audio, analyze your images, and create organized
                notes with summaries and insights automatically.
              </p>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-20 animate-ping rounded-full"></div>
                <Loader2 className="w-12 h-12 text-white animate-spin relative z-10" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">{statusConfig.title}</h3>
              <p className="text-gray-600 mb-6">{statusConfig.subtitle}</p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white opacity-30 animate-pulse"></div>
                </div>
              </div>

              <p className="text-sm text-gray-500 font-medium">{progress}% complete</p>

              {status === 'processing' && (
                <div className="mt-4 flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl border border-green-200 p-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <CheckCircle className="w-12 h-12 text-green-600" />
                <div className="absolute inset-0 bg-green-400 opacity-20 rounded-full animate-ping"></div>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">Note Created Successfully!</h3>
              <p className="text-gray-600 mb-6">Your note has been processed and added to {project.name}.</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  ✨ AI analysis complete! Your note includes transcription, summary, and insights.
                </p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  View Project
                </button>
                <button
                  onClick={() => {
                    setStatus('idle');
                    setProgress(0);
                    setError(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-xl border border-red-200 p-8">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">{error || 'An unexpected error occurred. Please try again.'}</p>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setStatus('idle');
                    setProgress(0);
                    setError(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push(`/project/${project.id}`)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg transition-colors font-medium"
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
};

// ─── Fixed getServerSideProps to use direct function calls ─────────────────────────────
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { id } = context.params as { id: string };
    
    // Use direct function calls instead of HTTP requests
    const project = getProject(id);

    if (!project) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        project,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
};

export default CreateNote;
