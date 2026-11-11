# WrittenByD Audio Stem Tool

A local Python/Gradio application for music-production prep.

## What it does

- Process one or more audio tracks
- Estimate BPM and musical key
- Split each track into vocals, drums, bass, and other/melody with Demucs
- Rename stems consistently
- Package processed stems into a downloadable ZIP
- Cancel the active Demucs job

## Stack

Python, Gradio, Demucs, librosa, NumPy, and FFmpeg.

## Download

The WrittenByD project page provides a downloadable local package:

https://writtenbyd.com/audio-stem-tool/

The package includes:

- `app.py`
- `requirements.txt`
- `setup_windows.bat`
- `run_windows.bat`
- `README_LOCAL.md`

## Windows setup

1. Install Python 3.11.
2. Install FFmpeg and make sure it is available in PATH.
3. Extract the downloaded ZIP.
4. Run `setup_windows.bat`.
5. Run `run_windows.bat`.

The Gradio interface normally opens at:

```text
http://127.0.0.1:7860
```

## Privacy

The application runs locally. Audio files are processed on the user's own computer and are not uploaded to WrittenByD.

## Notes

BPM and key detection are estimates. Dense mixes, samples, ambiguous harmony, and heavy 808s can reduce accuracy.
