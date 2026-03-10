import json
from pathlib import Path

INPUT_PATH = Path(r"d:\SynologyDrive\os_ard_dump_ko_v2.json")
OUTPUT_PATH = Path(r"d:\SynologyDrive\os_ard_dump_ko_v2_legacy.json")


def ensure_four_choices(choices):
    out = [c if isinstance(c, str) and c.strip() else "(empty choice)" for c in (choices or [])]
    while len(out) < 4:
        out.append(f"N/A option {len(out) + 1}")
    return out[:4]


def main():
    data = json.loads(INPUT_PATH.read_text(encoding="utf-8"))

    for q in data.get("questions", []):
        q["choices"] = ensure_four_choices(q.get("choices", []))

        # Older schema requires non-empty explanation.
        if not isinstance(q.get("explanation"), str) or not q.get("explanation").strip():
            q["explanation"] = "No explanation provided."

        # Older schema rejects empty image URL strings.
        if not isinstance(q.get("stemImageUrl"), str) or not q.get("stemImageUrl", "").strip():
            q.pop("stemImageUrl", None)
            q.pop("stemImageAlt", None)
        elif not isinstance(q.get("stemImageAlt"), str):
            q["stemImageAlt"] = ""

        # Keep required array fields valid.
        if not isinstance(q.get("tags"), list):
            q["tags"] = []

    OUTPUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"DONE: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
