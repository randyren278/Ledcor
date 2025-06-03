import { useState } from 'react';
import { Plus, Mic, Camera, Clock, ChevronRight, Search, Filter } from 'lucide-react';

interface Note {
  id: string;
  timestamp: string;
  text: string;
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

interface ProjectDashboardProps {
  projects: Project[];
  onCreateProject?: () => void;
  onSelectProject?: (projectId: string) => void;
}

const PROJECT_COLORS = [
  'bg-gradient-to-br from-blue-500 to-blue-700',
  'bg-gradient-to-br from-purple-500 to-purple-700',
  'bg-gradient-to-br from-green-500 to-green-700',
  'bg-gradient-to-br from-red-500 to-red-700',
  'bg-gradient-to-br from-yellow-500 to-yellow-700',
  'bg-gradient-to-br from-pink-500 to-pink-700',
];

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const colorClass = project.color || PROJECT_COLORS[0];
  const recentNotes = project.notes.slice(-3);
  
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-gray-200 transform hover:-translate-y-1"
    >
      {/* Header */}
      <div className={`${colorClass} p-6 text-white relative`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">{project.name}</h3>
            <p className="text-white/80 text-sm">
              {project.notes.length} note{project.notes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <ChevronRight className="w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Stats */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="flex items-center space-x-1">
            <Mic className="w-4 h-4" />
            <span className="text-sm">{project.notes.filter(n => n.audio).length}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Camera className="w-4 h-4" />
            <span className="text-sm">{project.notes.reduce((acc, n) => acc + (n.images?.length || 0), 0)}</span>
          </div>
        </div>
      </div>
      
      {/* Recent Notes Preview */}
      <div className="p-6">
        {recentNotes.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-600 mb-3">Recent Notes</h4>
            {recentNotes.map((note) => (
              <div key={note.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-2">
                    {note.summary || note.text || note.transcription || 'No content'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No notes yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectDashboard({ projects, onCreateProject, onSelectProject }: ProjectDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">AI Notes</h1>
              <div className="hidden sm:block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Create Project Button */}
              <button
                onClick={onCreateProject}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Project</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Mic className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Notes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((acc, p) => acc + p.notes.length, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Photos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((acc, p) => acc + p.notes.reduce((nacc, n) => nacc + (n.images?.length || 0), 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((acc, p) => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return acc + p.notes.filter(n => new Date(n.timestamp) > weekAgo).length;
                  }, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={{
                  ...project,
                  color: PROJECT_COLORS[index % PROJECT_COLORS.length]
                }}
                onClick={() => onSelectProject?.(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? `No projects match "${searchTerm}". Try a different search term.`
                : 'Get started by creating your first project to organize your AI-powered notes.'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={onCreateProject}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Project</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}