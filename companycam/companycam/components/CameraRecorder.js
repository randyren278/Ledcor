import { useEffect, useRef, useState } from "react";
export default function CameraRecorder({ onFinish }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [stream, setStream] = useState(null);
  const [countdown, setCountdown] = useState(-1);
  const [images, setImages] = useState([]);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      videoRef.current.srcObject = s;
      setStream(s);
    })();
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  function startCountdown() {
    setCountdown(3);
    const int = setInterval(() => {
      setCountdown((c) => {
        if (c === 1) { clearInterval(int); beginRecord(); return -1; }
        return c - 1;
      });
    }, 1000);
  }

  function beginRecord() {
    const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRecorderRef.current = rec;
    chunksRef.current = [];
    rec.ondataavailable = (e) => chunksRef.current.push(e.data);
    rec.start();
    setRecording(true);
  }

  function takePhoto() {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
      setImages((imgs) => [...imgs, file]);
    }, "image/jpeg", 0.9);
  }

  function endRecord() {
    const rec = mediaRecorderRef.current;
    if (!rec) return;
    rec.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, { type: "audio/webm" });
      onFinish({ audio: audioFile, images });
      setRecording(false); setImages([]);
    };
    rec.stop();
  }

  return (
    <div className="flex flex-col items-center space-y-4 relative">
      {}
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{ transform: "scaleX(-1)" }}
        className="w-full max-w-md rounded-lg shadow"
      />
      {countdown > 0 && <div className="absolute text-5xl font-bold text-white drop-shadow-xl">{countdown}</div>}
      <div className="flex space-x-4">
        {!recording ? (
          <button onClick={startCountdown} className="px-4 py-2 bg-green-600 text-white rounded-lg">Start</button>
        ) : (
          <>
            <button onClick={takePhoto} className="px-4 py-2 bg-blue-500 text-white rounded-lg">Snap Photo</button>
            <button onClick={endRecord} className="px-4 py-2 bg-red-600 text-white rounded-lg">End Record</button>
          </>
        )}
      </div>
    </div>
  );
}