#!/usr/bin/env python3
"""Chinese release inventory: per-course leaf coverage, repair-route readiness and supply.

Reads only the public catalogue (content/chinese). Writes a generated Markdown report.
This is an authoring readiness report. It does not approve content, a denominator or
a release, and no number in it is a coverage claim until the owner signs off.

    python3 scripts/chinese_release_inventory.py          # rewrite the report
    python3 scripts/chinese_release_inventory.py --check  # fail if the report is stale
"""
import argparse
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CURRICULUM = ROOT / 'content/chinese/curriculum.json'
BATCH = ROOT / 'content/chinese/batches/starter-001.json'
REPORT = ROOT / 'docs/content-review/CHINESE_RELEASE_INVENTORY.md'
STAGES = {'exact', 'similar', 'generic'}
COURSE_NAMES = {'p2_chinese': 'P2 Chinese (华文)', 'p2_higher_chinese': 'P2 Higher Chinese (高级华文)',
                'p3_chinese': 'P3 Chinese (华文)', 'p3_higher_chinese': 'P3 Higher Chinese (高级华文)'}
# Planning signal only, not an owner quota: one item per stage leaves no spare question for a
# second attempt at the same stage or a fresh delayed check.
THIN_STOCK = 1
DEFAULT_X = 10


def load():
    return (json.loads(CURRICULUM.read_text(encoding='utf-8')),
            json.loads(BATCH.read_text(encoding='utf-8')))


def approval_note(curriculum, batch):
    """Name the gates still open; coverage counts only once all are closed."""
    log = batch['review_log']
    missing = []
    if curriculum['status'] != 'approved':
        missing.append('leaf denominator not approved')
    if log['independent_review'] != 'passed':
        missing.append('independent review not passed')
    if log['owner_signoff'] != 'approved':
        missing.append('owner sign-off pending')
    if log['rights_status'] != 'cleared':
        missing.append('rights not cleared')
    if log['disputed_item_ids']:
        missing.append('open disputes')
    return '; '.join(missing) if missing else 'all gates closed; approved-coverage counting is not implemented yet'


def analyse(curriculum, batch):
    skills = {s['id']: s for s in curriculum['skill_targets']}
    chars = {c['id']: c for c in curriculum['characters']}
    items = batch['items']
    stage_items = defaultdict(lambda: defaultdict(list))   # target -> stage -> item ids
    for item in items:
        for ref in item['target_refs']:
            stage_items[ref][item['stage']].append(item['id'])

    courses = {}
    for course in curriculum['courses']:
        leaves = [o for o in curriculum['outcomes'] if o['course'] == course]
        rows = []
        for leaf in leaves:
            lid = leaf['id']
            general = [i for i in items if lid in i['outcome_refs'] and i['stage'] is None]
            repair = [i for i in items if lid in i['outcome_refs'] and i['stage'] is not None]
            targets = sorted({r for i in repair for r in i['target_refs'] if r.split('.')[1] == course})
            targets += sorted(t for t, s in skills.items()
                              if s['outcome_ref'] == lid and t not in targets and t in stage_items)
            # A target can appear under multiple leaves. Do not assemble a leaf's
            # route from stages authored only for a different assessed outcome.
            leaf_stages = defaultdict(lambda: defaultdict(list))
            for item in repair:
                for target in item['target_refs']:
                    if target in targets:
                        leaf_stages[target][item['stage']].append(item['id'])
            complete = [t for t in targets if STAGES <= set(leaf_stages[t])]
            route_stock = {t: min(len(leaf_stages[t][s]) for s in STAGES) for t in complete}
            stock = min(route_stock.values(), default=0)
            if leaf['scope'] not in {'in_app', 'partial'}:
                status = leaf['scope']
            elif complete and general:
                status = 'authored'
            elif general or repair:
                status = 'partial'
            else:
                status = 'empty'
            rows.append({'leaf': leaf, 'general': len(general), 'repair': len(repair),
                         'targets': targets, 'complete': complete, 'stock': stock,
                         'route_stock': route_stock,
                         'skill_targets': [t for t in complete if t in skills],
                         'char_targets': [t for t in complete if t in chars], 'status': status})
        mats = [m for m in batch['materials'] if course in m['courses']]
        course_items = [i for i in items if course in i['courses']]
        char_union = [c for c in chars.values() if c['course'] == course]
        char_targets = {t for t in stage_items if t in chars and chars[t]['course'] == course
                        and set(stage_items[t]) == STAGES}
        courses[course] = {
            'approval_note': approval_note(curriculum, batch),
            'rows': rows, 'materials': mats, 'items': course_items,
            'char_union': len(char_union),
            'char_recognition': sum(bool(c['recognition_list_pages']) for c in char_union),
            'char_targets': len(char_targets),
            'char_targets_recognition': sum(bool(chars[t]['recognition_list_pages']) for t in char_targets),
            'course_only_items': sum(1 for i in course_items if i['courses'] == [course]),
            'formats': Counter(i['format'] for i in course_items),
            'families': Counter(i['family'] for i in course_items),
        }
    return courses


def pct(n, d):
    return f'{n}/{d} ({100 * n / d:.0f}%)' if d else '0/0'


def leaf_table(rows):
    out = ['| Leaf | Label | Scope | PDF p | General items | Repair items | Complete routes | Min stock/stage | Status |',
           '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |']
    for r in rows:
        leaf = r['leaf']
        if leaf['scope'] not in {'in_app', 'partial'}:
            continue
        stock = r['stock'] if r['complete'] else '–'
        thin = ' (thin)' if r['complete'] and r['stock'] <= THIN_STOCK else ''
        out.append(f"| `{leaf['id'].split('.', 2)[2]}` | {leaf['label_zh']} | {leaf['scope']} | "
                   f"{leaf['source_pdf_page']} | {r['general']} | {r['repair']} | {len(r['complete'])} | "
                   f"{stock}{thin} | {r['status']} |")
    return out


def course_section(course, data, p3=False):
    approval_note = data['approval_note']
    rows = data['rows']
    scoped = [r for r in rows if r['leaf']['scope'] in {'in_app', 'partial'}]
    authored = [r for r in scoped if r['status'] == 'authored']
    partial = [r for r in scoped if r['status'] == 'partial']
    empty = [r for r in scoped if r['status'] == 'empty']
    out_scope = Counter(r['leaf']['scope'] for r in rows if r['leaf']['scope'] not in {'in_app', 'partial'})
    mats = Counter(m['kind'] for m in data['materials'])
    per_day = math.ceil(DEFAULT_X / 5)
    lines = [f"## {COURSE_NAMES[course]}", '']
    if p3:
        lines += ['P3 general practice is unlocked from the first Chinese release using reviewed available '
                  'content; P3 mistake imports stay disabled. This is an available-content inventory, not a '
                  '75% release measure.', '']
    lines += [
        '| Measure | Value |', '| --- | --- |',
        f"| Approved leaf coverage | 0/{len(scoped)} — {approval_note} |",
        f"| Leaves authored with general practice and a complete repair route | {pct(len(authored), len(scoped))} |",
        f"| Leaves with some items but no complete route or no general practice | {len(partial)} |",
        f"| Empty in-scope leaves (stay in the denominator) | {len(empty)} |",
        f"| Out-of-app leaves, not in the denominator | " + ', '.join(f'{k} {v}' for k, v in sorted(out_scope.items())) + ' |',
        f"| Character group coverage, reported separately | {pct(data['char_targets'], data['char_union'])} of the grade's list characters have a complete repair pool |",
        f"| Questions tagged to this course | {len(data['items'])} ({data['course_only_items']} only for this course) |",
        f"| Whole materials | {len(data['materials'])} (" + ', '.join(f'{k} {v}' for k, v in sorted(mats.items())) +
        f"); at X={DEFAULT_X} a task uses ≥{per_day}: at most {len(data['materials']) // per_day} "
        'complete tasks without material reuse, from the material quota alone; eligibility and rotation not simulated |',
        f"| Interaction formats | " + ', '.join(f'{k} {v}' for k, v in data['formats'].items()) + ' |',
        '',
    ]
    lines += leaf_table(rows) + ['']
    return lines


def missing_section(courses):
    lines = ['## Missing outcomes and incomplete repair routes', '',
             'Each row is an in-scope leaf that cannot yet count as covered. P2 rows count toward the 75% '
             'guideline; P3 rows limit available general practice only.', '',
             '| Course | Leaf | Label | Status | What is missing |', '| --- | --- | --- | --- | --- |']
    for course, data in courses.items():
        for r in data['rows']:
            leaf = r['leaf']
            if leaf['scope'] not in {'in_app', 'partial'} or r['status'] == 'authored':
                continue
            need = []
            if not r['general']:
                need.append('general-practice items')
            if not r['complete']:
                need.append('a complete exact/similar/generic repair route')
            lines.append(f"| {course} | `{leaf['id'].split('.', 2)[2]}` | {leaf['label_zh']} | {r['status']} | "
                         + '; '.join(need) + ' |')
    lines += ['', '### Thin repair stock', '',
              'A route with one item per stage has no spare question: a child who fails a stage meets the '
              'same question again on a later day, and every delayed check reuses the one generic item. Reuse '
              'is allowed but recorded as repeated exposure, never as new-context evidence.', '',
              '| Course | Complete routes | Of which at least one stage has only one item |', '| --- | ---: | ---: |']
    for course, data in courses.items():
        routes = {t for r in data['rows'] for t in r['complete']}
        thin = {t for r in data['rows'] for t, stock in r['route_stock'].items() if stock <= THIN_STOCK}
        lines.append(f'| {course} | {len(routes)} | {len(thin)} |')
    return lines + ['']


def render(curriculum, batch):
    courses = analyse(curriculum, batch)
    head = [
        '# Chinese release inventory and QA readiness',
        '',
        '<!-- Generated by scripts/chinese_release_inventory.py. Do not edit by hand. -->',
        '',
        f"Catalogue: manifest `{curriculum['manifest_version']}` ({curriculum['status']}), batch "
        f"`{batch['batch_id']}` v{batch['version']} ({batch['status']}). Review state: independent "
        f"`{batch['review_log']['independent_review']}`, owner `{batch['review_log']['owner_signoff']}`, "
        f"rights `{batch['review_log']['rights_status']}`.",
        '',
        '**Read this first.** Nothing here is approved coverage. The release denominator is the in-scope '
        'leaf list below, which is itself a proposal until the independent page/grade audit and the owner '
        'approve it. "Authored" means a leaf has general-practice questions and at least one complete '
        'exact/similar/generic repair route in the draft batch; it becomes coverage only after review, '
        'rights and owner sign-off. Character-group coverage is reported separately and never merged into '
        'the skill percentage (owner decision 2026-10-16).',
        '',
        'Higher Chinese uses the same leaves and the same shared questions as Chinese. No question is '
        'Higher-Chinese-only, so the HCL numbers show shared availability, not evidence of HCL depth.',
        '',
        'Every question is single-answer multiple choice with four options. Matching, ordering and '
        'two-or-three-option formats are product requirements without a content contract yet.',
        '',
    ]
    body = []
    for course in ['p2_chinese', 'p2_higher_chinese']:
        body += course_section(course, courses[course])
    body += ['# Supported P3 general-practice inventory', '']
    for course in ['p3_chinese', 'p3_higher_chinese']:
        body += course_section(course, courses[course], p3=True)
    body += missing_section(courses)
    return '\n'.join(head + body).rstrip() + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument('--check', action='store_true', help='fail if the committed report is stale')
    args = parser.parse_args()
    text = render(*load())
    if args.check:
        if REPORT.read_text(encoding='utf-8') != text:
            raise SystemExit('FAIL: docs/content-review/CHINESE_RELEASE_INVENTORY.md is stale; rerun the script.')
        print('PASS: Chinese release inventory report is current.')
        return
    REPORT.write_text(text, encoding='utf-8')
    print(f'Wrote {REPORT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
