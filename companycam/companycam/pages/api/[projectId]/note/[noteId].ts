// /pages/api/project/[projectId]/note/[noteId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { removeNoteFromProject, getProject } from '../../../../lib/data';

type Data =
  | { success: true }
  | { success: false; error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const { projectId, noteId } = req.query as {
    projectId: string;
    noteId: string;
  };

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res
      .status(405)
      .json({ success: false, error: `Method ${req.method} Not Allowed` });
  }

  const project = getProject(projectId);
  if (!project) {
    return res
      .status(404)
      .json({ success: false, error: 'Project not found' });
  }

  const updated = removeNoteFromProject(projectId, noteId);
  if (!updated) {
    return res
      .status(404)
      .json({ success: false, error: 'Note not found or could not be removed' });
  }

  return res.status(200).json({ success: true });
}
