"""Structural validator for generic subject content pools (English, Mathematics, Science).

Authoring tool only: checks shape, references, answer keys and repair-set completeness.
It does not prove educational quality, curriculum alignment or human review, and it is
not an application input endpoint. Chinese content has its own contract and validator.

Usage: python3 scripts/validate_subject_content.py [subject ...]
With no arguments, every content/<subject>/ directory with a curriculum.json and pool
files (except content/chinese) is checked.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ID = re.compile(r'[a-z][a-z0-9_.-]{2,95}')
URL = re.compile(r'https://[^\s]+')
DATE = re.compile(r'20[0-9]{2}-[01][0-9]-[0-3][0-9]')
SUBJECTS = {'english', 'mathematics', 'science'}
SOURCE_KINDS = {'moe_official', 'school_public', 'past_paper_index', 'enrichment', 'other_public'}
SCOPES = {'in_app', 'partial', 'external', 'deferred'}
PILOT = {'open', 'locked'}
STAGES = ['exact', 'similar', 'generic']
FAMILIES = {
    'english': {'grammar', 'vocabulary', 'cloze', 'editing', 'sentence_organisation',
                'visual_text', 'comprehension', 'writing_foundations'},
    'mathematics': {'concept', 'computation', 'word_problem', 'measurement', 'geometry', 'data'},
    'science': {'acquisition', 'concept', 'classification', 'process_skill', 'application'},
}
STATUSES = {'author_checked_pending_independent_and_owner_review',
            'independently_reviewed_pending_owner', 'approved', 'retired'}


class Invalid(Exception):
    pass


def require(cond, code, where=''):
    if not cond:
        raise Invalid(f'{code}{": " + where if where else ""}')


def keys(obj, required, optional=(), where=''):
    require(isinstance(obj, dict), 'not_object', where)
    missing = set(required) - set(obj)
    extra = set(obj) - set(required) - set(optional)
    require(not missing, 'missing_keys', f'{where} {sorted(missing)}')
    require(not extra, 'unknown_keys', f'{where} {sorted(extra)}')


def text(value, where, limit=4000):
    require(isinstance(value, str) and 0 < len(value.strip()) <= limit, 'bad_text', where)


def ident(value, where):
    require(isinstance(value, str) and ID.fullmatch(value) is not None, 'bad_id', where)


def check_curriculum(cur, subject):
    keys(cur, ['schema_version', 'subject', 'manifest_version', 'status', 'courses',
               'sources', 'topics', 'limitations'], where='curriculum')
    require(cur['schema_version'] == 'subject-curriculum/1', 'curriculum_schema')
    require(cur['subject'] == subject, 'curriculum_subject')
    require(cur['status'] == 'proposed_not_import_enabled', 'curriculum_status')
    require(isinstance(cur['courses'], list) and cur['courses'], 'courses')
    for c in cur['courses']:
        ident(c, 'course')
    sources = {}
    for s in cur['sources']:
        keys(s, ['id', 'kind', 'title', 'url', 'accessed', 'used_for'], ['note'], 'source')
        ident(s['id'], 'source.id')
        require(s['id'] not in sources, 'duplicate_source', s['id'])
        require(s['kind'] in SOURCE_KINDS, 'source_kind', s['id'])
        require(URL.fullmatch(s['url']) is not None, 'source_url', s['id'])
        require(DATE.fullmatch(s['accessed']) is not None, 'source_date', s['id'])
        text(s['title'], s['id'])
        text(s['used_for'], s['id'])
        sources[s['id']] = s
    topics = {}
    for t in cur['topics']:
        keys(t, ['id', 'course', 'grade', 'strand', 'label', 'scope', 'pilot', 'source_refs'],
             ['note'], 'topic')
        ident(t['id'], 'topic.id')
        require(t['id'] not in topics, 'duplicate_topic', t['id'])
        require(t['course'] in cur['courses'], 'topic_course', t['id'])
        require(t['grade'] in {'p2', 'p3'} and t['course'].startswith(t['grade']), 'topic_grade', t['id'])
        require(t['scope'] in SCOPES and t['pilot'] in PILOT, 'topic_scope', t['id'])
        require(t['source_refs'] and all(r in sources for r in t['source_refs']), 'topic_source', t['id'])
        text(t['label'], t['id'])
        text(t['strand'], t['id'])
        topics[t['id']] = t
    return sources, topics


def check_pool(pool, subject, cur, topics):
    keys(pool, ['schema_version', 'subject', 'batch_id', 'version', 'manifest_version',
                'status', 'materials', 'items', 'review_log'], where='pool')
    require(pool['schema_version'] == 'subject-content/1', 'pool_schema')
    require(pool['subject'] == subject, 'pool_subject')
    require(pool['manifest_version'] == cur['manifest_version'], 'pool_manifest_version')
    require(isinstance(pool['version'], int) and pool['version'] >= 1, 'pool_version')
    require(pool['status'] in STATUSES, 'pool_status')
    ident(pool['batch_id'], 'batch_id')
    items, materials, targets = {}, {}, {}
    for it in pool['items']:
        where = it.get('id', '?')
        keys(it, ['id', 'version', 'courses', 'topic_ref', 'target_id', 'stage', 'family', 'format',
                  'stem', 'options', 'correct_option_id', 'hint', 'explanation', 'material_id',
                  'provenance'], where=where)
        ident(it['id'], where)
        require(it['id'] not in items, 'duplicate_item', where)
        require(isinstance(it['version'], int) and it['version'] >= 1, 'item_version', where)
        require(it['topic_ref'] in topics, 'topic_ref', where)
        topic = topics[it['topic_ref']]
        require(topic['scope'] in {'in_app', 'partial'}, 'topic_not_in_app', where)
        require(it['courses'] and set(it['courses']) <= set(cur['courses']), 'item_course', where)
        require(topic['course'] in it['courses'], 'topic_course_mismatch', where)
        require(it['family'] in FAMILIES[subject], 'family', where)
        require(it['format'] == 'mcq_4plus', 'format', where)
        require(it['provenance'] == 'original_generic_author_draft', 'provenance', where)
        text(it['stem'], where)
        text(it['hint'], where)
        text(it['explanation'], where)
        opts = it['options']
        require(isinstance(opts, list) and len(opts) >= 4, 'option_count', where)
        for o in opts:
            keys(o, ['id', 'text'], where=where)
            text(o['text'], where, 300)
        require(len({o['id'] for o in opts}) == len(opts), 'duplicate_option_id', where)
        require(len({o['text'].strip() for o in opts}) == len(opts), 'duplicate_option_text', where)
        require(it['correct_option_id'] in {o['id'] for o in opts}, 'answer_key', where)
        key_text = next(o['text'] for o in opts if o['id'] == it['correct_option_id'])
        if len(key_text.strip()) > 3:
            require(key_text.strip() not in it['hint'], 'hint_reveals_answer', where)
        require((it['target_id'] is None) == (it['stage'] is None), 'stage_target_pair', where)
        if it['target_id'] is not None:
            ident(it['target_id'], where)
            require(it['stage'] in STAGES, 'stage', where)
            require(it['material_id'] is None, 'repair_in_material', where)
            targets.setdefault(it['target_id'], []).append(it)
        items[it['id']] = it
    for m in pool['materials']:
        where = m.get('id', '?')
        keys(m, ['id', 'version', 'courses', 'kind', 'title', 'body', 'question_ids'], where=where)
        ident(m['id'], where)
        require(m['id'] not in materials and m['id'] not in items, 'duplicate_material', where)
        require(m['kind'] in {'passage', 'cloze', 'visual_text', 'scenario'}, 'material_kind', where)
        text(m['title'], where, 200)
        text(m['body'], where, 6000)
        require(m['question_ids'] and len(set(m['question_ids'])) == len(m['question_ids']), 'material_questions', where)
        for q in m['question_ids']:
            require(q in items and items[q]['material_id'] == m['id'], 'material_membership', f'{where} {q}')
            require(set(m['courses']) <= set(items[q]['courses']), 'material_course', where)
        if m['kind'] == 'cloze':
            for n in range(1, len(m['question_ids']) + 1):
                require(m['body'].count(f'({n})') == 1, 'cloze_blank_marker', f'{where} ({n})')
        materials[m['id']] = m
    for it in items.values():
        if it['material_id'] is not None:
            require(it['material_id'] in materials and it['id'] in materials[it['material_id']]['question_ids'],
                    'orphan_material_item', it['id'])
    for tid, group in targets.items():
        require(sorted(g['stage'] for g in group) == sorted(STAGES), 'incomplete_repair_set', tid)
        require(len({g['topic_ref'] for g in group}) == 1, 'repair_set_topic', tid)
        require(len({g['stem'] for g in group}) == 3, 'repair_set_duplicate_stem', tid)
    log = pool['review_log']
    keys(log, ['author_check_date', 'author_checks', 'independent_review', 'owner_signoff',
               'sampled_item_ids', 'disputed_item_ids', 'rights_status'], where='review_log')
    require(set(log['sampled_item_ids']) <= set(items) and set(log['disputed_item_ids']) <= set(items),
            'review_item_reference')
    if pool['status'] == 'approved':
        require(log['independent_review'] == 'passed' and log['owner_signoff'] == 'approved'
                and log['rights_status'] == 'cleared' and not log['disputed_item_ids'], 'approved_state')
    return items, materials, targets


def check_subject(subject):
    base = ROOT / 'content' / subject
    cur = json.loads((base / 'curriculum.json').read_text(encoding='utf-8'))
    sources, topics = check_curriculum(cur, subject)
    totals = {'items': 0, 'materials': 0, 'repair_sets': 0}
    by_grade = {}
    for path in sorted(base.glob('pool-*.json')):
        pool = json.loads(path.read_text(encoding='utf-8'))
        items, materials, targets = check_pool(pool, subject, cur, topics)
        totals['items'] += len(items)
        totals['materials'] += len(materials)
        totals['repair_sets'] += len(targets)
        for it in items.values():
            g = topics[it['topic_ref']]['grade']
            by_grade[g] = by_grade.get(g, 0) + 1
    covered = {t for t in topics if topics[t]['scope'] in {'in_app', 'partial'}}
    return totals, by_grade, len(covered), len(sources)


def main(argv):
    subjects = argv or sorted(p.name for p in (ROOT / 'content').iterdir()
                              if p.name in SUBJECTS and (p / 'curriculum.json').exists())
    for subject in subjects:
        require(subject in SUBJECTS, 'unknown_subject', subject)
        totals, by_grade, topics, sources = check_subject(subject)
        print(f'PASS {subject}: {totals["items"]} items ({by_grade}), {totals["materials"]} materials, '
              f'{totals["repair_sets"]} repair sets, {topics} in-app/partial topics, {sources} cited sources.')
    print('QA pending: independent review, owner sign-off and approved coverage. Not a content release.')


if __name__ == '__main__':
    try:
        main(sys.argv[1:])
    except Invalid as exc:
        print(f'FAIL: {exc}')
        sys.exit(1)
