#!/usr/bin/env python3
"""Audit the P1 review-character records against the two checksum-pinned public MOE character lists.

Reads PDF pages 1–2 (P1) of each official list with poppler's `pdftotext -bbox`, using the same table bounds
as `audit_chinese_character_sources.py` uses for pages 3–6: header, title and lesson column ignored;
recognition column x < 355, writing column x >= 358, rows inside y = 130..700. As a control it first
reproduces the course's P2 records from pages 3–4. Then it checks every P1 review record (id, source grade,
recognition/writing pages, source) and the summary counts in `content/chinese/review-characters.json`.

Only checksum-matching official PDFs are accepted. It does not fetch URLs or read learner documents.
Usage: python3 scripts/audit_p1_review_characters.py --cl CL.pdf --hcl HCL.pdf
"""
import argparse
import hashlib
import html
import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def require(condition, code):
    if not condition:
        raise ValueError(code)


def words(pdf, page):
    out = subprocess.check_output(['pdftotext', '-bbox', '-f', str(page), '-l', str(page), str(pdf), '-']).decode()
    for m in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">(.*?)</word>', out):
        yield float(m[1]), float(m[2]), html.unescape(m[3])


def extract(pdf, pages):
    modes = defaultdict(lambda: {'read': set(), 'write': set()})
    for page in pages:
        for x, y, text in words(pdf, page):
            if not 130 < y < 700 or x < 115:
                continue
            require(x < 355 or x >= 358, 'ambiguous_column')
            mode = 'write' if x >= 358 else 'read'
            for char in text:
                require('一' <= char <= '鿿', 'unexpected_table_text')
                modes[char][mode].add(page)
    return modes


def audit(cl, hcl):
    curriculum = json.loads((ROOT / 'content/chinese/curriculum.json').read_text(encoding='utf-8'))
    review = json.loads((ROOT / 'content/chinese/review-characters.json').read_text(encoding='utf-8'))
    sources = {s['id']: s for s in curriculum['sources']}
    report = []
    for pdf, course, source_id in [(cl, 'p2_chinese', 'moe-cl-characters-2024'), (hcl, 'p2_higher_chinese', 'moe-hcl-characters-2024')]:
        require(hashlib.sha256(Path(pdf).read_bytes()).hexdigest() == sources[source_id]['sha256'], 'source_checksum')
        grade = {c['character'] for c in curriculum['characters'] if c['course'] == course}
        require(set(extract(pdf, [3, 4])) == grade, 'p2_control_mismatch')
        p1 = extract(pdf, [1, 2])
        expected = {ch: m for ch, m in p1.items() if ch not in grade}
        rows = {r['character']: r for r in review['characters'] if r['course'] == course}
        require(set(rows) == set(expected), 'review_character_set')
        for ch, m in expected.items():
            want = {'id': f'zh.{course}.review.u{ord(ch):04x}', 'source_grade': 1, 'source_ref': source_id,
                    'recognition_list_pages': sorted(m['read']), 'writing_list_pages': sorted(m['write'])}
            require(all(rows[ch].get(k) == v for k, v in want.items()), 'review_record_fields')
        count = next(c for c in review['counts'] if c['course'] == course)
        require((count['p1_union_unique'], count['already_in_grade_list'], count['review_records'], count['source_pdf_pages'])
                == (len(p1), len(p1) - len(expected), len(expected), [1, 2]), 'review_counts')
        report.append(f'{course}: {len(p1)} P1 characters, {len(p1) - len(expected)} already on the P2 list, {len(expected)} review records match')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--cl', required=True)
    parser.add_argument('--hcl', required=True)
    args = parser.parse_args()
    for line in audit(args.cl, args.hcl):
        print('PASS', line)
