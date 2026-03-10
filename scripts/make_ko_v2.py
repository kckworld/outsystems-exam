import json
import re
from pathlib import Path

INPUT_PATH = Path(r"d:\SynologyDrive\os_ard_dump_ko.json")
OUTPUT_PATH = Path(r"d:\SynologyDrive\os_ard_dump_ko_v2.json")

TOPIC_MAP = {
    "이벤트": "Events",
    "SQL 및 Aggregate": "SQL and Aggregate",
    "기타": "General",
    "데이터 모델링": "Data Modeling",
    "디버깅": "Debugging",
    "변수 및 속성": "Variables and Properties",
    "액션": "Actions",
    "역할 및 권한": "Roles and Permissions",
    "웹 블록": "Web Blocks",
    "위젯": "Widgets",
    "테마 및 스타일": "Theme and Style",
    "REST/SOAP API": "REST/SOAP API",
}

# Ordered from longer phrases to shorter tokens.
GLOSSARY = [
    ("유효성 검사", "Validation"),
    ("정적 엔터티", "Static Entity"),
    ("동적 엔터티", "Dynamic Entity"),
    ("엔터티", "Entity"),
    ("속성", "Attribute"),
    ("참조", "Reference"),
    ("기본 키", "Primary Key"),
    ("외래 키", "Foreign Key"),
    ("집계", "Aggregate"),
    ("쿼리", "Query"),
    ("변수", "Variable"),
    ("사이트 속성", "Site Property"),
    ("클라이언트 액션", "Client Action"),
    ("서버 액션", "Server Action"),
    ("액션", "Action"),
    ("화면", "Screen"),
    ("웹 블록", "Web Block"),
    ("블록", "Block"),
    ("위젯", "Widget"),
    ("모듈", "Module"),
    ("역할", "Role"),
    ("권한", "Permission"),
    ("테마", "Theme"),
    ("스타일", "Style"),
    ("데이터베이스", "Database"),
    ("서비스 스튜디오", "Service Studio"),
    ("서비스 센터", "Service Center"),
    ("통합 스튜디오", "Integration Studio"),
    ("아웃시스템", "OutSystems"),
    ("진실", "True"),
    ("거짓", "False"),
]


def apply_glossary(text: str) -> str:
    if not text:
        return text

    out = text
    for src, dst in GLOSSARY:
        out = out.replace(src, dst)

    # Cleanup common spacing artifacts after replacements.
    out = re.sub(r"\s{2,}", " ", out).strip()
    return out


def main() -> None:
    data = json.loads(INPUT_PATH.read_text(encoding="utf-8"))

    data["setMeta"]["title"] = "OutSystems 11 Associate Reactive Developer Dump (Korean v2)"
    data["setMeta"]["description"] = "OutSystems Associate Developer (O11) exam practice set - Korean v2 with English terminology"

    for q in data.get("questions", []):
        topic = q.get("topic", "")
        q["topic"] = TOPIC_MAP.get(topic, apply_glossary(topic))

        q["stem"] = apply_glossary(q.get("stem", ""))
        q["explanation"] = apply_glossary(q.get("explanation", ""))
        q["source"] = apply_glossary(q.get("source", ""))
        q["stemImageAlt"] = apply_glossary(q.get("stemImageAlt", ""))

        q["choices"] = [apply_glossary(c) for c in q.get("choices", [])]

        tags = []
        for tag in q.get("tags", []):
            mapped = TOPIC_MAP.get(tag, apply_glossary(tag))
            tags.append(mapped)
        q["tags"] = tags

    OUTPUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"DONE: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
