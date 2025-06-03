import nextConnect from "next-connect";
import multer from "multer";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getProject } from "../../lib/data";

const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({ 
  destination: uploadDir, 
  filename: (_, f, cb) => cb(null, `${Date.now()}_${f.originalname}`) 
});

const upload = multer({ storage });

const handler = nextConnect({ 
  onError: (err, req, res) => {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Use upload.fields() to handle multiple field types
handler.use(upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]));

// Function to run Python transcription script
function transcribeAudio(audioPath) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(),'python', 'transcribe.py');
    
    console.log('Running transcription script:', scriptPath);
    console.log('Audio file:', audioPath);
    
    const pythonProcess = spawn('python3', [scriptPath, audioPath], {
      env: {
        ...process.env,
        WHISPER_MODEL_SIZE: 'base',  // Use 'large-v3' for better accuracy
        WHISPER_DEVICE: 'cpu',       // Change to 'cuda' if you have GPU
        WHISPER_COMPUTE_TYPE: 'int8' // Use 'float16' for GPU
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('Transcription progress:', data.toString().trim());
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout.trim());
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error));
          }
        } catch (e) {
          reject(new Error(`Failed to parse transcription result: ${e.message}`));
        }
      } else {
        reject(new Error(`Transcription failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start transcription: ${error.message}`));
    });
  });
}

// Simple function to create a note (replace with your actual createNote logic)
async function createNote(audioPath, imagePaths, transcriptionResult) {
  const timestamp = new Date().toISOString();
  
  return {
    id: Date.now().toString(),
    timestamp,
    audio: path.basename(audioPath),
    images: imagePaths.map(p => path.basename(p)),
    transcription: transcriptionResult.text,
    language: transcriptionResult.language,
    summary: `Audio note recorded in ${transcriptionResult.language}`, // You can enhance this
    insights: [`Duration: ${Math.round(transcriptionResult.duration)}s`] // Basic insight
  };
}

handler.post(async (req, res) => {
  console.log('Upload request received');
  console.log('Body:', req.body);
  console.log('Files:', req.files);

  const { projectId } = req.body;
  
  if (!projectId) {
    return res.status(400).json({ error: "Project ID is required" });
  }

  const project = getProject(projectId);
  if (!project) {
    return res.status(400).json({ error: "Invalid project" });
  }

  try {
    // Extract file paths
    const audioFile = req.files?.audio?.[0];
    const imageFiles = req.files?.images || [];
    
    if (!audioFile) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    console.log('Processing note with:', {
      audioPath: audioFile.path,
      imagePaths: imageFiles.map(f => f.path)
    });

    // Transcribe audio using local Python script
    console.log('Starting local transcription...');
    const transcriptionResult = await transcribeAudio(audioFile.path);
    console.log('Transcription completed:', transcriptionResult);

    // Create note with transcription
    const note = await createNote(
      audioFile.path, 
      imageFiles.map((f) => f.path),
      transcriptionResult
    );
    
    project.notes.push(note);
    
    console.log('Note created successfully');
    res.json({ ok: true, note });
    
  } catch (e) { 
    console.error('Processing error:', e); 
    res.status(500).json({ error: e.message }); 
  }
});

export const config = { api: { bodyParser: false } };
export default handler;