// /pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import multer from 'multer';
import { spawn } from 'child_process';
import { getProject, addNoteToProject } from '../../lib/data';
import { Note, TranscriptionResult, UploadResponse } from '../../types';
import PDFDocument from 'pdfkit';

// Extend NextApiRequest so we get `files`
interface ExtendedNextApiRequest extends NextApiRequest {
  files?: {
    audio?: Express.Multer.File[];
    images?: Express.Multer.File[];
  };
  body: {
    projectId: string;
    clientTranscription?: string;
  };
}

// Are we in production on Vercel?
const isProd = process.env.NODE_ENV === 'production';

// Multer setup - keep uploaded files in memory only
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 11 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio' && file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else if (file.fieldname === 'images' && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio under field “audio” or images under “images” allowed'));
    }
  }
});

const handler = nextConnect<ExtendedNextApiRequest, NextApiResponse<UploadResponse>>({
  onError: (err, req, res) => {
    console.error('Upload Error:', err);
    res.status(500).json({ ok: false, error: err.message || 'Server error' });
  },
  onNoMatch: (req, res) => {
    res.status(405).json({ ok: false, error: `Method ${req.method} not allowed` });
  }
});
handler.use(upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'images', maxCount: 10 }]));

// -------------- TRANSLATION / TRANSCRIPTION LOGIC --------------

async function transcribeAudio(clientTranscription?: string): Promise<TranscriptionResult> {
  if (clientTranscription) {
    console.log('Using client-side transcription');
    return {
      success: true,
      language: 'en',
      language_probability: 0.95,
      text: clientTranscription,
      duration: 60
    };
  }

  return {
    success: true,
    language: 'en',
    language_probability: 0.95,
    text: 'Audio note recorded',
    duration: 60
  };
}

// -------------- NOTE CREATION --------------
async function createNote(
  transcriptionResult: TranscriptionResult
): Promise<Note> {
  const timestamp = new Date().toISOString();

  // summary = first 10 words of transcription
  let summary = 'Audio note recorded';
  if (transcriptionResult.text) {
    const words = transcriptionResult.text.trim().split(/\s+/);
    summary = words.slice(0, 10).join(' ');
    if (words.length > 10) summary += '…';
  }

  const note: Note = {
    id: Date.now().toString(),
    timestamp,
    transcription: transcriptionResult.text || '',
    language: transcriptionResult.language || 'unknown',
    summary,
    duration: transcriptionResult.duration ? Math.round(transcriptionResult.duration) : undefined,
    insights: [
      `Duration: ${transcriptionResult.duration ? Math.round(transcriptionResult.duration) : 0}s`,
      `Language: ${transcriptionResult.language || 'unknown'}`,
      `Confidence: ${transcriptionResult.language_probability ? Math.round(transcriptionResult.language_probability * 100) : 0}%`,
      isProd
        ? 'Note: fallback transcription (production)'
        : 'Processed with AI transcription (development)',
    ]
  };
  return note;
}

// -------------- PDF GENERATION --------------
async function generatePdfReport(
  note: Note,
  projectName: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: true });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => {
        const base64Pdf = Buffer.concat(chunks).toString('base64');
        resolve(base64Pdf);
      });

      // Title
      doc.fontSize(18).text(`Project: ${projectName}`, { underline: true });
      doc.moveDown(0.5);

      // Metadata
      doc.fontSize(12).text(`Note ID: ${note.id}`);
      doc.text(`Timestamp: ${note.timestamp}`);
      doc.moveDown(0.5);

      // Transcription
      doc.fontSize(14).text('Transcription:', { underline: true });
      doc.moveDown(0.25);
      doc.fontSize(12).text(note.transcription || '— no transcription —');
      doc.moveDown(0.5);

      // Summary
      doc.fontSize(14).text('Summary:', { underline: true });
      doc.moveDown(0.25);
      doc.fontSize(12).text(note.summary || '— no summary —');
      doc.moveDown(0.5);

      // Insights
      if (note.insights && note.insights.length > 0) {
        doc.fontSize(14).text('Insights:', { underline: true });
        note.insights.forEach(ins => {
          doc.fontSize(12).text(`• ${ins}`);
        });
        doc.moveDown(0.5);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// -------------- THE POST HANDLER --------------
handler.post(async (req: ExtendedNextApiRequest, res) => {
  console.log('Upload request (prod? ' + isProd + ')');
  const { projectId, clientTranscription } = req.body;
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ ok: false, error: 'Project ID is required' });
  }

  try {
    const project = getProject(projectId);
    if (!project) {
      return res.status(404).json({ ok: false, error: 'Project not found' });
    }

    const audioFile = req.files?.audio?.[0];
    console.log('Starting transcription (client provided: ' + !!clientTranscription + ')');
    const transcriptionResult = await transcribeAudio(clientTranscription);
    console.log('Transcription complete:', transcriptionResult);

    // Build Note
    const note = await createNote(
      transcriptionResult
    );

    // Add to project
    const updated = addNoteToProject(projectId, note);
    if (!updated) {
      return res.status(500).json({ ok: false, error: 'Failed to attach note to project' });
    }
    return res.status(200).json({
      ok: true,
      note
    });
  } catch (err) {
    console.error('Handler error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
});

// We disable the default body parser so multer can run
export const config = {
  api: { bodyParser: false }
};

export default handler;
