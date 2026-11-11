---
title: WrittenByD Audio Stem Tool
emoji: 🎚️
colorFrom: purple
colorTo: yellow
sdk: gradio
python_version: "3.11"
app_file: app.py
pinned: false
---

# WrittenByD Audio Stem Tool

A Python/Gradio workflow for music-production prep.

## What it does

- Upload one or more tracks
- Estimate BPM and musical key
- Split each track with Demucs into vocals, drums, bass, and other/melody
- Rename stems consistently
- Package processed stems into a downloadable ZIP
- Allow cancellation of the active Demucs process

## Stack

Python, Gradio, Demucs, librosa, NumPy, FFmpeg.

## Run locally

Install Python 3.11 and FFmpeg, then from this folder:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install gradio -r requirements.txt
python app.py
```

The app will normally open at:

```text
http://127.0.0.1:7860
```

## Notes

BPM and key detection are estimates. Dense mixes, ambiguous harmony, samples, and heavy 808s can reduce accuracy.

The public/web version returns a ZIP instead of writing directly into user-selected local folders. That keeps the hosted version portable and browser-safe.
