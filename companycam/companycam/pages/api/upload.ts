// /pages/api/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { getProject, addNoteToProject } from '../../lib/data';
import { Note, TranscriptionResult, UploadResponse } from '../../types';

// ➤ Add this import at the top:
import PDFDocument from 'pdfkit';

// Extend NextApiRequest to include files from multer
interface ExtendedNextApiRequest extends NextApiRequest {
  files?: {
    audio?: Express.Multer.File[];
    images?: Express.Multer.File[];
  };
}

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure reports directory exists
const reportsDir = path.join(process.cwd(), 'public', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, callback) => {
    callback(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 11 // 1 audio + 10 images max
  },
  fileFilter: (req, file, callback) => {
    if (file.fieldname === 'audio') {
      if (file.mimetype.startsWith('audio/')) {
        callback(null, true);
      } else {
        callback(new Error('Audio files only'));
      }
    } else if (file.fieldname === 'images') {
      if (file.mimetype.startsWith('image/')) {
        callback(null, true);
      } else {
        callback(new Error('Image files only'));
      }
    } else {
      callback(new Error('Unexpected field'));
    }
  }
});

// Create next-connect handler with proper typing
const handler = nextConnect<ExtendedNextApiRequest, NextApiResponse<UploadResponse>>({
  onError: (err: Error, req: ExtendedNextApiRequest, res: NextApiResponse<UploadResponse>) => {
    console.error('Upload error:', err);
    res.status(500).json({ 
      ok: false, 
      error: err.message || 'Internal server error' 
    });
  },
  onNoMatch: (req: ExtendedNextApiRequest, res: NextApiResponse<UploadResponse>) => {
    res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} not allowed` 
    });
  }
});

// Use multer middleware to handle file uploads
handler.use(upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]));

// Function to run Python transcription script
function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'python', 'transcribe.py');
    
    console.log('Running transcription script:', scriptPath);
    console.log('Audio file:', audioPath);
    
    if (!fs.existsSync(scriptPath)) {
      reject(new Error('Transcription script not found'));
      return;
    }
    if (!fs.existsSync(audioPath)) {
      reject(new Error('Audio file not found'));
      return;
    }
    
    const pythonProcess = spawn('python3', [scriptPath, audioPath], {
      env: {
        ...process.env,
        WHISPER_MODEL_SIZE: 'base',
        WHISPER_DEVICE: 'cpu',
        WHISPER_COMPUTE_TYPE: 'int8'
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
      console.log('Transcription progress:', data.toString().trim());
    });
    
    pythonProcess.on('close', (code: number | null) => {
      if (code === 0) {
        try {
          const result: TranscriptionResult = JSON.parse(stdout.trim());
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error || 'Transcription failed'));
          }
        } catch (e) {
          const error = e as Error;
          reject(new Error(`Failed to parse transcription result: ${error.message}`));
        }
      } else {
        reject(new Error(`Transcription failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error: Error) => {
      reject(new Error(`Failed to start transcription: ${error.message}`));
    });
    
    // Timeout after 5 minutes
    setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Transcription timed out after 5 minutes'));
    }, 5 * 60 * 1000);
  });
}

// Function to create a note from transcription results
async function createNote(
  audioPath: string, 
  imagePaths: string[], 
  transcriptionResult: TranscriptionResult
): Promise<Note> {
  const timestamp = new Date().toISOString();
  const audioBasename = path.basename(audioPath);
  const imageBasenames = imagePaths.map(p => path.basename(p));
  
  const summary = transcriptionResult.text && transcriptionResult.text.length > 100
    ? `${transcriptionResult.text.substring(0, 100)}...`
    : transcriptionResult.text || 'Audio note recorded';
  
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
      `Confidence: ${transcriptionResult.language_probability ? Math.round(transcriptionResult.language_probability * 100) : 0}%`
    ]
  };
  
  return note;
}

// ➤ Helper: Generate a PDF report for the note
function generatePdfReport(note: Note, projectName: string, fullImagePaths: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    // The PDF filename will be <noteId>.pdf
    const pdfFilename = `${note.id}.pdf`;
    const pdfPath = path.join(reportsDir, pdfFilename);
    
    const doc = new PDFDocument({ autoFirstPage: true });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);
    
    // Add title
    doc.fontSize(18).text(`Project: ${projectName}`, { underline: true });
    doc.moveDown(0.5);
    
    // Note metadata
    doc.fontSize(12).text(`Note ID: ${note.id}`);
    doc.text(`Timestamp: ${note.timestamp}`);
    doc.moveDown(0.5);
    
    // Transcription text
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
      note.insights.forEach(insight => {
        doc.fontSize(12).text(`• ${insight}`);
      });
      doc.moveDown(0.5);
    }
    
    // Images (if any)
    if (fullImagePaths.length > 0) {
      doc.addPage(); // put images on a new page
      doc.fontSize(14).text('Attached Images:', { underline: true });
      doc.moveDown(0.5);
      
      // For each image, embed at most two per page (scaled down)
      const maxWidth = 250;
      const maxHeight = 250;
      let x = doc.page.margins.left;
      let y = doc.y;
      fullImagePaths.forEach((imgPath, idx) => {
        try {
          doc.image(imgPath, x, y, { fit: [maxWidth, maxHeight] });
        } catch (e) {
          // If embedding fails, just skip that image
          console.warn(`Failed to embed image ${imgPath}:`, e);
        }
        x += maxWidth + 20;
        // Move to next row after two images
        if ((idx + 1) % 2 === 0) {
          x = doc.page.margins.left;
          y += maxHeight + 20;
          // If we're too far down, add another page
          if (y + maxHeight > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            y = doc.page.margins.top;
          }
        }
      });
    }
    
    doc.end();
    
    writeStream.on('finish', () => {
      resolve(`/reports/${pdfFilename}`); // Return the public URL path
    });
    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}

// POST handler for file uploads
handler.post(async (req: ExtendedNextApiRequest, res: NextApiResponse<UploadResponse>) => {
  console.log('Upload request received');
  console.log('Body:', req.body);
  console.log('Files:', req.files);

  const { projectId } = req.body;
  
  // Validate required fields
  if (!projectId || typeof projectId !== 'string') {
    return res.status(400).json({ 
      ok: false, 
      error: 'Project ID is required and must be a string' 
    });
  }

  try {
    // Get project and validate it exists
    const project = getProject(projectId);
    if (!project) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Project not found' 
      });
    }

    // Extract uploaded files
    const audioFile = req.files?.audio?.[0];
    const imageFiles = req.files?.images || [];
    
    if (!audioFile) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Audio file is required' 
      });
    }

    console.log('Processing note with:', {
      audioPath: audioFile.path,
      imagePaths: imageFiles.map(f => f.path),
      audioSize: audioFile.size,
      imageCount: imageFiles.length
    });

    // Validate file paths exist
    if (!fs.existsSync(audioFile.path)) {
      return res.status(500).json({ 
        ok: false, 
        error: 'Uploaded audio file not found' 
      });
    }

    // Transcribe audio using local Python script
    console.log('Starting local transcription...');
    const transcriptionResult = await transcribeAudio(audioFile.path);
    console.log('Transcription completed:', {
      success: transcriptionResult.success,
      language: transcriptionResult.language,
      textLength: transcriptionResult.text?.length || 0,
      duration: transcriptionResult.duration
    });

    // Create note with transcription results
    const note = await createNote(
      audioFile.path, 
      imageFiles.map(f => f.path),
      transcriptionResult
    );
    
    // Add note to project
    const updatedProject = addNoteToProject(projectId, note);
    if (!updatedProject) {
      return res.status(500).json({ 
        ok: false, 
        error: 'Failed to add note to project' 
      });
    }
    
    console.log('Note created successfully:', note.id);

    // ➤ Generate a PDF report now that the note exists
    // Convert image file paths to absolute paths:
    const fullImagePaths = imageFiles.map(f => path.resolve(f.path));
    let reportUrl = '';
    try {
      reportUrl = await generatePdfReport(note, project.name, fullImagePaths);
      console.log('PDF report generated at:', reportUrl);
    } catch (pdfErr) {
      console.error('Failed to generate PDF report:', pdfErr);
      // We’ll still return ok: true, but include an error field for the PDF
    }

    // Respond with the created note and (if successful) PDF URL
    res.status(200).json({ 
      ok: true, 
      note,
      reportUrl // e.g. "/reports/1234567890.pdf"
    });
    
  } catch (error) { 
    console.error('Processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({ 
      ok: false, 
      error: errorMessage 
    }); 
  }
});

// Export the API configuration
export const config = { 
  api: { 
    bodyParser: false // Required for multer
  } 
};

export default handler;
