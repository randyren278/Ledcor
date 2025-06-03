// /components/NoteCard.tsx
import { useState } from 'react';
import { Play, Pause, Volume2, Camera, Clock, User, Expand, Download, Share } from 'lucide-react';

interface Note {
  id: string;
  timestamp: string;
  text?: string;
  audio?: string;
  images?: string[];
  transcription?: string;
  summary?: string;
  duration?: number;
  language?: string;
}

interface NoteCardProps {
  note: Note;
  onExpand?: (note: Note) => void;
  onShare?: (note: Note) => void;
  onDownload?: (note: Note) => void;
}

function AudioPlayer({ audioSrc, duration }: { audioSrc: string; duration?: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Audio control logic would go here
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlayPause}
          className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span className="flex items-center space-x-1">
              <Volume2 className="w-4 h-4" />
              <span>Audio Note</span>
            </span>
            <span>{formatTime(audioDuration)}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentTime / audioDuration) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <img
          src={`/uploads/${images[selectedImage]}`}
          alt={`Photo ${selectedImage + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        )}
      </div>
      
      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === index
                  ? 'border-blue-500 scale-105'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={`/uploads/${image}`}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NoteCard({ note, onExpand, onShare, onDownload }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const displayText = note.summary || note.transcription || note.text || '';
  const previewText = displayText.length > 200 ? displayText.slice(0, 200) + '...' : displayText;
  const hasMedia = (note.audio && note.audio.length > 0) || (note.images && note.images.length > 0);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">Voice Note</span>
                {note.language && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full uppercase">
                    {note.language}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{formatDate(note.timestamp)}</span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onShare?.(note)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Share className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDownload?.(note)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Expand className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {displayText && (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {isExpanded ? displayText : previewText}
            </p>
            {!isExpanded && displayText.length > 200 && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-2 inline-flex items-center space-x-1"
              >
                <span>Read more</span>
                <Expand className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Media Content */}
      {hasMedia && (
        <div className="px-6 pb-4 space-y-4">
          {/* Audio Player */}
          {note.audio && (
            <AudioPlayer audioSrc={note.audio} duration={note.duration} />
          )}
          
          {/* Image Gallery */}
          {note.images && note.images.length > 0 && (
            <ImageGallery images={note.images} />
          )}
        </div>
      )}

      {/* Footer with Stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {note.audio && (
              <div className="flex items-center space-x-1">
                <Volume2 className="w-4 h-4" />
                <span>Audio</span>
              </div>
            )}
            {note.images && note.images.length > 0 && (
              <div className="flex items-center space-x-1">
                <Camera className="w-4 h-4" />
                <span>{note.images.length} photo{note.images.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            {note.transcription && (
              <div className="flex items-center space-x-1">
                <span>✓</span>
                <span>Transcribed</span>
              </div>
            )}
          </div>
          
          {displayText.length > 0 && (
            <span className="text-xs text-gray-400">
              {displayText.split(' ').length} words
            </span>
          )}
        </div>
      </div>
    </div>
  );
}