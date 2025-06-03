// /components/ProjectCard.tsx
import { Mic, Camera, Clock, ChevronRight, Plus } from 'lucide-react';

interface Note {
  id: string;
  timestamp: string;
  text?: string;
  audio?: string;
  images?: string[];
  transcription?: string;
  summary?: string;
  duration?: number;
}

interface Project {
  id: string;
  name: string;
  notes: Note[];
  lastActivity?: string;
  color?: string;
}

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  colorClass?: string;
}

const PROJECT_COLORS = [
  'bg-gradient-to-br from-blue-500 to-blue-700',
  'bg-gradient-to-br from-purple-500 to-purple-700',
  'bg-gradient-to-br from-green-500 to-green-700',
  'bg-gradient-to-br from-red-500 to-red-700',
  'bg-gradient-to-br from-yellow-500 to-yellow-700',
  'bg-gradient-to-br from-pink-500 to-pink-700',
];

export default function ProjectCard({ project, onClick, colorClass }: ProjectCardProps) {
  const gradientClass = colorClass || project.color || PROJECT_COLORS[0];
  const recentNotes = project.notes.slice(-3);
  
  // Calculate stats
  const audioCount = project.notes.filter(n => n.audio).length;
  const imageCount = project.notes.reduce((acc, n) => acc + (n.images?.length || 0), 0);
  
  // Get most recent activity
  const lastActivity = project.notes.length > 0 
    ? new Date(Math.max(...project.notes.map(n => new Date(n.timestamp).getTime())))
    : null;
  
  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Active now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US');
  };

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1"
    >
      {/* Header with Gradient */}
      <div className={`${gradientClass} p-6 text-white relative overflow-hidden`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1 truncate">{project.name}</h3>
              <p className="text-white/80 text-sm">
                {project.notes.length} note{project.notes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight className="w-6 h-6 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4" />
              <span className="text-sm font-medium">{audioCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span className="text-sm font-medium">{imageCount}</span>
            </div>
            {lastActivity && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">{formatLastActivity(lastActivity)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-6">
        {recentNotes.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
              Recent Activity
              <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </h4>
            
            {recentNotes.map((note, index) => {
              const noteText = note.summary || note.transcription || note.text || 'Voice note';
              const truncatedText = noteText.length > 60 ? noteText.slice(0, 60) + '...' : noteText;
              
              return (
                <div key={note.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-purple-500' : 'bg-gray-400'
                  }`}></div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                      {truncatedText}
                    </p>
                    
                    <div className="flex items-center space-x-3 mt-2">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(note.timestamp).toLocaleDateString('en-US')}
                        </span>
                      </div>
                      
                      {/* Media indicators */}
                      <div className="flex items-center space-x-2">
                        {note.audio && (
                          <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <Mic className="w-2 h-2 text-blue-600" />
                          </div>
                        )}
                        {note.images && note.images.length > 0 && (
                          <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                            <Camera className="w-2 h-2 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-200 transition-colors">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-2">No notes yet</p>
            <p className="text-xs text-gray-400">Click to create your first note</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      {project.notes.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{project.notes.length} total notes</span>
            {lastActivity && (
              <span>Updated {formatLastActivity(lastActivity)}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 transition-all duration-300 pointer-events-none"></div>
    </div>
  );
}