"""Structural validator for generic subject content pools (English, Mathematics, Science).

Authoring tool only: checks shape, references, answer keys, repair-set completeness, leaf
mappings, repair routes, knowledge-point links and the safety of bundled SVG assets.
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
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
ID = re.compile(r'[a-z][a-z0-9_.-]{2,95}')
URL = re.compile(r'https://[^\s]+')
DATE = re.compile(r'20[0-9]{2}-[01][0-9]-[0-3][0-9]')
ASSET_PATH = re.compile(r'assets/[a-z0-9][a-z0-9_.-]{2,95}\.svg')
SUBJECTS = {'english', 'mathematics', 'science'}
SOURCE_KINDS = {'moe_official', 'school_public', 'past_paper_index', 'enrichment', 'other_public'}
SCOPES = {'in_app', 'partial', 'external', 'deferred'}
LEAF_SCOPES = SCOPES | {'extension'}
REPRESENTATIONS = {'text', 'visual', 'production'}
PILOT = {'open', 'locked'}
STAGES = ['exact', 'similar', 'generic']
MATERIAL_KINDS = {'passage', 'cloze', 'visual_text', 'scenario', 'teaching'}
FAMILIES = {
    'english': {'grammar', 'vocabulary', 'cloze', 'editing', 'sentence_organisation',
                'visual_text', 'comprehension', 'writing_foundations'},
    'mathematics': {'concept', 'computation', 'word_problem', 'measurement', 'geometry', 'data'},
    'science': {'acquisition', 'concept', 'classification', 'process_skill', 'application'},
}
# Reviewed cross-family repair routes. A routed question may repair through a set of its own family,
# or through one of these. Anything else (e.g. a cloze blank routed to an editing set) is rejected.
# This blocks the known cross-skill pattern; same-family skill fit still needs human review.
ROUTE_FAMILIES = {
    'english': {'cloze': {'grammar', 'vocabulary', 'sentence_organisation'}},
    'mathematics': {},
    'science': {'acquisition': {'concept', 'classification', 'process_skill', 'application'}},
}
STATUSES = {'author_checked_pending_independent_and_owner_review',
            'independently_reviewed_pending_owner', 'approved', 'retired'}
SVG_NS = '{http://www.w3.org/2000/svg}'
SVG_FORBIDDEN = {'script', 'foreignObject', 'image', 'iframe', 'object', 'embed', 'a', 'use', 'style',
                 'feImage'}
LOCAL_URL = re.compile(r'url\(\s*[\'"]?#[A-Za-z0-9_.-]+[\'"]?\s*\)')


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


def id_list(value, where, allow_empty=False):
    require(isinstance(value, list) and (allow_empty or value), 'bad_id_list', where)
    for v in value:
        ident(v, where)
    require(len(set(value)) == len(value), 'duplicate_in_list', where)


def check_curriculum(cur, subject):
    keys(cur, ['schema_version', 'subject', 'manifest_version', 'status', 'courses',
               'sources', 'topics', 'limitations'], ['leaves'], where='curriculum')
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
    leaves = {}
    for lf in cur.get('leaves', []):
        where = lf.get('id', '?')
        keys(lf, ['id', 'topic_ref', 'label', 'assessed_ability', 'representation', 'scope',
                  'source_refs', 'source_pages'], ['note'], 'leaf ' + where)
        ident(lf['id'], where)
        require(lf['id'] not in leaves and lf['id'] not in topics, 'duplicate_leaf', where)
        require(lf['topic_ref'] in topics, 'leaf_topic', where)
        require(lf['scope'] in LEAF_SCOPES, 'leaf_scope', where)
        require(lf['representation'] in REPRESENTATIONS, 'leaf_representation', where)
        require(lf['source_refs'] and all(r in sources for r in lf['source_refs']), 'leaf_source', where)
        if topics[lf['topic_ref']]['scope'] in {'external', 'deferred'}:
            require(lf['scope'] in {'external', 'deferred'}, 'leaf_scope_exceeds_topic', where)
        for f in ('label', 'assessed_ability', 'source_pages'):
            text(lf[f], where, 600)
        if lf['representation'] == 'production':
            require(lf['scope'] in {'partial', 'external', 'deferred'}, 'production_leaf_in_app', where)
        leaves[lf['id']] = lf
    return sources, topics, leaves


def route_compatible(subject, item_family, route_family):
    return item_family == route_family or route_family in ROUTE_FAMILIES[subject].get(item_family, set())


def check_svg(path, where):
    require(path.is_file(), 'asset_missing', where)
    raw = path.read_text(encoding='utf-8')
    require(len(raw) <= 60000, 'asset_too_large', where)
    low = raw.lower()
    require('<!doctype' not in low and '<!entity' not in low, 'asset_dtd', where)
    require('http:' not in low.replace('http://www.w3.org/2000/svg', '') and 'https:' not in low,
            'asset_external_reference', where)
    require('javascript:' not in low, 'asset_script_url', where)
    # No stylesheets or CSS imports, and url() may only point at an element inside the same file.
    require('@import' not in low and '<?xml-stylesheet' not in low, 'asset_css_import', where)
    require('url(' not in LOCAL_URL.sub('', low), 'asset_external_url', where)
    require(not re.search(r'=\s*["\']\s*//', low), 'asset_protocol_relative', where)
    require(not re.search(r'\son[a-z]+\s*=', low), 'asset_event_handler', where)
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        raise Invalid(f'asset_parse: {where} {exc}')
    require(root.tag == SVG_NS + 'svg', 'asset_not_svg', where)
    require(root.get('viewBox') is not None, 'asset_viewbox', where)
    for el in root.iter():
        tag = el.tag.replace(SVG_NS, '')
        require(tag not in SVG_FORBIDDEN, 'asset_forbidden_element', f'{where} <{tag}>')
        for attr in el.attrib:
            require('href' not in attr, 'asset_href', where)
    titles = [el for el in root if el.tag == SVG_NS + 'title']
    require(titles and (titles[0].text or '').strip(), 'asset_title', where)


def check_pool(pool, subject, cur, topics, leaves, base):
    keys(pool, ['schema_version', 'subject', 'batch_id', 'version', 'manifest_version',
                'status', 'materials', 'items', 'review_log'], ['assets', 'knowledge_points'], where='pool')
    require(pool['schema_version'] == 'subject-content/1', 'pool_schema')
    require(pool['subject'] == subject, 'pool_subject')
    require(pool['manifest_version'] == cur['manifest_version'], 'pool_manifest_version')
    require(isinstance(pool['version'], int) and pool['version'] >= 1, 'pool_version')
    require(pool['status'] in STATUSES, 'pool_status')
    ident(pool['batch_id'], 'batch_id')
    assets = {}
    for a in pool.get('assets', []):
        where = a.get('id', '?')
        keys(a, ['id', 'version', 'kind', 'path', 'alt', 'provenance'], where='asset ' + where)
        ident(a['id'], where)
        require(a['id'] not in assets, 'duplicate_asset', where)
        require(a['kind'] == 'svg', 'asset_kind', where)
        require(ASSET_PATH.fullmatch(a['path']) is not None, 'asset_path', where)
        require(a['provenance'] == 'original_generic_author_draft', 'asset_provenance', where)
        text(a['alt'], where, 600)
        check_svg(base / a['path'], where)
        assets[a['id']] = a
    use_leaves = bool(leaves)
    items, materials, targets = {}, {}, {}
    for it in pool['items']:
        where = it.get('id', '?')
        keys(it, ['id', 'version', 'courses', 'topic_ref', 'target_id', 'stage', 'family', 'format',
                  'stem', 'options', 'correct_option_id', 'hint', 'explanation', 'material_id',
                  'provenance'], ['leaf_refs', 'asset_ids', 'repair_target_id'], where=where)
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
            require('repair_target_id' not in it, 'repair_item_has_route', where)
            targets.setdefault(it['target_id'], []).append(it)
        for aid in it.get('asset_ids', []):
            require(aid in assets, 'item_asset', f'{where} {aid}')
        if 'asset_ids' in it:
            id_list(it['asset_ids'], where)
        if use_leaves:
            require(it.get('leaf_refs'), 'item_unmapped_leaf', where)
        if 'leaf_refs' in it:
            id_list(it['leaf_refs'], where)
            for lid in it['leaf_refs']:
                require(lid in leaves, 'item_leaf', f'{where} {lid}')
                require(topics[leaves[lid]['topic_ref']]['course'] == topic['course'], 'item_leaf_course', f'{where} {lid}')
                require(leaves[lid]['scope'] in {'in_app', 'partial', 'extension'}, 'item_leaf_scope', f'{where} {lid}')
        items[it['id']] = it
    for m in pool['materials']:
        where = m.get('id', '?')
        keys(m, ['id', 'version', 'courses', 'kind', 'title', 'body', 'question_ids'], ['asset_ids'], where=where)
        ident(m['id'], where)
        require(m['id'] not in materials and m['id'] not in items, 'duplicate_material', where)
        require(m['kind'] in MATERIAL_KINDS, 'material_kind', where)
        text(m['title'], where, 200)
        text(m['body'], where, 6000)
        require(m['question_ids'] and len(set(m['question_ids'])) == len(m['question_ids']), 'material_questions', where)
        for aid in m.get('asset_ids', []):
            require(aid in assets, 'material_asset', f'{where} {aid}')
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
        if use_leaves:
            require(len({tuple(sorted(g['leaf_refs'])) for g in group}) == 1, 'repair_set_leaf_mismatch', tid)
    for it in items.values():
        if 'repair_target_id' in it:
            rt = it['repair_target_id']
            require(rt in targets, 'repair_route_target', f"{it['id']} {rt}")
            route = targets[rt][0]
            require(topics[route['topic_ref']]['grade'] == topics[it['topic_ref']]['grade'], 'repair_route_grade', it['id'])
            require(route_compatible(subject, it['family'], route['family']), 'repair_route_family',
                    f"{it['id']} {it['family']} -> {route['family']} ({rt})")
            if use_leaves:
                require(set(it['leaf_refs']) & set(route['leaf_refs']), 'repair_route_leaf', it['id'])
        if use_leaves and it['target_id'] is None:
            require('repair_target_id' in it, 'missing_repair_route', it['id'])
        if use_leaves:
            visual = any(leaves[l]['representation'] == 'visual' for l in it['leaf_refs'])
            if visual:
                mat = materials.get(it['material_id'])
                has_asset = bool(it.get('asset_ids')) or bool(mat and mat.get('asset_ids'))
                require(has_asset, 'visual_leaf_without_asset', it['id'])
    kps = {}
    for kp in pool.get('knowledge_points', []):
        where = kp.get('id', '?')
        keys(kp, ['id', 'version', 'topic_ref', 'leaf_refs', 'teaching_material_id', 'acquisition_item_ids',
                  'repair_target_id', 'prerequisite_ids'], where='kp ' + where)
        ident(kp['id'], where)
        require(kp['id'] not in kps, 'duplicate_knowledge_point', where)
        require(kp['topic_ref'] in topics, 'kp_topic', where)
        id_list(kp['leaf_refs'], where)
        require(all(l in leaves and leaves[l]['topic_ref'] == kp['topic_ref'] for l in kp['leaf_refs']), 'kp_leaf', where)
        mat = materials.get(kp['teaching_material_id'])
        require(mat is not None and mat['kind'] == 'teaching', 'kp_teaching_material', where)
        id_list(kp['acquisition_item_ids'], where)
        require(len(kp['acquisition_item_ids']) == 2, 'kp_two_acquisition_tests', where)
        require(kp['acquisition_item_ids'] == mat['question_ids'], 'kp_acquisition_membership', where)
        acq = [items[q] for q in kp['acquisition_item_ids']]
        require(acq[0]['stem'] != acq[1]['stem'], 'kp_acquisition_duplicate', where)
        require(all(a.get('repair_target_id') == kp['repair_target_id'] for a in acq), 'kp_acquisition_route', where)
        require(kp['repair_target_id'] in targets, 'kp_repair_target', where)
        require(targets[kp['repair_target_id']][0]['topic_ref'] == kp['topic_ref'], 'kp_repair_topic', where)
        id_list(kp['prerequisite_ids'], where, allow_empty=True)
        kps[kp['id']] = kp
    for kp in kps.values():
        for p in kp['prerequisite_ids']:
            require(p in kps and p != kp['id'], 'kp_prerequisite', f"{kp['id']} {p}")
    state = {}

    def visit(k):
        require(state.get(k) != 1, 'kp_prerequisite_cycle', k)
        if state.get(k) == 2:
            return
        state[k] = 1
        for p in kps[k]['prerequisite_ids']:
            visit(p)
        state[k] = 2
    for k in kps:
        visit(k)
    if kps:
        teaching = {m['id'] for m in materials.values() if m['kind'] == 'teaching'}
        require(teaching == {kp['teaching_material_id'] for kp in kps.values()}, 'teaching_material_without_kp')
    log = pool['review_log']
    keys(log, ['author_check_date', 'author_checks', 'independent_review', 'owner_signoff',
               'sampled_item_ids', 'disputed_item_ids', 'rights_status'], where='review_log')
    require(set(log['sampled_item_ids']) <= set(items) and set(log['disputed_item_ids']) <= set(items),
            'review_item_reference')
    if pool['status'] == 'approved':
        require(log['independent_review'] == 'passed' and log['owner_signoff'] == 'approved'
                and log['rights_status'] == 'cleared' and not log['disputed_item_ids'], 'approved_state')
    used_assets = {a for it in items.values() for a in it.get('asset_ids', [])}
    used_assets |= {a for m in materials.values() for a in m.get('asset_ids', [])}
    require(used_assets == set(assets), 'unused_asset', ' '.join(sorted(set(assets) - used_assets)))
    return items, materials, targets, assets, kps


def leaf_report(leaves, topics, items, targets):
    """Mapped = an in-app leaf with a complete repair set mapped to it. Not a coverage claim."""
    rows = {}
    routed = {l for t in targets.values() for g in t for l in g.get('leaf_refs', [])}
    for lf in leaves.values():
        course = topics[lf['topic_ref']]['course']
        r = rows.setdefault(course, {'in_scope': 0, 'mapped': 0, 'partial': 0, 'excluded': 0, 'extension': 0})
        if lf['scope'] == 'in_app':
            r['in_scope'] += 1
            r['mapped'] += lf['id'] in routed
        elif lf['scope'] == 'partial':
            r['partial'] += 1
        elif lf['scope'] == 'extension':
            r['extension'] += 1
        else:
            r['excluded'] += 1
    return rows


def check_subject(subject):
    base = ROOT / 'content' / subject
    cur = json.loads((base / 'curriculum.json').read_text(encoding='utf-8'))
    sources, topics, leaves = check_curriculum(cur, subject)
    totals = {'items': 0, 'materials': 0, 'repair_sets': 0, 'assets': 0, 'knowledge_points': 0}
    by_grade = {}
    all_items, all_targets = {}, {}
    for path in sorted(base.glob('pool-*.json')):
        pool = json.loads(path.read_text(encoding='utf-8'))
        items, materials, targets, assets, kps = check_pool(pool, subject, cur, topics, leaves, base)
        totals['items'] += len(items)
        totals['materials'] += len(materials)
        totals['repair_sets'] += len(targets)
        totals['assets'] += len(assets)
        totals['knowledge_points'] += len(kps)
        all_items.update(items)
        all_targets.update(targets)
        for it in items.values():
            g = topics[it['topic_ref']]['grade']
            by_grade[g] = by_grade.get(g, 0) + 1
    covered = {t for t in topics if topics[t]['scope'] in {'in_app', 'partial'}}
    return totals, by_grade, len(covered), len(sources), leaf_report(leaves, topics, all_items, all_targets)


def main(argv):
    subjects = argv or sorted(p.name for p in (ROOT / 'content').iterdir()
                              if p.name in SUBJECTS and (p / 'curriculum.json').exists())
    for subject in subjects:
        require(subject in SUBJECTS, 'unknown_subject', subject)
        totals, by_grade, topics, sources, leaves = check_subject(subject)
        print(f'PASS {subject}: {totals["items"]} items ({by_grade}), {totals["materials"]} materials, '
              f'{totals["repair_sets"]} repair sets, {totals["assets"]} SVG assets, '
              f'{totals["knowledge_points"]} knowledge points, {topics} in-app/partial topics, {sources} cited sources.')
        for course, r in sorted(leaves.items()):
            print(f'  leaves {course}: {r["mapped"]}/{r["in_scope"]} in-app leaves have a mapped repair set; '
                  f'{r["partial"]} partial, {r["extension"]} extension, {r["excluded"]} external/deferred '
                  '(author mapping, not reviewed coverage).')
    print('QA pending: independent review, owner sign-off and approved coverage. Not a content release.')


if __name__ == '__main__':
    try:
        main(sys.argv[1:])
    except Invalid as exc:
        print(f'FAIL: {exc}')
        sys.exit(1)
