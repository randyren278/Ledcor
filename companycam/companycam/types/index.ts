// /types/index.ts

export interface Note {
    id: string;
    timestamp: string;
    text?: string;
    audio?: string;
    images?: string[];
    transcription?: string;
    summary?: string;
    duration?: number;
    language?: string;
    insights?: string[];
  }
  
  export interface Project {
    id: string;
    name: string;
    notes: Note[];
    description?: string;
    createdAt: string;
    lastActivity?: string;
    color?: string;
  }
  
export interface MediaData {
  audio: File;
  images: File[];
  transcription?: string;
}

  export interface Stats {
    totalNotes: number;
    audioNotes: number;
    imageNotes: number;
    transcribedNotes: number;
    totalWords: number;
    totalDuration: number;
  }
  
  export interface UploadResponse {
    ok: boolean;
    note?: Note;
    error?: string;
    reportUrl?: string;
    pdfBase64?: string;
  }
  
  export interface TranscriptionResult {
    success: boolean;
    language?: string;
    language_probability?: number;
    text?: string;
    duration?: number;
    error?: string;
  }
  
  export interface APIError {
    error: string;
    code?: string;
    details?: any;
  }
  
  // Component Props Types
  export interface CameraRecorderProps {
    onFinish: (data: MediaData) => void;
  }
  
  export interface NoteCardProps {
    note: Note;
    onExpand?: (note: Note) => void;
    onShare?: (note: Note) => void;
    onDownload?: (note: Note) => void;
  }
  
  export interface ProjectCardProps {
    project: Project;
    onClick: () => void;
    colorClass?: string;
  }
  
  export interface ProjectDashboardProps {
    projects: Project[];
    onCreateProject?: () => void;
    onSelectProject?: (projectId: string) => void;
  }
  
  export interface ProjectPageProps {
    project: Project;
    onBack: () => void;
    onCreateNote: () => void;
    onEditProject?: () => void;
  }
  
  export interface CreateNotePageProps {
    projectId: string;
    projectName: string;
    onBack: () => void;
    onComplete: () => void;
  }
  
  // Status Types
  export type RecordingStatus = 'idle' | 'recording' | 'uploading' | 'processing' | 'success' | 'error';
  export type ViewMode = 'grid' | 'list';
  export type SortBy = 'newest' | 'oldest' | 'alphabetical';
  export type FilterBy = 'all' | 'audio' | 'images' | 'transcribed';
  
  // Utility Types
  export interface ProjectStats {
    totalNotes: number;
    audioNotes: number;
    imageNotes: number;
    transcribedNotes: number;
  }
  
  export interface AudioPlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  }
  
  // API Route Types
  export interface UploadRequest {
    projectId: string;
    audio: File;
    images: File[];
  }
  
  export interface ProcessingStep {
    step: string;
    progress: number;
    message: string;
  }