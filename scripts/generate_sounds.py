#!/usr/bin/env python3
"""
Generates the game's audio assets as 16-bit PCM WAV files using only the
Python standard library — chiptune-style effects and seamless BGM loops.

Outputs to src/assets/sounds/ and mirrors them into android/app/src/main/res/raw/.
Run:  python3 scripts/generate_sounds.py
"""

import math
import os
import struct
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "src", "assets", "sounds")
RAW_DIR = os.path.join(ROOT, "android", "app", "src", "main", "res", "raw")

SFX_RATE = 44100
BGM_RATE = 22050


# ---------------------------------------------------------------------------
# Synth primitives
# ---------------------------------------------------------------------------

def note_freq(semitones_from_a4: float) -> float:
    return 440.0 * (2.0 ** (semitones_from_a4 / 12.0))


# Note name -> semitones from A4
NOTE_OFFSETS = {"C": -9, "C#": -8, "D": -7, "D#": -6, "E": -5, "F": -4,
                "F#": -3, "G": -2, "G#": -1, "A": 0, "A#": 1, "B": 2}


def freq(name: str, octave: int) -> float:
    return note_freq(NOTE_OFFSETS[name] + (octave - 4) * 12)


def osc(kind: str, phase: float) -> float:
    """One sample of a band-limited-enough oscillator. phase is in cycles."""
    p = phase % 1.0
    if kind == "sine":
        return math.sin(2 * math.pi * p)
    if kind == "tri":
        return 4.0 * abs(p - 0.5) - 1.0
    if kind == "square":
        # Soft square: tanh-shaped to take the edge off.
        return math.tanh(6.0 * math.sin(2 * math.pi * p))
    if kind == "saw":
        return 2.0 * p - 1.0
    raise ValueError(kind)


def env(t: float, dur: float, attack: float, release: float) -> float:
    """Linear attack, exponential-ish release envelope. 0..1."""
    if t < 0 or t >= dur:
        return 0.0
    a = min(1.0, t / attack) if attack > 0 else 1.0
    rel_start = dur - release
    if t > rel_start and release > 0:
        r = 1.0 - (t - rel_start) / release
        r = max(0.0, r)
    else:
        r = 1.0
    return a * r


class Track:
    """A float mix buffer with note/noise helpers. Wraps for seamless loops."""

    def __init__(self, duration: float, rate: int, wrap: bool = False):
        self.rate = rate
        self.n = int(round(duration * rate))
        self.buf = [0.0] * self.n
        self.wrap = wrap

    def add_tone(self, start: float, dur: float, f0: float, vol: float,
                 kind: str = "sine", f1: float = None, attack: float = 0.01,
                 release: float = None, vibrato: float = 0.0,
                 harmonics: float = 0.0):
        """Adds a tone; optional linear pitch glide f0->f1 and 2nd harmonic."""
        if release is None:
            release = max(0.02, dur * 0.5)
        f1 = f0 if f1 is None else f1
        samples = int(dur * self.rate)
        start_i = int(start * self.rate)
        phase = 0.0
        for i in range(samples):
            t = i / self.rate
            f = f0 + (f1 - f0) * (i / max(1, samples - 1))
            if vibrato > 0:
                f *= 1.0 + 0.01 * vibrato * math.sin(2 * math.pi * 6.0 * t)
            phase += f / self.rate
            s = osc(kind, phase)
            if harmonics > 0:
                s += harmonics * osc(kind, phase * 2.0)
            s *= vol * env(t, dur, attack, release)
            idx = start_i + i
            if idx >= self.n:
                if not self.wrap:
                    break
                idx %= self.n
            self.buf[idx] += s

    def add_noise(self, start: float, dur: float, vol: float,
                  release: float = None):
        """Deterministic noise burst (percussive tick)."""
        if release is None:
            release = dur * 0.8
        samples = int(dur * self.rate)
        start_i = int(start * self.rate)
        seed = 1234567
        for i in range(samples):
            t = i / self.rate
            seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            s = (seed / 0x3FFFFFFF - 1.0) * vol * env(t, dur, 0.001, release)
            idx = start_i + i
            if idx >= self.n:
                if not self.wrap:
                    break
                idx %= self.n
            self.buf[idx] += s

    def write(self, path: str, peak: float = 0.85):
        m = max(1e-9, max(abs(s) for s in self.buf))
        scale = min(peak / m, 1.0) * 32767
        frames = b"".join(
            struct.pack("<h", int(max(-32767, min(32767, s * scale))))
            for s in self.buf
        )
        with wave.open(path, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(self.rate)
            w.writeframes(frames)
        print(f"  wrote {os.path.relpath(path, ROOT)}"
              f" ({self.n / self.rate:.2f}s)")


# ---------------------------------------------------------------------------
# Sound effects
# ---------------------------------------------------------------------------

def gen_swap() -> Track:
    t = Track(0.14, SFX_RATE)
    t.add_tone(0.0, 0.12, freq("C", 5), 0.6, "sine", f1=freq("G", 5),
               attack=0.005, release=0.06)
    return t


def gen_match() -> Track:
    t = Track(0.28, SFX_RATE)
    t.add_tone(0.00, 0.12, freq("E", 5), 0.6, "tri", attack=0.004, harmonics=0.3)
    t.add_tone(0.07, 0.18, freq("G", 5), 0.6, "tri", attack=0.004, harmonics=0.3)
    t.add_noise(0.0, 0.03, 0.15)
    return t


def gen_combo() -> Track:
    t = Track(0.5, SFX_RATE)
    notes = [("C", 5), ("E", 5), ("G", 5), ("C", 6)]
    for i, (n, o) in enumerate(notes):
        t.add_tone(i * 0.07, 0.22, freq(n, o), 0.5, "tri",
                   attack=0.004, harmonics=0.4)
    return t


def gen_special() -> Track:
    t = Track(0.6, SFX_RATE)
    # Magical rising sweep with shimmer.
    t.add_tone(0.0, 0.45, freq("C", 5), 0.35, "sine", f1=freq("C", 7),
               attack=0.01, release=0.25, vibrato=2.0)
    notes = [("G", 5), ("C", 6), ("E", 6), ("G", 6)]
    for i, (n, o) in enumerate(notes):
        t.add_tone(0.05 + i * 0.09, 0.25, freq(n, o), 0.35, "tri",
                   attack=0.004, harmonics=0.3)
    t.add_noise(0.0, 0.05, 0.12)
    return t


def gen_invalid() -> Track:
    t = Track(0.25, SFX_RATE)
    t.add_tone(0.00, 0.10, freq("E", 3), 0.7, "square", attack=0.004,
               release=0.05)
    t.add_tone(0.11, 0.13, freq("C", 3), 0.7, "square", attack=0.004,
               release=0.08)
    return t


def gen_win() -> Track:
    t = Track(2.0, SFX_RATE)
    seq = [("C", 5, 0.00), ("E", 5, 0.15), ("G", 5, 0.30), ("C", 6, 0.45)]
    for n, o, st in seq:
        t.add_tone(st, 0.3, freq(n, o), 0.45, "tri", attack=0.005,
                   harmonics=0.4)
    # Final chord.
    for n, o in [("C", 5), ("E", 5), ("G", 5), ("C", 6)]:
        t.add_tone(0.65, 1.2, freq(n, o), 0.3, "tri", attack=0.02,
                   release=0.7, harmonics=0.2)
    t.add_noise(0.65, 0.05, 0.1)
    return t


def gen_lose() -> Track:
    t = Track(1.8, SFX_RATE)
    seq = [("G", 4, 0.00), ("E", 4, 0.30), ("D", 4, 0.60), ("C", 4, 0.90)]
    for n, o, st in seq:
        t.add_tone(st, 0.45, freq(n, o), 0.5, "tri", attack=0.01,
                   release=0.25, harmonics=0.2)
    t.add_tone(0.9, 0.8, freq("C", 3), 0.35, "sine", attack=0.02, release=0.6)
    return t


# ---------------------------------------------------------------------------
# Background music (seamless loops; note tails wrap to the start)
# ---------------------------------------------------------------------------

CHORDS = {
    "C": [("C", 3), ("E", 4), ("G", 4)],
    "Am": [("A", 2), ("E", 4), ("A", 4)],
    "F": [("F", 2), ("A", 4), ("C", 5)],
    "G": [("G", 2), ("B", 4), ("D", 5)],
    "Cmaj7": [("C", 3), ("E", 4), ("B", 4)],
    "Fmaj7": [("F", 2), ("A", 4), ("E", 5)],
    "Am7": [("A", 2), ("G", 4), ("C", 5)],
}


def gen_bgm_menu() -> Track:
    """Dreamy 4-bar loop at 90 bpm (~10.7s): slow pads + gentle arpeggio."""
    bpm = 90.0
    beat = 60.0 / bpm
    bars = [("Cmaj7",), ("Fmaj7",), ("Am7",), ("G",)]
    dur = len(bars) * 4 * beat
    t = Track(dur, BGM_RATE, wrap=True)
    for bi, (chord,) in enumerate(bars):
        bar_start = bi * 4 * beat
        tones = CHORDS[chord]
        # Pad: held chord, slow attack.
        for n, o in tones[1:]:
            t.add_tone(bar_start, 4 * beat, freq(n, o), 0.10, "sine",
                       attack=0.6, release=1.2)
        # Bass root.
        n, o = tones[0]
        t.add_tone(bar_start, 4 * beat, freq(n, o), 0.16, "sine",
                   attack=0.05, release=1.0)
        # Arpeggio: eighth notes cycling chord tones an octave up.
        cycle = tones[1:] + [tones[1]]
        for s in range(8):
            n, o = cycle[s % len(cycle)]
            t.add_tone(bar_start + s * beat / 2, beat * 0.45,
                       freq(n, o + 1), 0.12, "tri", attack=0.01, release=0.15)
    return t


def gen_bgm_game() -> Track:
    """Bouncy 8-bar loop at 128 bpm (15s): bass pulse, melody, light ticks."""
    bpm = 128.0
    beat = 60.0 / bpm
    progression = ["C", "Am", "F", "G", "C", "Am", "F", "G"]
    dur = len(progression) * 4 * beat
    t = Track(dur, BGM_RATE, wrap=True)

    # C-major-pentatonic melody, one motif per bar (semitones rel. to C5).
    motifs = [
        [(0, 0.0, 0.5), (4, 1.0, 0.5), (7, 2.0, 0.5), (4, 3.0, 0.5)],
        [(9, 0.0, 0.5), (7, 1.0, 0.5), (4, 2.0, 1.0)],
        [(5, 0.0, 0.5), (9, 1.0, 0.5), (12, 2.0, 0.5), (9, 3.0, 0.5)],
        [(7, 0.0, 1.0), (4, 1.5, 0.5), (2, 2.0, 0.5), (0, 3.0, 0.5)],
        [(0, 0.0, 0.5), (4, 0.5, 0.5), (7, 1.0, 0.5), (12, 2.0, 1.0)],
        [(9, 0.0, 0.5), (12, 1.0, 0.5), (9, 2.0, 0.5), (7, 3.0, 0.5)],
        [(5, 0.0, 0.5), (4, 1.0, 0.5), (5, 2.0, 0.5), (9, 3.0, 0.5)],
        [(7, 0.0, 0.5), (4, 1.0, 0.5), (2, 2.0, 0.5), (4, 3.0, 0.5)],
    ]
    c5 = freq("C", 5)

    for bi, chord in enumerate(progression):
        bar_start = bi * 4 * beat
        tones = CHORDS[chord]
        # Bass: eighth-note pulse on the root.
        n, o = tones[0]
        for s in range(8):
            t.add_tone(bar_start + s * beat / 2, beat * 0.35, freq(n, o),
                       0.20, "tri", attack=0.005, release=0.08)
        # Off-beat chord stabs.
        for s in (1, 3):
            for n2, o2 in tones[1:]:
                t.add_tone(bar_start + s * beat, beat * 0.2, freq(n2, o2),
                           0.07, "square", attack=0.005, release=0.07)
        # Melody.
        for semis, b, ln in motifs[bi]:
            t.add_tone(bar_start + b * beat, ln * beat * 0.9,
                       c5 * (2 ** (semis / 12.0)), 0.16, "square",
                       attack=0.008, release=0.1)
        # Percussive ticks on each beat (accent on 1).
        for s in range(4):
            t.add_noise(bar_start + s * beat, 0.02,
                        0.12 if s == 0 else 0.07)
    return t


# ---------------------------------------------------------------------------

GENERATORS = {
    "swap.wav": gen_swap,
    "match.wav": gen_match,
    "combo.wav": gen_combo,
    "special.wav": gen_special,
    "invalid.wav": gen_invalid,
    "win.wav": gen_win,
    "lose.wav": gen_lose,
    "bgm_menu.wav": gen_bgm_menu,
    "bgm_game.wav": gen_bgm_game,
}


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)
    print("Generating sounds:")
    for name, gen in GENERATORS.items():
        track = gen()
        peak = 0.5 if name.startswith("bgm_") else 0.85
        out = os.path.join(OUT_DIR, name)
        track.write(out, peak=peak)
        # Mirror into Android res/raw (bundled native resources).
        with open(out, "rb") as src, open(os.path.join(RAW_DIR, name), "wb") as dst:
            dst.write(src.read())
    print(f"Mirrored into {os.path.relpath(RAW_DIR, ROOT)}")


if __name__ == "__main__":
    main()
