import { spawnSync } from "child_process";
import path from "path";
export async function createNote(audioPath, imagePaths) {
  const py = spawnSync("python3", ["-u", path.join(process.cwd(), "python", "transcribe.py"), audioPath], { encoding: "utf8" });
  if (py.error) throw py.error;
  if (py.status !== 0) throw new Error(py.stderr || "Transcription failed");
  const { text } = JSON.parse(py.stdout.trim());
  return {
    date: Date.now(),
    text,
    photos: imagePaths.map((p) => path.basename(p))
  };
}
