// /pages/project/[id].tsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  ArrowLeft,
  Mic,
  Search,
  Grid,
  List,
  Settings,
  Share2,
  Download,
  Trash2,
} from 'lucide-react';
import NoteCard from '../../components/NoteCard';
import { Project, Note, ViewMode, SortBy, FilterBy, Stats } from '../../types';
import { GetServerSideProps, NextPage } from 'next';
import { getProject, getProjectStats } from '../../lib/data';

interface Props {
  project: Project;
  stats: Stats;
}

const ProjectPage: NextPage<Props> = ({ project: initialProject, stats: initialStats }) => {
  const router = useRouter();
  const { id } = router.query as { id: string };

  const [project, setProject] = useState<Project>(initialProject);
  const [stats, setStats] = useState<Stats>(initialStats);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFilter, setSelectedFilter] = useState<FilterBy>('all');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editDescription, setEditDescription] = useState(project.description || '');
  const [isEditing, setIsEditing] = useState(false);

  // Filter + sort notes client‐side - moved this right after state declarations
  const filteredNotes: Note[] = (project.notes || [])
    .filter((note) => {
      const searchMatch =
        !searchTerm ||
        (note.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.transcription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.text?.toLowerCase().includes(searchTerm.toLowerCase()));

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
        default:
          // newest
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  // Refresh project data
  const refreshProject = async () => {
    try {
      const resp = await fetch(`/api/project/${project.id}`);
      if (!resp.ok) {
        router.push('/');
        return;
      }
      const { project: fresh } = await resp.json();
      setProject(fresh);

      // Fetch updated stats
      const statsResp = await fetch(`/api/project/${project.id}/stats`);
      if (statsResp.ok) {
        const { stats: freshStats } = await statsResp.json();
        setStats(freshStats);
      }
    } catch (error) {
      console.error('Error refreshing project:', error);
    }
  };

  const handleEditProject = async () => {
    if (!editName.trim()) return;
    setIsEditing(true);
    try {
      const resp = await fetch(`/api/project/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        }),
      });
      if (!resp.ok) throw new Error('Failed to update');
      await refreshProject();
      setShowEditModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteProject = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this project? This cannot be undone.'
    );
    if (!confirmed) return;

    try {
      const resp = await fetch(`/api/project/${project.id}`, {
        method: 'DELETE',
      });
      if (!resp.ok) throw new Error('Failed to delete');
      router.push('/');
    } catch (e) {
      console.error(e);
    }
  };

  const handleNoteAction = (note: Note, action: 'expand' | 'share' | 'download') => {
    // Stub for future functionality
    console.log(`${action} note:`, note.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-sm text-gray-500">
                  {project.notes.length} note{project.notes.length !== 1 ? 's' : ''}
                  {project.description && ` • ${project.description}`}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEditModal(true)}
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

              <Link
                href={`/project/${project.id}/create`}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Record Note</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Stats */}
        {stats && (
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
        )}

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
                onChange={(e) => setSelectedFilter(e.target.value as FilterBy)}
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
                onChange={(e) => setSortBy(e.target.value as SortBy)}
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
                  className={`p-2 ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Notes Grid/List */}
        {filteredNotes.length > 0 ? (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredNotes.map((note: Note) => (
              <NoteCard
                key={note.id}
                note={note}
                onExpand={(n: Note) => handleNoteAction(n, 'expand')}
                onShare={(n: Note) => handleNoteAction(n, 'share')}
                onDownload={(n: Note) => handleNoteAction(n, 'download')}
              />
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
                : 'Start recording your first note to get started.'}
            </p>
            {!(searchTerm || selectedFilter !== 'all') && (
              <Link
                href={`/project/${project.id}/create`}
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <Mic className="w-5 h-5" />
                <span>Record Your First Note</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Project</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleEditProject}
                disabled={!editName.trim() || isEditing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isEditing ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
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

    const stats = getProjectStats(id) || {
      totalNotes: 0,
      audioNotes: 0,
      imageNotes: 0,
      transcribedNotes: 0,
      totalWords: 0,
      totalDuration: 0,
    };

    return {
      props: {
        project,
        stats,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
};

export default ProjectPage;