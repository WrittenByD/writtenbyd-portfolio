# WrittenByD Audio Stem Tool

A local Python/Gradio tool for separating tracks into vocals, melody/other, drums, and bass, while estimating BPM/key and organizing the exports.

## Windows quick start

1. Install Python 3.11.
2. Install FFmpeg and make sure `ffmpeg` works from Command Prompt or PowerShell.
3. Extract this ZIP somewhere on your computer.
4. Double-click `setup_windows.bat`.
5. After setup completes, double-click `run_windows.bat`.
6. Your browser will open the local Gradio interface, normally at `http://127.0.0.1:7860`.

## What it does

- Processes one or more audio files
- Estimates BPM and musical key
- Separates vocals, drums, bass, and other/melody with Demucs
- Renames outputs consistently
- Packages processed stems into a ZIP
- Supports cancellation of the active Demucs job

## Supported input formats

MP3, WAV, FLAC, and M4A.

## Requirements

- Windows 10/11
- Python 3.11
- FFmpeg
- Internet access during first setup so Python can download the required packages

## Notes

BPM/key detection is an estimate. Samples, ambiguous harmony, dense mixes, and heavy 808s can reduce accuracy.

The tool runs locally. Your audio files are processed on your own computer and are not uploaded to WrittenByD.
