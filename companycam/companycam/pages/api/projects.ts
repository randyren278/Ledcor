// /pages/api/projects.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllProjects, createProject, getGlobalStats } from '../../lib/data';
import type { Project } from '../../types';

type Stats = {
  totalProjects: number;
  totalNotes: number;
  totalAudioNotes: number;
  totalImages: number;
  recentActivity?: { projectName: string; id: string; timestamp: string; text?: string; audio?: string; images?: string[]; transcription?: string; summary?: string; duration?: number; language?: string; insights?: string[]; }[];
};

type Data =
  | { projects: Project[]; stats: Stats }
  | { project: Project }
  | { error: string };

export default function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const method = req.method;
  if (method === 'GET') {
    // Return list of all projects + global stats
    const projects = getAllProjects();
    const stats = getGlobalStats() || {
      totalProjects: 0,
      totalNotes: 0,
      totalAudioNotes: 0,
      totalImages: 0,
      // (If getGlobalStats includes more fields, return them here as well)
    };
    return res.status(200).json({ projects, stats });
  }

  if (method === 'POST') {
    // Create a new project. Expect JSON { name: string, description?: string }
    try {
      const { name, description } = req.body;
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Project name is required' });
      }
      const newProj = createProject(name.trim(), typeof description === 'string' ? description.trim() : undefined);
      return res.status(201).json({ project: newProj });
    } catch (e) {
      console.error('Error in POST /api/projects:', e);
      return res.status(500).json({ error: 'Failed to create project' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${method} Not Allowed` });
}
