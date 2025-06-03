// /lib/data.ts
import fs from 'fs';
import path from 'path';
import { Project, Note } from '../types';

// ─── Setup: location of our on‐disk JSON ────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// In‐memory “cache” of our database. We will read from disk at startup
// and write back whenever something changes.
interface DbShape {
  projects: Record<string, Project>;
}
let db: DbShape = { projects: {} };


// ─── Helpers to load/save “db” ─────────────────────────────────────────────────

function ensureDataDirExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFromDisk(): void {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DbShape;
    // If the file is well‐formed, overwrite our in‐memory db
    db = parsed;
  } catch (e) {
    // If file does not exist or is invalid JSON, we’ll fallback to empty
    console.warn('Could not load data/db.json—starting with empty store.');
    db = { projects: {} };
  }
}

function saveToDisk(): void {
  try {
    ensureDataDirExists();
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save data to disk:', e);
  }
}


// ─── Utility: generate new IDs ─────────────────────────────────────────────────

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substr(2, 5)
  );
}


// ─── Initialize “db” on module load ────────────────────────────────────────────

// 1. Attempt to load an existing data/db.json
loadFromDisk();

// 2. If loadFromDisk() gave us an empty “projects” object, populate demo data
if (Object.keys(db.projects).length === 0) {
  // Demo projects:
  const demoProject: Project = {
    id: generateId(),
    name: 'Demo Project',
    description: 'Sample project for testing',
    notes: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  const siteAProject: Project = {
    id: generateId(),
    name: 'Site A Inspection',
    description: 'Construction site A progress tracking',
    notes: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  const siteBProject: Project = {
    id: generateId(),
    name: 'Site B Review',
    description: 'Quality control for site B',
    notes: [],
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  db.projects[demoProject.id] = demoProject;
  db.projects[siteAProject.id] = siteAProject;
  db.projects[siteBProject.id] = siteBProject;

  // Demo note in “Demo Project”:
  const demoNote: Note = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    text: 'This is a demo note to show how the application works.',
    summary: 'Demo note showing application functionality',
    transcription: 'This is a demo note to show how the application works.',
    language: 'en',
    duration: 15,
  };

  demoProject.notes.push(demoNote);
  demoProject.lastActivity = new Date().toISOString();

  // Finally, persist this initial state to disk
  saveToDisk();
}


// ─── Public API functions ──────────────────────────────────────────────────────

export function getProject(id: string): Project | null {
  return db.projects[id] || null;
}

export function getAllProjects(): Project[] {
  return Object.values(db.projects);
}

export function createProject(
  name: string,
  description?: string
): Project {
  const id = generateId();
  const now = new Date().toISOString();
  const project: Project = {
    id,
    name,
    description,
    notes: [],
    createdAt: now,
    lastActivity: now,
  };

  db.projects[id] = project;
  saveToDisk();
  return project;
}

export function updateProject(
  id: string,
  updates: Partial<Project>
): Project | null {
  const existing = db.projects[id];
  if (!existing) return null;

  const updated: Project = {
    ...existing,
    ...updates,
    // Always update lastActivity whenever we change something
    lastActivity: new Date().toISOString(),
  };

  db.projects[id] = updated;
  saveToDisk();
  return updated;
}

export function deleteProject(id: string): boolean {
  if (db.projects[id]) {
    delete db.projects[id];
    saveToDisk();
    return true;
  }
  return false;
}

export function addNoteToProject(
  projectId: string,
  note: Note
): Project | null {
  const project = db.projects[projectId];
  if (!project) return null;

  project.notes.push(note);
  project.lastActivity = new Date().toISOString();
  saveToDisk();
  return project;
}

export function removeNoteFromProject(
  projectId: string,
  noteId: string
): Project | null {
  const project = db.projects[projectId];
  if (!project) return null;

  const noteIndex = project.notes.findIndex((n) => n.id === noteId);
  if (noteIndex === -1) return null;

  project.notes.splice(noteIndex, 1);
  project.lastActivity = new Date().toISOString();
  saveToDisk();
  return project;
}

export function updateNote(
  projectId: string,
  noteId: string,
  updates: Partial<Note>
): Note | null {
  const project = db.projects[projectId];
  if (!project) return null;

  const noteIndex = project.notes.findIndex((n) => n.id === noteId);
  if (noteIndex === -1) return null;

  const existingNote = project.notes[noteIndex];
  const updatedNote: Note = {
    ...existingNote,
    ...updates,
  };

  project.notes[noteIndex] = updatedNote;
  project.lastActivity = new Date().toISOString();
  saveToDisk();
  return updatedNote;
}

export function getNote(
  projectId: string,
  noteId: string
): Note | null {
  const project = db.projects[projectId];
  if (!project) return null;
  return project.notes.find((n) => n.id === noteId) || null;
}

export function searchNotes(query: string): { project: Project; note: Note }[] {
  const results: { project: Project; note: Note }[] = [];
  Object.values(db.projects).forEach((project) => {
    project.notes.forEach((note) => {
      const searchText = [
        note.text ?? '',
        note.transcription ?? '',
        note.summary ?? '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

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
    audioNotes: project.notes.filter((n) => n.audio).length,
    imageNotes: project.notes.filter((n) => n.images && n.images.length > 0).length,
    transcribedNotes: project.notes.filter((n) => n.transcription).length,
    totalWords: project.notes.reduce((acc, note) => {
      const text = note.summary ?? note.transcription ?? note.text ?? '';
      return acc + text.split(' ').length;
    }, 0),
    totalDuration: project.notes.reduce((acc, note) => acc + (note.duration ?? 0), 0),
  };
}

export function getGlobalStats() {
  const projects = Object.values(db.projects);

  return {
    totalProjects: projects.length,
    totalNotes: projects.reduce((acc, p) => acc + p.notes.length, 0),
    totalAudioNotes: projects.reduce(
      (acc, p) => acc + p.notes.filter((n) => n.audio).length,
      0
    ),
    totalImages: projects.reduce(
      (acc, p) =>
        acc +
        p.notes.reduce((nacc, n) => nacc + (n.images?.length ?? 0), 0),
      0
    ),
    recentActivity: projects
      .flatMap((p) =>
        p.notes.map((n) => ({
          ...n,
          projectName: p.name,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10),
  };
}
