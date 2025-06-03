import { useRouter } from "next/router";
import { useState } from "react";
import CameraRecorder from "../../../components/CameraRecorder";
export default function CreateNote() {
  const { query: { id } } = useRouter();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  async function handleFinish({ audio, images }) {
    try {
      setStatus("uploading");
      const formData = new FormData();
      formData.append("projectId", id);
      formData.append("audio", audio);
      images.forEach((img) => formData.append("images", img));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      location.href = `/project/${id}`;
    } catch (e) { setError(e.message); setStatus("error"); }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Create Note</h1>
      {status === "idle" && <CameraRecorder onFinish={handleFinish} />}
      {status === "uploading" && <p>Uploading & processing…</p>}
      {status === "error" && <p className="text-red-600">Error: {error}</p>}
    </main>
  );
}