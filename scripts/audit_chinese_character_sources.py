#!/usr/bin/env python3
"""Reproduce character records from the two checksum-pinned public MOE lists.

Optional preparation dependency: PyMuPDF. Does not read learner documents, fetch
URLs, update the manifest or claim an independent curriculum/pedagogy audit.
Only checksum-matching official sources are accepted. Output is public source facts.
"""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]


def source_records(path, source, higher):
    require(hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], 'source_checksum')
    import fitz  # Optional preparation tool, not an application dependency.
    records, counts = [], []
    with fitz.open(path) as pdf:
        require(len(pdf) == source['pdf_pages'] == 6, 'source_page_count')
        for grade, indices in [(2, [2, 3]), (3, [4, 5])]:
            course = f'p{grade}_' + ('higher_chinese' if higher else 'chinese')
            modes = {}
            for index in indices:
                page = pdf[index]
                require(abs(page.rect.width - 539) < 1 and abs(page.rect.height - 737) < 1, 'source_layout')
                require('识读字' in page.get_text() and '识写字' in page.get_text(), 'source_headers')
                # Bounds inspected against the official tables: ignore header,
                # title, lesson-number column. Recognition x=119.5..354.5;
                # writing x>=358.56. Both columns are inside y=130..700.
                for word in page.get_text('words'):
                    x, y, text = word[0], word[1], word[4]
                    if not 130 < y < 700 or x < 115:
                        continue
                    require(x < 355 or x >= 358, 'ambiguous_column')
                    mode = 'write' if x >= 358 else 'read'
                    for char in text:
                        require('\u4e00' <= char <= '\u9fff', 'unexpected_table_text')
                        modes.setdefault(char, {'read': set(), 'write': set()})[mode].add(index + 1)
            for char, m in sorted(modes.items()):
                records.append({'id': f'zh.{course}.char.u{ord(char):04x}', 'course': course,
                                'character': char, 'recognition_list_pages': sorted(m['read']),
                                'writing_list_pages': sorted(m['write']), 'source_ref': source['id']})
            counts.append({'course': course, 'recognition_list_unique': sum(bool(m['read']) for m in modes.values()),
                           'writing_list_unique': sum(bool(m['write']) for m in modes.values()),
                           'union_unique': len(modes), 'source_pdf_pages': [i + 1 for i in indices]})
    return records, counts


def require(condition, code):
    if not condition:
        raise ValueError(code)


def set_report(records):
    result = []
    for grade in [2, 3]:
        courses = {name: [r for r in records if r['course'] == f'p{grade}_{name}']
                   for name in ['chinese', 'higher_chinese']}
        row = {'grade': grade}
        for mode, field in [('recognition', 'recognition_list_pages'), ('writing', 'writing_list_pages'), ('union', None)]:
            cl, hcl = [{r['character'] for r in courses[name] if field is None or r[field]}
                       for name in ['chinese', 'higher_chinese']]
            row[mode] = {'cl_count': len(cl), 'hcl_count': len(hcl),
                         'cl_only': ''.join(sorted(cl - hcl)), 'hcl_only': ''.join(sorted(hcl - cl)),
                         'intersection_count': len(cl & hcl), 'hcl_is_superset': cl <= hcl}
        result.append(row)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cl-pdf', type=Path, required=True)
    parser.add_argument('--hcl-pdf', type=Path, required=True)
    parser.add_argument('--report', type=Path, help='Write public set-difference JSON; default stdout')
    args = parser.parse_args()
    curriculum = json.loads((ROOT / 'content/chinese/curriculum.json').read_text(encoding='utf-8'))
    sources = {r['id']: r for r in curriculum['sources']}
    records, counts = [], []
    for path, key, higher in [(args.cl_pdf, 'moe-cl-characters-2024', False), (args.hcl_pdf, 'moe-hcl-characters-2024', True)]:
        rs, cs = source_records(path, sources[key], higher)
        records += rs
        counts += cs
    by_id = lambda rs: {r['id']: r for r in rs}
    require(by_id(records) == by_id(curriculum['characters']), 'source_manifest_character_mismatch')
    require({r['course']: r for r in counts} == {r['course']: r for r in curriculum['course_character_counts']}, 'source_manifest_count_mismatch')
    report = {'schema_version': 'chinese-source-audit/1', 'manifest_version': curriculum['manifest_version'],
              'method': 'checksum-pinned PDF text columns, set difference and comparison to manifest',
              'extractor': 'PyMuPDF ' + importlib.metadata.version('PyMuPDF'),
              'source_sha256': {key: sources[key]['sha256'] for key in ['moe-cl-characters-2024', 'moe-hcl-characters-2024']},
              'records_match_manifest': True, 'set_differences': set_report(records),
              'limitation': 'Reproducibility and selected visual spot checks do not complete independent audit of every source row or the syllabus outcome map.'}
    text = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    if args.report:
        args.report.write_text(text, encoding='utf-8')
        print('PASS: official character extraction and counts match manifest; public report written.')
    else:
        print(text, end='')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, ImportError):
        print('FAIL: source audit did not complete; check dependency and pinned official input files.', file=sys.stderr)
        raise SystemExit(1) from None
