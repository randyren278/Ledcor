// /lib/data.ts
import { Project, Note } from '../types';

// In-memory database for MVP
export const db: { projects: Record<string, Project> } = { 
  projects: {} 
};

export function getProject(id: string): Project {
  if (!db.projects[id]) {
    db.projects[id] = { 
      id, 
      name: `Project ${id}`, 
      notes: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
  }
  return db.projects[id];
}

export function getAllProjects(): Project[] {
  return Object.values(db.projects);
}

export function createProject(name: string, description?: string): Project {
  const id = generateId();
  const project: Project = {
    id,
    name,
    description,
    notes: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  };
  
  db.projects[id] = project;
  return project;
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const project = db.projects[id];
  if (!project) return null;
  
  db.projects[id] = {
    ...project,
    ...updates,
    lastActivity: new Date().toISOString()
  };
  
  return db.projects[id];
}

export function deleteProject(id: string): boolean {
  if (db.projects[id]) {
    delete db.projects[id];
    return true;
  }
  return false;
}

export function addNoteToProject(projectId: string, note: Note): Project | null {
  const project = db.projects[projectId];
  if (!project) return null;
  
  project.notes.push(note);
  project.lastActivity = new Date().toISOString();
  
  return project;
}

export function removeNoteFromProject(projectId: string, noteId: string): Project | null {
  const project = db.projects[projectId];
  if (!project) return null;
  
  const noteIndex = project.notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) return null;
  
  project.notes.splice(noteIndex, 1);
  project.lastActivity = new Date().toISOString();
  
  return project;
}

export function updateNote(projectId: string, noteId: string, updates: Partial<Note>): Note | null {
  const project = db.projects[projectId];
  if (!project) return null;
  
  const noteIndex = project.notes.findIndex(n => n.id === noteId);
  if (noteIndex === -1) return null;
  
  project.notes[noteIndex] = {
    ...project.notes[noteIndex],
    ...updates
  };
  
  project.lastActivity = new Date().toISOString();
  
  return project.notes[noteIndex];
}

export function getNote(projectId: string, noteId: string): Note | null {
  const project = db.projects[projectId];
  if (!project) return null;
  
  return project.notes.find(n => n.id === noteId) || null;
}

export function searchNotes(query: string): { project: Project; note: Note }[] {
  const results: { project: Project; note: Note }[] = [];
  
  Object.values(db.projects).forEach(project => {
    project.notes.forEach(note => {
      const searchText = [
        note.text,
        note.transcription,
        note.summary
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (searchText.includes(query.toLowerCase())) {
        results.push({ project, note });
      }
    });
  });
  
  return results;
}

export function getProjectStats(projectId: string) {
  const project = db.projects[projectId];
  if (!project) return null;
  
  return {
    totalNotes: project.notes.length,
    audioNotes: project.notes.filter(n => n.audio).length,
    imageNotes: project.notes.filter(n => n.images && n.images.length > 0).length,
    transcribedNotes: project.notes.filter(n => n.transcription).length,
    totalWords: project.notes.reduce((acc, note) => {
      const text = note.summary || note.transcription || note.text || '';
      return acc + text.split(' ').length;
    }, 0),
    totalDuration: project.notes.reduce((acc, note) => acc + (note.duration || 0), 0)
  };
}

export function getGlobalStats() {
  const projects = Object.values(db.projects);
  
  return {
    totalProjects: projects.length,
    totalNotes: projects.reduce((acc, p) => acc + p.notes.length, 0),
    totalAudioNotes: projects.reduce((acc, p) => 
      acc + p.notes.filter(n => n.audio).length, 0
    ),
    totalImages: projects.reduce((acc, p) => 
      acc + p.notes.reduce((nacc, n) => nacc + (n.images?.length || 0), 0), 0
    ),
    recentActivity: projects
      .flatMap(p => p.notes.map(n => ({ ...n, projectName: p.name })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  };
}

// Utility functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize with some demo data
export function initializeDemoData() {
  if (Object.keys(db.projects).length === 0) {
    // Create demo projects
    const demoProject = createProject("Demo Project", "Sample project for testing");
    const siteAProject = createProject("Site A Inspection", "Construction site A progress tracking");
    const siteBProject = createProject("Site B Review", "Quality control for site B");
    
    // Add some demo notes (you can remove this in production)
    const demoNote: Note = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      text: "This is a demo note to show how the application works.",
      summary: "Demo note showing application functionality",
      transcription: "This is a demo note to show how the application works.",
      language: "en",
      duration: 15
    };
    
    addNoteToProject(demoProject.id, demoNote);
  }
}

// Call this when the app starts
initializeDemoData();