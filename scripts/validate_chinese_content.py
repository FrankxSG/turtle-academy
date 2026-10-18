#!/usr/bin/env python3
"""Offline authoring check. No app planner, grader, persistence or private data.

Implements exactly the JSON Schema keywords used by contracts/chinese/1.schema.json;
not a general-purpose JSON Schema implementation. Unsupported keywords fail closed.
Errors contain paths/codes, never imported text. Python 3.10+, standard library only.
"""
import argparse
import datetime as dt
import json
import math
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = json.loads((ROOT / 'contracts/chinese/1.schema.json').read_text(encoding='utf-8'))
KEYWORDS = {'$ref', 'type', 'const', 'enum', 'anyOf', 'properties', 'required',
            'additionalProperties', 'items', 'minItems', 'maxItems', 'minimum',
            'maximum', 'minLength', 'maxLength', 'pattern', 'format'}


class Invalid(ValueError):
    pass


def require(condition, code):
    if not condition:
        raise Invalid(code)


def schema_check(value, definition, path='$'):
    require(not (set(definition) - KEYWORDS), path + ':unsupported_schema_keyword')
    if '$ref' in definition:
        ref = definition['$ref']
        require(ref.startswith('#/$defs/'), path + ':nonlocal_schema_ref')
        return schema_check(value, SCHEMA['$defs'][ref.split('/')[-1]], path)
    if 'anyOf' in definition:
        for branch in definition['anyOf']:
            try:
                schema_check(value, branch, path)
                break
            except Invalid:
                pass
        else:
            raise Invalid(path + ':anyOf')
    if 'const' in definition:
        require(value == definition['const'], path + ':const')
    if 'enum' in definition:
        require(value in definition['enum'], path + ':enum')
    if 'type' in definition:
        kind = definition['type']
        valid = {'object': type(value) is dict, 'array': type(value) is list,
                 'string': type(value) is str, 'integer': type(value) is int,
                 'null': value is None}.get(kind, False)
        require(valid, path + ':type')
    if type(value) is dict:
        props = definition.get('properties', {})
        require(set(definition.get('required', [])) <= set(value), path + ':required')
        if definition.get('additionalProperties') is False:
            require(set(value) <= set(props), path + ':unknown_key')
        for key, child in value.items():
            if key in props:
                schema_check(child, props[key], path + '.' + key)
    if type(value) is list:
        require(len(value) >= definition.get('minItems', 0), path + ':minItems')
        require(len(value) <= definition.get('maxItems', math.inf), path + ':maxItems')
        for i, child in enumerate(value):
            if 'items' in definition:
                schema_check(child, definition['items'], f'{path}[{i}]')
    if type(value) is str:
        require(len(value) >= definition.get('minLength', 0), path + ':minLength')
        require(len(value) <= definition.get('maxLength', math.inf), path + ':maxLength')
        if 'pattern' in definition:
            require(re.fullmatch(definition['pattern'], value) is not None, path + ':pattern')
        if definition.get('format') == 'date':
            try:
                require(dt.date.fromisoformat(value).isoformat() == value, path + ':date')
            except ValueError:
                raise Invalid(path + ':date') from None
    if type(value) is int:
        require(value >= definition.get('minimum', -math.inf), path + ':minimum')
        require(value <= definition.get('maximum', math.inf), path + ':maximum')


def unique(records, key='id'):
    ids = [r[key] for r in records]
    require(len(ids) == len(set(ids)), 'duplicate_id')
    return {r[key]: r for r in records}


def load(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def check_text_slots(record, field, question_ids):
    """Check declarative text links only; this does not render learner UI."""
    text = record[field]
    blanks, annotations = unique(record['blanks']), unique(record['annotations'])
    require(not (set(blanks) & set(annotations)), 'duplicate_text_slot')
    tokens = re.findall(r'\{\{([^{}]+)\}\}', text)
    require(len(tokens) == len(set(tokens)), 'repeated_text_slot')
    require(set(tokens) == set(blanks) | set(annotations), 'text_slot_reference')
    require('{{' not in re.sub(r'\{\{[^{}]+\}\}', '', text), 'malformed_text_slot')
    require('}}' not in re.sub(r'\{\{[^{}]+\}\}', '', text), 'malformed_text_slot')
    for blank in blanks.values():
        require(blank['id'].startswith('blank-'), 'blank_id')
        require(blank['question_id'] in question_ids, 'blank_question_reference')
    for annotation in annotations.values():
        require(annotation['id'].startswith('pinyin-'), 'annotation_id')
    require(not re.search(r'（(?:\s*|\d+|[A-Za-z\u00c0-\u024f\u1e00-\u1eff ]+)）', text), 'unstructured_blank_or_pinyin')


def safe_halfway_boundary(plan, materials):
    """Static fixture expectation; correction completion remains a runtime gate."""
    ends = {m['question_ids'][-1] for m in materials.values()}
    inside = {q for m in materials.values() for q in m['question_ids'][:-1]}
    for count, slot in enumerate(plan['slots'], 1):
        if count >= plan['halfway_count'] and (slot['item_id'] in ends or slot['item_id'] not in inside):
            return count
    raise Invalid('no_safe_halfway_boundary')


def check_review_characters(curriculum, review):
    """P1 review characters for P2 courses: practice targets only, never P2 outcomes or coverage."""
    schema_check(review, SCHEMA['$defs']['review_characters'])
    require(review['curriculum_manifest_version'] == curriculum['manifest_version'], 'review_manifest_version')
    sources = unique(curriculum['sources'])
    grade = {(r['course'], r['character']) for r in curriculum['characters']}
    rows = unique(review['characters'])
    require(not (set(rows) & ({r['id'] for r in curriculum['characters']} | set(unique(curriculum['outcomes']))
                               | set(unique(curriculum.get('skill_targets', []))))), 'duplicate_curriculum_id')
    for row in rows.values():
        require(row['id'] == f"zh.{row['course']}.review.u{ord(row['character']):04x}", 'review_character_id')
        require(row['course'] in curriculum['courses'], 'curriculum_course')
        expected_source = 'moe-hcl-characters-2024' if 'higher' in row['course'] else 'moe-cl-characters-2024'
        require(row['source_ref'] == expected_source and row['source_ref'] in sources, 'review_character_source')
        pages = row['recognition_list_pages'] + row['writing_list_pages']
        # P1 lists are PDF pages 1-2 of the same official character-list files.
        require(bool(pages) and set(pages) <= {1, 2}, 'review_character_grade_pages')
        require(all(len(row[k]) == len(set(row[k])) for k in ['recognition_list_pages', 'writing_list_pages']), 'duplicate_character_page')
        # A character already on the course's own P2 list is targeted through that record, never twice.
        require((row['course'], row['character']) not in grade, 'review_duplicates_grade_character')
    require({c['course'] for c in review['counts']} == {r['course'] for r in rows.values()}
            and len(review['counts']) == len({c['course'] for c in review['counts']}), 'review_count_courses')
    for count in review['counts']:
        require(count['source_pdf_pages'] == [1, 2], 'review_count_pages')
        n = sum(1 for r in rows.values() if r['course'] == count['course'])
        require(n == count['review_records'] and count['p1_union_unique'] == n + count['already_in_grade_list'], 'review_count_records')
    return rows


def check_catalogue(curriculum, batch, review=None):
    schema_check(curriculum, SCHEMA['$defs']['curriculum'])
    schema_check(batch, SCHEMA['$defs']['batch'])
    require(batch['curriculum_manifest_version'] == curriculum['manifest_version'], 'manifest_version')
    outcomes = unique(curriculum['outcomes'])
    targets = unique(curriculum['characters'])
    sources = unique(curriculum['sources'])
    require(not (set(outcomes) & set(targets)), 'duplicate_curriculum_id')
    for row in list(outcomes.values()) + list(targets.values()):
        require(row['course'] in curriculum['courses'], 'curriculum_course')
        require(row['source_ref'] in sources, 'curriculum_source')
    for row in outcomes.values():
        require(1 <= row['source_pdf_page'] <= sources[row['source_ref']]['pdf_pages'], 'outcome_source_page')
        require(row['source_ref'] == 'moe-cl-2024' and row['source_printed_page'] == row['source_pdf_page'] - 2, 'outcome_printed_page')
        expected = ['exact', 'similar', 'generic'] if row['scope'] in {'in_app', 'partial'} else []
        require(row['required_stages'] == expected, 'outcome_stage_requirement')
    for row in targets.values():
        require(row['id'] == f"zh.{row['course']}.char.u{ord(row['character']):04x}", 'character_id')
        pages = row['recognition_list_pages'] + row['writing_list_pages']
        require(bool(pages) and all(1 <= p <= sources[row['source_ref']]['pdf_pages'] for p in pages), 'character_source_page')
        expected_pages = {3, 4} if row['course'].startswith('p2_') else {5, 6}
        expected_source = 'moe-hcl-characters-2024' if 'higher' in row['course'] else 'moe-cl-characters-2024'
        require(set(pages) <= expected_pages and row['source_ref'] == expected_source, 'character_grade_source')
        require(all(len(row[k]) == len(set(row[k])) for k in ['recognition_list_pages', 'writing_list_pages']), 'duplicate_character_page')
    require(len(curriculum['courses']) == len(set(curriculum['courses'])), 'duplicate_course')
    require(set(unique(curriculum['course_character_counts'], 'course')) == set(curriculum['courses']), 'character_count_courses')
    for count in curriculum['course_character_counts']:
        expected_pages = [3, 4] if count['course'].startswith('p2_') else [5, 6]
        require(count['source_pdf_pages'] == expected_pages, 'count_grade_pages')
        rows = [r for r in targets.values() if r['course'] == count['course']]
        require(len(rows) == count['union_unique'], 'character_count_union')
        for key, field in [('recognition_list_unique', 'recognition_list_pages'), ('writing_list_unique', 'writing_list_pages')]:
            require(sum(bool(r[field]) for r in rows) == count[key], 'character_count_mode')
    # Non-character repair targets (word, language point, reading skill) sit under an in-scope outcome.
    skills = unique(curriculum.get('skill_targets', []))
    require(not (set(skills) & (set(outcomes) | set(targets))), 'duplicate_curriculum_id')
    for row in skills.values():
        require(row['course'] in curriculum['courses'], 'curriculum_course')
        require(row['outcome_ref'] in outcomes and outcomes[row['outcome_ref']]['course'] == row['course'], 'skill_target_outcome')
        require(outcomes[row['outcome_ref']]['scope'] in {'in_app', 'partial'}, 'skill_target_scope')
        # kind=word is one concrete word; abilities never carry a word and are reported as abilities.
        require((row['kind'] == 'word') == ('word' in row), 'skill_target_word_identity')
    compat = set()
    for row in curriculum.get('route_compatibility', []):
        require(row['item_outcome'] in outcomes and row['target_ref'] in skills, 'route_compatibility_reference')
        compat.add((row['item_outcome'], row['target_ref']))
    reviews = check_review_characters(curriculum, review) if review is not None else {}
    used = {r for item in batch['items'] for r in item['target_refs'] + item.get('repair_target_refs', [])}
    if used & set(reviews) or 'review_characters_version' in batch:
        require(review is not None and batch.get('review_characters_version') == review['version'], 'review_characters_version')
    targets = {**targets, **reviews, **skills}
    items, materials = unique(batch['items']), unique(batch['materials'])
    require(not (set(items) & set(materials)), 'duplicate_catalogue_id')
    for item in items.values():
        options = unique(item['options'])
        require(item['correct_option_id'] in options, 'answer_key_reference')
        require(len({r['text'] for r in options.values()}) == len(options), 'duplicate_option_text')
        require(set(item['courses']) <= set(curriculum['courses']), 'item_course')
        for ref in item['outcome_refs']:
            require(ref in outcomes, 'outcome_reference')
            require(outcomes[ref]['scope'] in {'in_app', 'partial'}, 'outcome_scope')
        require({outcomes[r]['course'] for r in item['outcome_refs']} == set(item['courses']), 'outcome_course')
        for ref in item['target_refs']:
            require(ref in targets and targets[ref]['course'] in item['courses'], 'target_reference')
        if item['target_refs']:
            require({targets[r]['course'] for r in item['target_refs']} == set(item['courses']), 'target_course_coverage')
        require(bool(item['target_refs']) == (item['stage'] is not None), 'stage_target_pair')
        require(not item['asset_refs'], 'starter_external_asset_not_reviewed')
        require(item['material_id'] is None or item['material_id'] in materials, 'material_reference')
        check_text_slots(item, 'stem', {item['id']})
        available = {r['id']: r for r in item['blanks']}
        if item['material_id'] is not None:
            available.update({r['id']: r for r in materials[item['material_id']]['blanks']})
        require(item['blank_ref'] is None or (item['blank_ref'] in available and available[item['blank_ref']]['question_id'] == item['id']), 'item_blank_reference')
        require(not item['blanks'] or item['blank_ref'] in {r['id'] for r in item['blanks']}, 'unlinked_item_blank')
    assigned = []
    for material in materials.values():
        check_text_slots(material, 'body', set(material['question_ids']))
        for blank in material['blanks']:
            require(blank['question_id'] in items and items[blank['question_id']]['blank_ref'] == blank['id'], 'reciprocal_material_blank')
        if material['kind'] == 'cloze':
            require({r['question_id'] for r in material['blanks']} == set(material['question_ids']), 'cloze_question_links')
            require(len(material['blanks']) == len(material['question_ids']), 'cloze_blank_count')
        require(len(material['question_ids']) == len(set(material['question_ids'])), 'duplicate_material_question')
        for ref in material['question_ids']:
            require(ref in items and items[ref]['material_id'] == material['id'], 'material_membership')
            require(set(material['courses']) <= set(items[ref]['courses']), 'material_course')
            require(items[ref]['family'] == material['kind'], 'material_kind')
        assigned += material['question_ids']
    require(set(assigned) == {r['id'] for r in items.values() if r['material_id']}, 'orphan_material_question')
    require(len(assigned) == len(set(assigned)), 'question_in_multiple_materials')
    for target in {r for item in items.values() for r in item['target_refs']}:
        require({item['stage'] for item in items.values() if target in item['target_refs']} == {'exact', 'similar', 'generic'}, 'incomplete_repair_pool')
    # Declared repair groups: a published group must contain every declared target's complete
    # exact/similar/generic pool, and every repair item must belong to exactly one group.
    groups = unique(batch['groups'])
    require(not (set(groups) & (set(items) | set(materials))), 'duplicate_catalogue_id')
    membership = {}
    for group in groups.values():
        require(len(group['item_ids']) == len(set(group['item_ids'])), 'group_duplicate_item')
        require(len(group['target_refs']) == len(set(group['target_refs'])), 'group_duplicate_target')
        require(all(ref in targets for ref in group['target_refs']), 'group_target_reference')
        require({targets[ref]['course'] for ref in group['target_refs']} == set(group['courses']), 'group_course_coverage')
        for ref in group['item_ids']:
            require(ref in items, 'group_missing_item')
            require(items[ref]['stage'] is not None, 'group_non_repair_item')
            require(set(items[ref]['target_refs']) <= set(group['target_refs']), 'group_item_target')
            require(set(items[ref]['courses']) == set(group['courses']), 'group_item_course')
            membership[ref] = membership.get(ref, 0) + 1
        for ref in group['target_refs']:
            stages = [items[i]['stage'] for i in group['item_ids'] if ref in items[i]['target_refs']]
            require(sorted(stages) == sorted(['exact', 'similar', 'generic']), 'group_incomplete_pool')
    for item in items.values():
        if item['stage'] is not None:
            require(membership.get(item['id']) == 1, 'repair_item_group_membership')
    # Every non-repair question declares where a wrong answer is repaired; repair items do not.
    stages = {}
    for item in items.values():
        for ref in item['target_refs']:
            stages.setdefault(ref, set()).add(item['stage'])
    for item in items.values():
        routes = item.get('repair_target_refs', [])
        require(len(routes) == len(set(routes)), 'repair_route_duplicate')
        if item['stage'] is not None:
            require(not routes, 'repair_item_has_route')
            continue
        require(bool(routes), 'missing_repair_route')
        for ref in routes:
            require(ref in targets, 'repair_route_reference')
            require(stages.get(ref) == {'exact', 'similar', 'generic'}, 'repair_route_incomplete')
        require({targets[r]['course'] for r in routes} == set(item['courses']), 'repair_route_course')
        # The route must repair the skill the question assesses: the target sits under one of the
        # question's outcomes (a character target under the course's character outcome), or the
        # pair is a reviewed exception in route_compatibility.
        for ref in routes:
            target = targets[ref]
            home = target.get('outcome_ref') or f"zh.{target['course']}.r-character"
            require(home in item['outcome_refs'] or any((o, ref) in compat for o in item['outcome_refs']),
                    'repair_route_skill')
    log = batch['review_log']
    for field in ['sampled_item_ids', 'disputed_item_ids']:
        require(len(log[field]) == len(set(log[field])) and set(log[field]) <= set(items), 'review_item_reference')
    if batch['status'] == 'approved':
        require(log['independent_review'] == 'passed' and log['owner_signoff'] == 'approved' and log['rights_status'] == 'cleared', 'approved_batch_review_state')
        require(not log['disputed_item_ids'], 'approved_batch_unresolved_items')
    if curriculum['status'] == 'approved':
        require(curriculum['coverage_status'] == 'approved', 'approved_manifest_coverage_state')
    return items, materials


def check_plan(plan, curriculum, batch, review=None):
    schema_check(plan, SCHEMA['$defs']['task_plan'])
    items, materials = check_catalogue(curriculum, batch, review)
    require(plan['manifest_version'] == curriculum['manifest_version'], 'plan_manifest_version')
    require(plan['content_batch_id'] == batch['batch_id'] and plan['content_version'] == batch['version'], 'plan_batch_version')
    mids = plan['material_ids']
    require(len(mids) == len(set(mids)), 'duplicate_planned_material')
    require(len(mids) >= math.ceil(plan['x'] / 5), 'material_quota')
    expected = []
    for mid in mids:
        require(mid in materials and plan['course'] in materials[mid]['courses'], 'plan_material_course')
        expected += materials[mid]['question_ids']
    ids = [r['item_id'] for r in plan['slots']]
    require(len(ids) == len(set(ids)), 'duplicate_planned_question')
    require([i for i in ids if i in expected] == expected, 'complete_ordered_materials')
    for mid in mids:
        positions = [ids.index(i) for i in materials[mid]['question_ids'] if i in ids]
        require(len(positions) == len(materials[mid]['question_ids']), 'missing_material_question')
        require(positions == list(range(positions[0], positions[0] + len(positions))), 'interleaved_material')
    for slot in plan['slots']:
        require(slot['item_id'] in items, 'plan_item')
        item = items[slot['item_id']]
        require(plan['course'] in item['courses'] and item['version'] == slot['item_version'], 'plan_item_course_version')
        require(item['material_id'] is None or item['material_id'] in mids, 'unplanned_material_question')
        if slot['role'] == 'general':
            require(slot['target_ref'] is None and slot['starting_stage'] is None, 'general_not_repair')
        else:
            require(slot['target_ref'] in item['target_refs'] and slot['starting_stage'] == item['stage'], 'repair_role_mapping')
            require(slot['role'] != 'delayed_review' or slot['starting_stage'] == 'generic', 'review_stage')
    require(plan['planned_main_count'] == len(ids) and len(ids) >= plan['x'], 'planned_count')
    require(plan['halfway_count'] == math.ceil(len(ids) / 2), 'halfway_actual_total')
    require(plan['halfway_safe_boundary_count'] == safe_halfway_boundary(plan, materials), 'halfway_safe_boundary')


def check_import(payload, curriculum, today, approved_manifest_versions=(), review=None):
    # No I/O, storage, ownership, logging, preview or mutation. Caller must first
    # enforce <= 1 MiB decoded UTF-8 JSON; this authoring tool never accepts users.
    schema_check(payload, SCHEMA['$defs']['import'])
    result, entries = payload['extraction_result'], payload['items']
    require(result != 'errors_found' or bool(entries), 'errors_found_empty')
    require(result != 'no_errors_found' or not entries, 'no_errors_with_entries')
    manifest = payload['curriculum_manifest_version']
    if manifest is not None:
        require(manifest in approved_manifest_versions and manifest == curriculum['manifest_version'], 'manifest_not_approved')
        require(curriculum['status'] == 'approved' and curriculum['coverage_status'] == 'approved', 'manifest_not_approved')
    # Mapped entries must name an explicitly typed repair target: a character record (grade list or
    # approved P1 review list) or a skill target. A raw outcome is never a mapping target.
    known = {r['id']: r for r in curriculum['characters'] + curriculum.get('skill_targets', [])}
    reviews = check_review_characters(curriculum, review) if review is not None else {}
    known.update(reviews)
    for entry in entries:
        bound = {'character': 1, 'word': 8}.get(entry['target_kind'], 64)
        for field in ['target_value', 'observed_wrong_form']:
            require(field not in entry or len(entry[field]) <= bound, 'target_bound')
        require(dt.date.fromisoformat(entry['observation_date']) <= today, 'future_observation')
        ref = entry['knowledge_point_ref']
        if entry['mapping_status'] == 'pending_content':
            require(ref is None, 'pending_ref_must_be_null')
            continue
        require(manifest is not None and ref in known, 'mapped_ref')
        target = known[ref]
        require(ref not in reviews or review['status'] == 'approved', 'review_characters_not_approved')
        require(target['course'] == payload['course'], 'mapped_course')
        if 'character' in target:
            require(entry['target_kind'] == 'character', 'mapped_target_kind')
            require(target['character'] == entry['target_value'], 'mapped_character_value')
            require(entry['assessed_skill'] == 'character_recognition', 'mapped_assessed_skill')
        else:
            require(entry['target_kind'] == target['kind'], 'mapped_target_kind')
            require(entry['assessed_skill'] == target['assessed_skill'], 'mapped_assessed_skill')
            if target['kind'] == 'word':
                require(entry['target_value'] == target['word'], 'mapped_word_value')


def check_attempt(event, item):
    schema_check(event, SCHEMA['$defs']['attempt'])
    require(event['item_id'] == item['id'] and event['item_version'] == item['version'], 'attempt_item_version')
    require(event['selected_option_id'] in {r['id'] for r in item['options']}, 'attempt_option')
    required = {'first': 'none', 'retry': 'hint', 'correction': 'answer_and_explanation'}
    require(event['assistance'] == required[event['phase']], 'attempt_assistance_phase')


def check_batches(curriculum, batches, review=None):
    """Each batch is checked on its own, so one batch's review state never covers another's items.
    Catalogue IDs must still be unique across batches, because attempts and plans name items by ID."""
    require(len({b['batch_id'] for b in batches}) == len(batches), 'duplicate_batch_id')
    seen = set()
    for batch in batches:
        check_catalogue(curriculum, batch, review)
        ids = {r['id'] for key in ['items', 'materials', 'groups'] for r in batch[key]}
        require(not (ids & seen), 'duplicate_catalogue_id_across_batches')
        seen |= ids


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    curriculum = load(ROOT / 'content/chinese/curriculum.json')
    review = load(ROOT / 'content/chinese/review-characters.json')
    batches = [load(path) for path in sorted((ROOT / 'content/chinese/batches').glob('*.json'))]
    check_batches(curriculum, batches, review)
    by_id = {b['batch_id']: b for b in batches}
    plans = sorted((ROOT / 'content/chinese/fixtures').glob('task-*.json'))
    for path in plans:
        plan = load(path)
        require(plan['content_batch_id'] in by_id, 'plan_batch_version')
        check_plan(plan, curriculum, by_id[plan['content_batch_id']], review)
    print(f"PASS: {len(curriculum['outcomes'])} course outcomes, {len(curriculum['characters'])} character records, "
          f"{len(review['characters'])} P1 review records ({review['status']}); "
          f"{len(batches)} batches, {sum(len(b['materials']) for b in batches)} materials, "
          f"{sum(len(b['items']) for b in batches)} items, {len(plans)} synthetic plans.")
    pending = [f"{b['batch_id']} v{b['version']} review and sign-off" for b in batches if b['status'] != 'approved']
    if curriculum['status'] != 'approved':
        pending.append('approved coverage denominator')
    if review['status'] != 'approved':
        pending.append(f"P1 review list {review['version']} review and sign-off")
    print('QA pending: ' + (', '.join(pending) or 'none recorded') + '. Not a content release.')


if __name__ == '__main__':
    try:
        main()
    except (Invalid, KeyError, TypeError, json.JSONDecodeError) as exc:
        # This entry point reads public files only. No private payload output.
        raise SystemExit('FAIL: ' + type(exc).__name__ + ': ' + str(exc)) from None
