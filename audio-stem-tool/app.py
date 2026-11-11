from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import uuid
import zipfile

import gradio as gr
import librosa
import numpy as np


cancel_event = threading.Event()
process_lock = threading.Lock()
current_process = None


def clean_filename(text: str) -> str:
    text = (text or "").strip()
    text = re.sub(r'[<>:"/\\|?*]', "", text)
    text = re.sub(r"\s+", " ", text)
    return text or "track"


def detect_bpm_and_key(audio_path: str):
    y, sr = librosa.load(audio_path, mono=True, duration=180)

    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = int(round(float(np.asarray(tempo).reshape(-1)[0])))

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = np.mean(chroma, axis=1)

    major_profile = np.array([
        6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
        2.52, 5.19, 2.39, 3.66, 2.29, 2.88
    ])
    minor_profile = np.array([
        6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
        2.54, 4.75, 3.98, 2.69, 3.34, 3.17
    ])
    notes = [
        "C", "C#", "D", "D#", "E", "F",
        "F#", "G", "G#", "A", "A#", "B"
    ]

    scores = []
    for i in range(12):
        scores.append((np.corrcoef(chroma_mean, np.roll(major_profile, i))[0, 1], notes[i], "Major"))
        scores.append((np.corrcoef(chroma_mean, np.roll(minor_profile, i))[0, 1], notes[i], "Minor"))

    _, note, mode = max(scores, key=lambda item: item[0])
    return bpm, f"{note} {mode}"


def run_demucs(audio_path: Path, output_root: Path):
    global current_process

    command = [
        sys.executable,
        "-m",
        "demucs",
        "-n",
        "htdemucs",
        "--out",
        str(output_root),
        str(audio_path),
    ]

    with process_lock:
        current_process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )

    stdout, _ = current_process.communicate()
    return_code = current_process.returncode

    with process_lock:
        current_process = None

    if cancel_event.is_set():
        raise RuntimeError("Processing cancelled.")

    if return_code != 0:
        raise RuntimeError(f"Demucs failed.\n\n{stdout[-3000:]}")



def find_stem_folder(output_root: Path, audio_path: Path) -> Path:
    expected = output_root / "htdemucs" / audio_path.stem
    if expected.exists():
        return expected

    candidates = list((output_root / "htdemucs").glob("*"))
    if len(candidates) == 1:
        return candidates[0]

    raise FileNotFoundError("Could not locate the Demucs stem output folder.")


def make_zip(folder: Path) -> str:
    zip_path = folder.parent / f"{folder.name}.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for file_path in folder.rglob("*"):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(folder))
    return str(zip_path)


def analyze_files(files):
    if not files:
        return "Choose at least one audio file.", []

    rows = []
    for file_path in files:
        path = Path(file_path)
        bpm, key = detect_bpm_and_key(str(path))
        rows.append([path.name, bpm, key])

    return f"Analyzed {len(rows)} track(s).", rows


def cancel_processing():
    global current_process

    cancel_event.set()

    with process_lock:
        if current_process and current_process.poll() is None:
            current_process.terminate()

    return "Cancellation requested. Finishing cleanup..."


def process_files(files):
    if not files:
        yield "Choose at least one audio file.", [], None
        return

    cancel_event.clear()

    job_root = Path(tempfile.mkdtemp(prefix="writtenbyd_stems_"))
    export_root = job_root / "exports"
    export_root.mkdir(parents=True, exist_ok=True)

    rows = []

    try:
        total = len(files)

        for index, file_path in enumerate(files, start=1):
            if cancel_event.is_set():
                raise RuntimeError("Processing cancelled.")

            audio_path = Path(file_path)
            base = clean_filename(audio_path.stem)

            yield f"[{index}/{total}] Analyzing {audio_path.name}...", rows, None
            bpm, key = detect_bpm_and_key(str(audio_path))
            rows.append([audio_path.name, bpm, key])

            yield f"[{index}/{total}] Separating stems for {audio_path.name}...", rows, None

            demucs_root = job_root / f"demucs_{uuid.uuid4().hex[:8]}"
            run_demucs(audio_path, demucs_root)

            stem_folder = find_stem_folder(demucs_root, audio_path)
            track_export = export_root / base
            track_export.mkdir(parents=True, exist_ok=True)

            stem_map = {
                "vocals.wav": "Vocals",
                "other.wav": "Melody",
                "drums.wav": "Drums",
                "bass.wav": "Bass",
            }

            for source_name, stem_label in stem_map.items():
                source = stem_folder / source_name
                if not source.exists():
                    raise FileNotFoundError(f"Missing expected stem: {source_name}")

                output_name = f"{base} - {bpm} BPM - {key} - {stem_label}.wav"
                shutil.copy2(source, track_export / output_name)

        zip_path = make_zip(export_root)
        yield f"Done. Processed {len(rows)} track(s).", rows, zip_path

    except Exception as error:
        yield str(error), rows, None


with gr.Blocks(title="WrittenByD Audio Stem Tool") as demo:
    gr.Markdown(
        """
# Audio Stem Tool
Split tracks into **vocals, melody/other, drums, and bass**, estimate BPM/key,
rename the outputs, and download everything as a ZIP.

Built with Python, Gradio, Demucs, librosa, and FFmpeg.
"""
    )

    audio_files = gr.File(
        label="Choose audio files",
        file_types=[".mp3", ".wav", ".flac", ".m4a"],
        file_count="multiple",
        type="filepath",
    )

    with gr.Row():
        analyze_button = gr.Button("Analyze BPM / Key")
        process_button = gr.Button("Process Stems", variant="primary")
        cancel_button = gr.Button("Cancel")

    status = gr.Textbox(label="Status", value="Ready.", interactive=False)
    summary = gr.Dataframe(
        headers=["Track", "BPM", "Key"],
        datatype=["str", "number", "str"],
        label="Analysis",
        interactive=False,
    )
    download = gr.File(label="Download processed stems")

    analyze_button.click(
        fn=analyze_files,
        inputs=[audio_files],
        outputs=[status, summary],
    )

    process_button.click(
        fn=process_files,
        inputs=[audio_files],
        outputs=[status, summary, download],
        concurrency_limit=1,
        concurrency_id="stem-processing",
    )

    cancel_button.click(
        fn=cancel_processing,
        outputs=[status],
        queue=False,
    )


if __name__ == "__main__":
    demo.queue(default_concurrency_limit=2).launch()
