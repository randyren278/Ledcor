// /pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getProject, addNoteToProject } from '../../lib/data';
import { Note, TranscriptionResult, UploadResponse } from '../../types';
import PDFDocument from 'pdfkit';

// Extend NextApiRequest so we get `files`
interface ExtendedNextApiRequest extends NextApiRequest {
  files?: {
    audio?: Express.Multer.File[];
    images?: Express.Multer.File[];
  };
}

// Are we in production on Vercel?
const isProd = process.env.NODE_ENV === 'production';

// Choose an upload folder that’s writable:
const baseDir = isProd ? os.tmpdir() : path.join(process.cwd(), 'public');
const uploadDir = path.join(baseDir, 'uploads');
const reportsDir = path.join(baseDir, 'reports');

// Create the folders if they don’t exist yet
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});
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

// -------------- NOTE CREATION --------------
async function createNote(
  audioPath: string,
  imagePaths: string[],
  transcriptionResult: TranscriptionResult
): Promise<Note> {
  const timestamp = new Date().toISOString();
  const audioBasename = path.basename(audioPath);
  const imageBasenames = imagePaths.map(p => path.basename(p));

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
    audio: audioBasename,
    images: imageBasenames,
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
  projectName: string,
  fullImagePaths: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const pdfFilename = `${note.id}.pdf`;
      const pdfPath = path.join(reportsDir, pdfFilename);
      const doc = new PDFDocument({ autoFirstPage: true });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

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

      // Images
      if (fullImagePaths.length > 0) {
        doc.addPage();
        doc.fontSize(14).text('Attached Images:', { underline: true });
        doc.moveDown(0.5);

        const maxW = 250;
        const maxH = 250;
        let x = doc.page.margins.left;
        let y = doc.y;

        fullImagePaths.forEach((imgPath, idx) => {
          try {
            if (fs.existsSync(imgPath)) {
              doc.image(imgPath, x, y, { fit: [maxW, maxH] });
            }
          } catch (e) {
            console.warn(`Could not embed ${imgPath}:`, e);
          }
          x += maxW + 20;
          if ((idx + 1) % 2 === 0) {
            x = doc.page.margins.left;
            y += maxH + 20;
            if (y + maxH > doc.page.height - doc.page.margins.bottom) {
              doc.addPage();
              y = doc.page.margins.top;
            }
          }
        });
      }

      doc.end();
      writeStream.on('finish', () => {
        const buf = fs.readFileSync(pdfPath);
        const base64Pdf = buf.toString('base64');
        resolve(base64Pdf);
      });
      writeStream.on('error', (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// -------------- THE POST HANDLER --------------
handler.post(async (req: ExtendedNextApiRequest, res) => {
  console.log('Upload request (prod? ' + isProd + ')');
  const { projectId } = req.body;
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ ok: false, error: 'Project ID is required' });
  }

  try {
    const project = getProject(projectId);
    if (!project) {
      return res.status(404).json({ ok: false, error: 'Project not found' });
    }

    const audioFile = req.files?.audio?.[0];
    const imageFiles = req.files?.images || [];
    if (!audioFile) {
      return res.status(400).json({ ok: false, error: 'Audio file is required' });
    }

    if (!fs.existsSync(audioFile.path)) {
      return res.status(500).json({ ok: false, error: 'Uploaded audio not found on disk' });
    }

    const transcriptionText = typeof req.body.transcription === 'string' ? req.body.transcription : '';
    const durationNum = req.body.duration ? parseFloat(req.body.duration) : undefined;
    const transcriptionResult: TranscriptionResult = {
      success: true,
      language: 'en',
      language_probability: 1,
      text: transcriptionText,
      duration: durationNum
    };

    // Build Note
    const note = await createNote(
      audioFile.path,
      imageFiles.map(f => f.path),
      transcriptionResult
    );

    // Add to project
    const updated = addNoteToProject(projectId, note);
    if (!updated) {
      return res.status(500).json({ ok: false, error: 'Failed to attach note to project' });
    }

    // Generate PDF → base64
    const fullImagePaths = imageFiles.map(f => path.resolve(f.path));
    let pdfBase64 = '';
    try {
      pdfBase64 = await generatePdfReport(note, project.name, fullImagePaths);
    } catch (pdfErr) {
      console.error('PDF generation failed:', pdfErr);
    }

    // Return the note + PDF (base64) in JSON
    return res.status(200).json({
      ok: true,
      note,
      pdfBase64
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

