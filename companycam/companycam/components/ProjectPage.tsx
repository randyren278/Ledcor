import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Mic, Filter, Search, Grid, List, Calendar, Download, Share2, Settings } from 'lucide-react';

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

interface Project {
  id: string;
  name: string;
  notes: Note[];
  description?: string;
  createdAt: string;
}

interface ProjectPageProps {
  project: Project;
  onBack: () => void;
  onCreateNote: () => void;
  onEditProject?: () => void;
}

// Import the NoteCard component we just created
// In real implementation, this would be imported from the separate file
const NoteCard = ({ note }: { note: Note }) => (
  <div className="bg-white rounded-lg shadow-sm border p-4">
    <p className="text-sm text-gray-500 mb-2">
      {new Date(note.timestamp).toLocaleString()}
    </p>
    <p className="text-gray-900">
      {note.summary || note.transcription || note.text || 'No content'}
    </p>
    {note.images && note.images.length > 0 && (
      <div className="mt-3 flex space-x-2">
        {note.images.slice(0, 3).map((img, idx) => (
          <div key={idx} className="w-16 h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    )}
  </div>
);

export default function ProjectPage({ project, onBack, onCreateNote, onEditProject }: ProjectPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'audio' | 'images' | 'transcribed'>('all');

  const filteredNotes = project.notes
    .filter(note => {
      // Text search
      const searchMatch = !searchTerm || 
        (note.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         note.transcription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         note.text?.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filter by type
      let typeMatch = true;
      switch (selectedFilter) {
        case 'audio':
          typeMatch = !!note.audio;
          break;
        case 'images':
          typeMatch = !!(note.images && note.images.length > 0);
          break;
        case 'transcribed':
          typeMatch = !!note.transcription;
          break;
        default:
          typeMatch = true;
      }

      return searchMatch && typeMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case 'alphabetical':
          const aText = a.summary || a.transcription || a.text || '';
          const bText = b.summary || b.transcription || b.text || '';
          return aText.localeCompare(bText);
        default: // newest
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  const stats = {
    totalNotes: project.notes.length,
    audioNotes: project.notes.filter(n => n.audio).length,
    imageNotes: project.notes.filter(n => n.images && n.images.length > 0).length,
    transcribedNotes: project.notes.filter(n => n.transcription).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500">
                  {project.notes.length} note{project.notes.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={onEditProject}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={onCreateNote}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Record Note</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{stats.totalNotes}</div>
            <div className="text-sm text-gray-600">Total Notes</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{stats.audioNotes}</div>
            <div className="text-sm text-gray-600">Audio Notes</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{stats.imageNotes}</div>
            <div className="text-sm text-gray-600">With Images</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-purple-600">{stats.transcribedNotes}</div>
            <div className="text-sm text-gray-600">Transcribed</div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* Filter */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Notes</option>
                <option value="audio">Audio Only</option>
                <option value="images">With Images</option>
                <option value="transcribed">Transcribed</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>

              {/* View Mode */}
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid/List */}
        {filteredNotes.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchTerm || selectedFilter !== 'all' ? (
                <Search className="w-12 h-12 text-gray-400" />
              ) : (
                <Mic className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || selectedFilter !== 'all' ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchTerm || selectedFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Start recording your first note to get started.'
              }
            </p>
            {!(searchTerm || selectedFilter !== 'all') && (
              <button
                onClick={onCreateNote}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Mic className="w-5 h-5" />
                <span>Record Your First Note</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}