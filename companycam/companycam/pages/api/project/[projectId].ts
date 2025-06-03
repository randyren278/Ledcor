
// /pages/api/project/[projectId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getProject, updateProject, deleteProject } from '../../../lib/data';
import type { Project } from '../../../types';

type Data = 
  | { project: Project }
  | { success: true }
  | { error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { projectId } = req.query as { projectId: string };

  if (req.method === 'GET') {
    const project = getProject(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.status(200).json({ project });
  }

  if (req.method === 'PUT') {
    try {
      const { name, description } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const updated = updateProject(projectId, { 
        name: name.trim(), 
        description: description?.trim() 
      });
      
      if (!updated) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json({ project: updated });
    } catch (error) {
      console.error('Error updating project:', error);
      return res.status(500).json({ error: 'Failed to update project' });
    }
  }

  if (req.method === 'DELETE') {
    const success = deleteProject(projectId);
    if (!success) {
      return res.status(404).json({ error: 'Project not found' });
    }
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}