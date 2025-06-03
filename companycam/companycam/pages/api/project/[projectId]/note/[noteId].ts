// /pages/api/project/[projectId]/note/[noteId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { removeNoteFromProject, getProject, getNote } from '../../../../../lib/data';
import PDFDocument from 'pdfkit';

function generatePdf(note: any, projectName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => {
        resolve(Buffer.concat(chunks).toString('base64'));
      });

      doc.fontSize(18).text(`Project: ${projectName}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Note ID: ${note.id}`);
      doc.text(`Timestamp: ${note.timestamp}`);
      doc.moveDown(0.5);
      if (note.transcription) {
        doc.fontSize(14).text('Transcription:', { underline: true });
        doc.moveDown(0.25);
        doc.fontSize(12).text(note.transcription);
        doc.moveDown(0.5);
      }
      if (note.summary) {
        doc.fontSize(14).text('Summary:', { underline: true });
        doc.moveDown(0.25);
        doc.fontSize(12).text(note.summary);
        doc.moveDown(0.5);
      }
      if (note.insights && note.insights.length > 0) {
        doc.fontSize(14).text('Insights:', { underline: true });
        note.insights.forEach((ins: string) => doc.fontSize(12).text(`• ${ins}`));
        doc.moveDown(0.5);
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

type Data =
  | { success: true }
  | { success: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Buffer>
) {
  const { projectId, noteId } = req.query as {
    projectId: string;
    noteId: string;
  };

  if (req.method === 'GET') {
    const project = getProject(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, error: 'Project not found' });
    }
    const note = getNote(projectId, noteId);
    if (!note) {
      return res
        .status(404)
        .json({ success: false, error: 'Note not found' });
    }
    const pdf = await generatePdf(note, project.name);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=note-${noteId}.pdf`);
    return res.status(200).send(Buffer.from(pdf, 'base64'));
  }

  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['GET', 'DELETE']);
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
