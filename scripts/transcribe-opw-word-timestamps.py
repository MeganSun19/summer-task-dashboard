import json
import re
from pathlib import Path

import mlx_whisper


PROJECT_ROOT = Path(__file__).resolve().parent.parent
WORKSPACE_ROOT = PROJECT_ROOT.parent
OUTPUT_ROOT = WORKSPACE_ROOT / "outputs"
MODEL_PATH = WORKSPACE_ROOT / "tmp" / "whisper-tiny.en-mlx"
OUTPUT_PATH = PROJECT_ROOT / "curriculum" / "opw-word-timestamps.json"
TRACK_RE = re.compile(r"OPW_SB(?P<level>[123])_Disc(?P<disc>[12])_Track(?P<track>\d{2})\.mp3$")


def inventory():
    tracks = []
    for level in (1, 2, 3):
        for disc in (1, 2):
            directory = OUTPUT_ROOT / f"oxford-phonics-world-level{level}-disc{disc}"
            for audio_path in sorted(directory.glob(f"OPW_SB{level}_Disc{disc}_Track*.mp3")):
                match = TRACK_RE.match(audio_path.name)
                if not match:
                    continue
                tracks.append({
                    "level": level,
                    "disc": disc,
                    "track": int(match.group("track")),
                    "sourceFile": audio_path.name,
                    "audioPath": audio_path,
                })
    return tracks


def load_existing():
    if not OUTPUT_PATH.exists():
        return {}
    data = json.loads(OUTPUT_PATH.read_text())
    return {
        (entry["level"], entry["disc"], entry["track"]): entry
        for entry in data.get("tracks", [])
    }


def save(entries):
    ordered = [entries[key] for key in sorted(entries)]
    payload = {
        "schemaVersion": 1,
        "engine": "mlx-whisper",
        "model": "mlx-community/whisper-tiny.en-mlx",
        "language": "en",
        "reviewPolicy": "machine-generated word timestamps; verify low-confidence or curriculum-critical clips by listening",
        "tracks": ordered,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def normalize_word(word):
    return word.strip()


def transcribe(track):
    result = mlx_whisper.transcribe(
        str(track["audioPath"]),
        path_or_hf_repo=str(MODEL_PATH),
        word_timestamps=True,
        verbose=False,
        language="en",
        condition_on_previous_text=False,
    )
    words = []
    for segment in result.get("segments", []):
        for item in segment.get("words", []):
            word = normalize_word(item.get("word", ""))
            if not word:
                continue
            words.append({
                "word": word,
                "startSeconds": round(float(item["start"]), 3),
                "endSeconds": round(float(item["end"]), 3),
                "confidence": round(float(item.get("probability", 0)), 4),
            })
    return {
        "level": track["level"],
        "disc": track["disc"],
        "track": track["track"],
        "sourceFile": track["sourceFile"],
        "transcript": result.get("text", "").strip(),
        "wordSegments": words,
        "listeningReview": "required-for-confidence-below-0.65",
    }


def main():
    if not MODEL_PATH.exists():
        raise SystemExit(f"Whisper model missing: {MODEL_PATH}")
    tracks = inventory()
    entries = load_existing()
    pending = [t for t in tracks if (t["level"], t["disc"], t["track"]) not in entries]
    print(f"Inventory {len(tracks)} tracks; {len(pending)} pending")
    for index, track in enumerate(pending, 1):
        key = (track["level"], track["disc"], track["track"])
        entries[key] = transcribe(track)
        save(entries)
        print(
            f"[{index}/{len(pending)}] L{track['level']} D{track['disc']} "
            f"T{track['track']:02d}: {len(entries[key]['wordSegments'])} words",
            flush=True,
        )
    save(entries)
    print(f"Wrote {OUTPUT_PATH}: {len(entries)} tracks")


if __name__ == "__main__":
    main()
