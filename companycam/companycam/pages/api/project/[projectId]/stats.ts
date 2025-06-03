// /pages/api/project/[projectId]/stats.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getProjectStats } from '../../../../lib/data';
import type { Stats } from '../../../../types';

type Data = 
  | { stats: Stats }
  | { error: string };

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { projectId } = req.query as { projectId: string };
  
  const stats = getProjectStats(projectId);
  if (!stats) {
    return res.status(404).json({ error: 'Project not found' });
  }

  return res.status(200).json({ stats });
}