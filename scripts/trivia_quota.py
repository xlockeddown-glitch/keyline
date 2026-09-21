"""Generator-side trivia card quotas. Shared with scripts/trivia-quotas.json."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable

QUOTA_FILE = Path(__file__).resolve().parent / "trivia-quotas.json"


def load_quotas() -> dict[str, Any]:
    return json.loads(QUOTA_FILE.read_text())


def _niches(quotas: dict[str, Any]) -> list[tuple[str, re.Pattern[str]]]:
    out: list[tuple[str, re.Pattern[str]]] = []
    for nid, spec in (quotas.get("niches") or {}).items():
        out.append((nid, re.compile(spec["pattern"], re.I)))
    return out


def match_niche(text: str, quotas: dict[str, Any] | None = None) -> str | None:
    quotas = quotas or load_quotas()
    for nid, cre in _niches(quotas):
        if cre.search(text):
            return nid
    return None


def bank_stem(bank: str) -> str:
    return Path(bank).stem


def is_specialty(prompt: str, answer: str = "", bank: str = "", quotas: dict[str, Any] | None = None) -> bool:
    quotas = quotas or load_quotas()
    if bank_stem(bank) in (quotas.get("deepCutBanks") or []):
        return True
    niche = match_niche(f"{prompt} {answer}", quotas)
    return niche in {"tarantula", "metrology", "aerospace-ops"}


def clamp_diff(prompt: str, answer: str, diff: int, bank: str = "", quotas: dict[str, Any] | None = None) -> int:
    quotas = quotas or load_quotas()
    if is_specialty(prompt, answer, bank, quotas):
        return max(int(diff), int(quotas["generator"]["deepCutMinDiff"]))
    return int(diff)


def _row_fields(row: Any) -> tuple[str, str, str, int]:
    if isinstance(row, dict):
        return (
            str(row.get("cat") or row.get("topic") or "local"),
            str(row.get("q") or row.get("prompt") or ""),
            str(row.get("answer") or ""),
            int(row.get("diff") or 2),
        )
    if isinstance(row, (tuple, list)):
        if len(row) >= 5:
            return str(row[0]), str(row[1]), str(row[3]), int(row[4])
        if len(row) == 4:
            # (prompt, choices, answer, diff)
            return "local", str(row[0]), str(row[2]), int(row[3])
    raise TypeError(f"unknown trivia row: {type(row)}")


def check_bulk(rows: Iterable[Any], bank: str = "general", quotas: dict[str, Any] | None = None) -> list[str]:
    quotas = quotas or load_quotas()
    g = quotas["generator"]
    topics = set(quotas.get("topics") or [])
    items = list(rows)
    total = len(items)
    if not total:
        return []
    specialty = 0
    topic_count: dict[str, int] = {}
    deep_easy = 0
    deep_n = 0
    deep_bank = bank_stem(bank) in (quotas.get("deepCutBanks") or [])
    for row in items:
        cat, prompt, answer, diff = _row_fields(row)
        spec = is_specialty(prompt, answer, bank, quotas)
        if spec:
            specialty += 1
            deep_n += 1
            if diff < int(g["deepCutMinDiff"]):
                deep_easy += 1
        topic = cat if cat in topics else "local"
        topic_count[topic] = topic_count.get(topic, 0) + 1
    flags: list[str] = []
    spec_share = specialty / total
    if not deep_bank and spec_share > g["bulkMaxSpecialtyShare"]:
        flags.append(
            f"bulk {bank} specialty share {spec_share:.1%} > {g['bulkMaxSpecialtyShare']:.0%} — keep new bulk general/city-shared"
        )
    for topic, n in topic_count.items():
        share = n / total
        if share > g["bulkMaxTopicShare"]:
            flags.append(f"bulk {bank} topic {topic} is {share:.1%} (max {g['bulkMaxTopicShare']:.0%})")
    if deep_n >= 8:
        easy_share = deep_easy / deep_n
        if easy_share > g["deepCutMaxEasyShare"]:
            flags.append(
                f"deep-cut trivia cards are {easy_share:.1%} below diff {g['deepCutMinDiff']} (max {g['deepCutMaxEasyShare']:.0%}) — keep deep cuts mainly red/violet"
            )
    return flags


def assert_bulk(rows: Iterable[Any], bank: str = "general") -> None:
    flags = check_bulk(rows, bank)
    if flags:
        raise SystemExit("trivia quota: " + "; ".join(flags))
