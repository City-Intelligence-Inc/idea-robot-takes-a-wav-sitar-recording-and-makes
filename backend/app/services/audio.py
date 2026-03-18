"""
Sitar / Sarod + Tabla AI Pipeline
==================================
Analyzes a .wav recording, generates matching tabla patterns, and outputs a mixed .wav.

NO API KEYS REQUIRED for the core pipeline.
"""

import io
import numpy as np
import librosa
import soundfile as sf
from scipy.ndimage import gaussian_filter1d
import pretty_midi
import warnings

warnings.filterwarnings("ignore")


# ---------------------------------------------------------------------------
# 1. AUDIO ANALYSIS
# ---------------------------------------------------------------------------

def analyze_sitar(y: np.ndarray, sr: int) -> dict:
    """
    Analyze a sitar/sarod audio signal and extract:
      - beat-by-beat BPM curve (raw + smoothed)
      - beat timestamps
      - section labels (alap / jod / jhala) per beat
      - estimated tonic (Sa) in Hz
      - overall duration
    """
    duration = librosa.get_duration(y=y, sr=sr)

    # Tempo and beat tracking
    hop = 512
    tempo_result, beat_frames = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop, tightness=80)
    # librosa >= 0.10 returns tempo as an array
    tempo = float(np.atleast_1d(tempo_result)[0])
    beat_times = librosa.frames_to_time(beat_frames, sr=sr, hop_length=hop)

    # Compute local BPM between consecutive beats
    if len(beat_times) > 1:
        ibi = np.diff(beat_times)
        raw_bpm = 60.0 / np.clip(ibi, 0.2, 5.0)
        smooth_bpm = gaussian_filter1d(raw_bpm, sigma=3)
        raw_bpm = np.concatenate([[raw_bpm[0]], raw_bpm])
        smooth_bpm = np.concatenate([[smooth_bpm[0]], smooth_bpm])
    else:
        raw_bpm = smooth_bpm = np.array([float(tempo)])

    # Section detection (alap / jod / jhala) based on onset density
    onset_frames = librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop)
    onset_times = librosa.frames_to_time(onset_frames, sr=sr, hop_length=hop)
    sections = _detect_sections(beat_times, onset_times, duration)

    # Tonic (Sa) estimation via chroma
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    tonic_class = int(np.argmax(chroma.mean(axis=1)))
    tonic_hz = librosa.midi_to_hz(librosa.note_to_midi("C4") + tonic_class)

    return {
        "y": y, "sr": sr, "duration": duration,
        "beat_times": beat_times,
        "raw_bpm": raw_bpm,
        "smooth_bpm": smooth_bpm,
        "sections": sections,
        "tonic_class": tonic_class,
        "tonic_hz": tonic_hz,
        "global_tempo": float(tempo),
    }


def _detect_sections(beat_times, onset_times, duration, window=8.0):
    """
    Label each beat as 'alap', 'jod', or 'jhala' based on local onset density.
    alap  : sparse, free-tempo intro — no tabla
    jod   : medium density — light theka
    jhala : dense, fast — full tabla
    """
    sections = []
    for bt in beat_times:
        lo, hi = bt - window / 2, bt + window / 2
        count = np.sum((onset_times >= lo) & (onset_times <= hi))
        density = count / window
        if density < 1.5:
            sections.append("alap")
        elif density < 4.0:
            sections.append("jod")
        else:
            sections.append("jhala")
    return sections


# ---------------------------------------------------------------------------
# 2. TAAL PATTERNS
# ---------------------------------------------------------------------------

TAAL_PATTERNS = {
    "teentaal": {
        "beats": 16,
        "bols": [
            ("dha", 1.0), ("dhin", 0.7), ("dhin", 0.7), ("dha", 0.7),
            ("dha", 0.7), ("dhin", 0.7), ("dhin", 0.7), ("dha", 0.7),
            ("dha", 0.7), ("tin", 0.4), ("tin", 0.4), ("ta", 0.4),
            ("ta", 0.4), ("dhin", 0.7), ("dhin", 0.7), ("dha", 0.7),
        ],
    },
    "ektaal": {
        "beats": 12,
        "bols": [
            ("dhin", 1.0), ("dhin", 0.7), ("age", 0.7), ("trkit", 0.7),
            ("tu", 0.7), ("na", 0.4), ("kat", 0.4), ("ta", 0.4),
            ("age", 0.7), ("trkit", 0.7), ("dhin", 0.7), ("dhin", 0.7),
        ],
    },
    "rupak": {
        "beats": 7,
        "bols": [
            ("tin", 0.4), ("tin", 0.4), ("na", 0.4),
            ("dhi", 1.0), ("na", 0.7),
            ("dhi", 0.7), ("na", 0.7),
        ],
    },
    "jhaptaal": {
        "beats": 10,
        "bols": [
            ("dhi", 1.0), ("na", 0.7),
            ("dhi", 0.7), ("dhi", 0.7), ("na", 0.7),
            ("tin", 0.4), ("na", 0.4),
            ("dhi", 0.7), ("dhi", 0.7), ("na", 0.7),
        ],
    },
    "keherwa": {
        "beats": 8,
        "bols": [
            ("dha", 1.0), ("ge", 0.7), ("na", 0.7), ("ti", 0.7),
            ("na", 0.4), ("ke", 0.4), ("dhi", 0.7), ("na", 0.7),
        ],
    },
}

VALID_TAALS = list(TAAL_PATTERNS.keys())

# Map bol names to General MIDI percussion note numbers
BOL_TO_MIDI = {
    "dha": 41, "dhin": 41, "dhi": 41,
    "ge": 36, "kat": 38,
    "tin": 42, "ta": 42, "ti": 42,
    "na": 37, "tu": 37, "ke": 36,
    "age": 38, "trkit": 39,
}


# ---------------------------------------------------------------------------
# 3. TABLA MIDI GENERATION
# ---------------------------------------------------------------------------

def generate_tabla_midi(analysis: dict, taal: str = "teentaal") -> pretty_midi.PrettyMIDI:
    """
    Generate a tabla MIDI track that follows the sitar's tempo curve.
    Sections labeled 'alap' get silence; 'jod' gets sparse theka; 'jhala' full pattern.
    """
    if taal not in TAAL_PATTERNS:
        raise ValueError(f"Unknown taal '{taal}'. Choose from: {VALID_TAALS}")

    pattern = TAAL_PATTERNS[taal]
    n_beats = pattern["beats"]
    bols = pattern["bols"]

    beat_times = analysis["beat_times"]
    smooth_bpm = analysis["smooth_bpm"]
    sections = analysis["sections"]
    duration = analysis["duration"]

    midi = pretty_midi.PrettyMIDI(initial_tempo=float(smooth_bpm[0]))
    drum_track = pretty_midi.Instrument(program=0, is_drum=True, name="Tabla")

    beat_idx = 0
    taal_pos = 0

    while beat_idx < len(beat_times):
        t_start = beat_times[beat_idx]
        t_end = beat_times[beat_idx + 1] if beat_idx + 1 < len(beat_times) else duration

        section = sections[beat_idx] if beat_idx < len(sections) else "jod"

        if section == "alap":
            beat_idx += 1
            taal_pos = (taal_pos + 1) % n_beats
            continue

        bol, accent = bols[taal_pos % n_beats]

        if section == "jod" and taal_pos % 2 != 0:
            beat_idx += 1
            taal_pos = (taal_pos + 1) % n_beats
            continue

        pitch = BOL_TO_MIDI.get(bol, 38)
        velocity = int(np.clip(accent * 100, 40, 127))
        note_dur = max(0.05, (t_end - t_start) * 0.9)

        note = pretty_midi.Note(
            velocity=velocity, pitch=pitch,
            start=t_start, end=t_start + note_dur,
        )
        drum_track.notes.append(note)

        beat_idx += 1
        taal_pos = (taal_pos + 1) % n_beats

    midi.instruments.append(drum_track)
    return midi


# ---------------------------------------------------------------------------
# 4. MIDI → AUDIO SYNTHESIS
# ---------------------------------------------------------------------------

def midi_to_audio(midi: pretty_midi.PrettyMIDI, sr: int = 44100) -> np.ndarray:
    """
    Render MIDI to audio via FluidSynth; falls back to sine approximation.
    """
    try:
        audio = midi.fluidsynth(fs=sr)
        return audio.astype(np.float32)
    except Exception:
        return _sine_synth(midi, sr)


def _sine_synth(midi: pretty_midi.PrettyMIDI, sr: int) -> np.ndarray:
    """Minimal sine-wave fallback synthesis (no FluidSynth needed)."""
    duration = midi.get_end_time() + 0.5
    audio = np.zeros(int(duration * sr), dtype=np.float32)
    for inst in midi.instruments:
        for note in inst.notes:
            freq = librosa.midi_to_hz(note.pitch)
            t = np.linspace(0, note.end - note.start,
                            int((note.end - note.start) * sr), endpoint=False)
            env = np.exp(-5 * t)
            wave = (note.velocity / 127.0) * env * np.sin(2 * np.pi * freq * t)
            start_sample = int(note.start * sr)
            end_sample = start_sample + len(wave)
            if end_sample <= len(audio):
                audio[start_sample:end_sample] += wave
    return audio


# ---------------------------------------------------------------------------
# 5. MIX + OUTPUT
# ---------------------------------------------------------------------------

def _simple_reverb(y: np.ndarray, sr: int, wet: float = 0.3,
                   delays_ms=(20, 37, 54, 80), decay=0.4) -> np.ndarray:
    """Multi-tap comb filter reverb."""
    out = y.copy()
    for d_ms in delays_ms:
        d_samp = int(d_ms / 1000 * sr)
        delayed = np.pad(y, (d_samp, 0))[:len(y)]
        out += wet * decay * delayed
        decay *= 0.7
    return out


def mix_tracks(
    sitar_y: np.ndarray,
    tabla_y: np.ndarray,
    sr: int,
    tabla_level: float = 0.6,
    reverb_amount: float = 0.3,
) -> np.ndarray:
    """Mix sitar + tabla, apply reverb, normalize."""
    # Match lengths
    length = max(len(sitar_y), len(tabla_y))
    sitar_y = np.pad(sitar_y, (0, length - len(sitar_y)))
    tabla_y = np.pad(tabla_y, (0, length - len(tabla_y)))

    if reverb_amount > 0:
        tabla_y = _simple_reverb(tabla_y, sr, wet=reverb_amount)

    mixed = sitar_y + tabla_level * tabla_y

    peak = np.max(np.abs(mixed))
    if peak > 0:
        mixed = mixed / peak * 0.891  # normalize to -1 dBFS

    return mixed


# ---------------------------------------------------------------------------
# PUBLIC API — used by the /process route
# ---------------------------------------------------------------------------

def _build_section_ranges(beat_times, sections, duration) -> list[dict]:
    """Collapse consecutive beats with the same section label into ranges."""
    if not sections:
        return []

    ranges: list[dict] = []
    current = sections[0]
    start = float(beat_times[0])

    for i in range(1, len(sections)):
        if sections[i] != current:
            ranges.append({
                "section": current,
                "start": round(start, 2),
                "end": round(float(beat_times[i]), 2),
            })
            current = sections[i]
            start = float(beat_times[i])

    # Close last section
    ranges.append({
        "section": current,
        "start": round(start, 2),
        "end": round(float(duration), 2),
    })
    return ranges


def process_sitar_to_tabla(
    input_wav_bytes: bytes,
    taal: str = "teentaal",
    tabla_level: float = 0.6,
    reverb: float = 0.3,
) -> tuple[bytes, dict]:
    """
    Full pipeline: .wav bytes in → analyze → generate tabla → mix → .wav bytes out.
    Returns (output_wav_bytes, analysis_metadata).
    """
    # Decode input wav
    with io.BytesIO(input_wav_bytes) as buf:
        y, sr = sf.read(buf, dtype="float32")

    # If stereo, convert to mono for analysis
    if y.ndim > 1:
        y_mono = y.mean(axis=1)
    else:
        y_mono = y

    # 1 — Analyze
    analysis = analyze_sitar(y_mono, sr)

    # 2 — Generate tabla MIDI
    tabla_midi = generate_tabla_midi(analysis, taal=taal)

    # 3 — Synthesize tabla audio
    tabla_audio = midi_to_audio(tabla_midi, sr=sr)

    # 4 — Mix
    mixed = mix_tracks(y_mono, tabla_audio, sr,
                       tabla_level=tabla_level, reverb_amount=reverb)

    # 5 — Encode to wav bytes
    out_buf = io.BytesIO()
    sf.write(out_buf, mixed, sr, format="WAV", subtype="PCM_24")

    # 6 — Build analysis metadata for the frontend
    section_ranges = _build_section_ranges(
        analysis["beat_times"], analysis["sections"], analysis["duration"]
    )

    note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    metadata = {
        "duration": round(float(analysis["duration"]), 2),
        "global_tempo": round(float(analysis["global_tempo"]), 1),
        "tonic_hz": round(float(analysis["tonic_hz"]), 1),
        "tonic_note": note_names[analysis["tonic_class"]],
        "total_beats": len(analysis["beat_times"]),
        "sections": section_ranges,
        "taal_pattern": [
            bol for bol, _ in TAAL_PATTERNS[taal]["bols"]
        ],
        "taal_beats": TAAL_PATTERNS[taal]["beats"],
    }

    return out_buf.getvalue(), metadata
