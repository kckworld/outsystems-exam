import json
from pathlib import Path

path = Path(r"d:\SynologyDrive\os_ard_dump_ko.json")
data = json.loads(path.read_text(encoding="utf-8"))

data["setMeta"]["title"] = "OutSystems 11 Associate Reactive Developer 덤프"
data["setMeta"]["description"] = "OutSystems 11 Associate Reactive Developer 자격증 시험 대비 문제집 (262문항)"

for q in data.get("questions", []):
    q["topic"] = q.get("topic", "").replace("아웃시스템", "OutSystems")
    q["stem"] = q.get("stem", "").replace("아웃시스템", "OutSystems")
    q["source"] = q.get("source", "").replace("아웃시스템", "OutSystems")
    q["choices"] = [
        c.replace("진실", "True").replace("거짓", "False").replace("아웃시스템", "OutSystems")
        for c in q.get("choices", [])
    ]
    q["tags"] = [t.replace("아웃시스템", "OutSystems") for t in q.get("tags", [])]

path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"normalized: {path}")
