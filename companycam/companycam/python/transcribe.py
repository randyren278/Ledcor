#!/usr/bin/env python3
import os
import sys
import json
import logging
from faster_whisper import WhisperModel

# Set up logging to stderr so it doesn't interfere with JSON output
logging.basicConfig(level=logging.WARNING, stream=sys.stderr)

def main():
    # Check if audio file path is provided and exists
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python transcribe.py <audio_file_path>"}))
        sys.exit(1)
    
    audio_path = sys.argv[1]
    if not os.path.exists(audio_path):
        print(json.dumps({"error": f"Audio file not found: {audio_path}"}))
        sys.exit(1)
    
    try:
        # Configuration from environment variables with sensible defaults
        model_size = os.getenv("WHISPER_MODEL_SIZE", "base")  # Use base for speed, large-v3 for accuracy
        device = os.getenv("WHISPER_DEVICE", "cpu")
        compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
        
        # Log configuration to stderr
        sys.stderr.write(f"Loading {model_size} model on {device} with {compute_type}\n")
        sys.stderr.flush()
        
        # Initialize the model
        model = WhisperModel(
            model_size, 
            device=device, 
            compute_type=compute_type
        )
        
        sys.stderr.write("Starting transcription...\n")
        sys.stderr.flush()
        
        # Transcribe with optimized settings
        segments, info = model.transcribe(
            audio_path,
            beam_size=1,  # Faster processing (use 5 for better accuracy)
            language=None,  # Auto-detect language
            word_timestamps=False,  # Disable for speed
            vad_filter=True,  # Remove silence automatically
            vad_parameters=dict(
                min_silence_duration_ms=500,
                speech_pad_ms=200
            )
        )
        
        # Extract text from segments
        text_segments = []
        for segment in segments:
            text_segments.append(segment.text.strip())
        
        full_text = " ".join(text_segments).strip()
        
        # Output result as JSON
        result = {
            "success": True,
            "language": info.language,
            "language_probability": info.language_probability,
            "text": full_text,
            "duration": info.duration
        }
        
        print(json.dumps(result, ensure_ascii=False))
        
    except Exception as e:
        # Output error as JSON
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()