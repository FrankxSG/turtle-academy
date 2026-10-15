"""Boundary and corruption checks for public authoring contracts, not app tests."""
import copy
import datetime as dt
import unittest

from validate_chinese_content import (ROOT, SCHEMA, Invalid, check_attempt,
                                     check_catalogue, check_import, check_plan,
                                     load, schema_check)


class Contracts(unittest.TestCase):
    def setUp(self):
        self.curriculum = load(ROOT / 'content/chinese/curriculum.json')
        self.batch = load(ROOT / 'content/chinese/batches/starter-001.json')
        self.plan = load(ROOT / 'content/chinese/fixtures/task-x10.json')
        self.payload = {'schema_version': 'pilot-mistakes/1', 'subject': 'chinese',
                        'course': 'p2_chinese', 'curriculum_manifest_version': None,
                        'extraction_result': 'errors_found', 'items': [{
                            'mapping_status': 'pending_content', 'knowledge_point_ref': None,
                            'target_kind': 'character', 'target_value': '晴',
                            'assessed_skill': 'character_recognition', 'error_type': 'unknown_cause',
                            'observation_date': '2026-10-14', 'source_type': 'home_practice'}]}

    def test_all_public_plans_valid(self):
        for path in (ROOT / 'content/chinese/fixtures').glob('task-*.json'):
            check_plan(load(path), self.curriculum, self.batch)

    def test_x_boundary_rejects_bool_fraction_and_old_limits(self):
        for x in [True, 5, 20, 10.5]:
            with self.subTest(x=x), self.assertRaises(Invalid):
                schema_check(dict(self.plan, x=x), SCHEMA['$defs']['task_plan'])

    def test_whole_material_and_actual_total(self):
        for mutate in [lambda p: p['slots'].pop(2),
                       lambda p: p.update(planned_main_count=11),
                       lambda p: p.update(halfway_count=4),
                       lambda p: p.update(material_ids=['zh-m01'])]:
            p = copy.deepcopy(self.plan)
            mutate(p)
            with self.assertRaises(Invalid):
                check_plan(p, self.curriculum, self.batch)

    def test_materials_cannot_be_interleaved_with_short_items(self):
        p = copy.deepcopy(self.plan)
        p['slots'].insert(1, {'item_id': 'zh-short-u5ea7.q1', 'item_version': 2,
                              'role': 'repair', 'target_ref': 'zh.p2_chinese.char.u5ea7',
                              'starting_stage': 'exact'})
        p.update(planned_main_count=11, halfway_count=6)
        with self.assertRaisesRegex(Invalid, 'interleaved_material'):
            check_plan(p, self.curriculum, self.batch)

    def test_bad_keys_duplicates_and_wrong_course(self):
        mutations = [lambda b: b['items'][0].update(correct_option_id='opt-9'),
                     lambda b: b['items'].append(copy.deepcopy(b['items'][0])),
                     lambda b: b['items'][0]['outcome_refs'].append('zh.p3_chinese.r-explicit'),
                     lambda b: b['materials'][0]['question_ids'].pop(),
                     lambda b: b['items'][0].update(learner_name='synthetic_forbidden_key')]
        for mutate in mutations:
            b = copy.deepcopy(self.batch)
            mutate(b)
            with self.assertRaises(Invalid):
                check_catalogue(self.curriculum, b)

    def test_missing_repair_stage(self):
        self.batch['items'] = [r for r in self.batch['items'] if r['id'] != 'zh-short-u5ea7.q3']
        with self.assertRaisesRegex(Invalid, 'incomplete_repair_pool'):
            check_catalogue(self.curriculum, self.batch)

    def test_import_pending_and_structurally_empty_no_errors(self):
        check_import(self.payload, self.curriculum, dt.date(2026, 10, 15))
        self.payload.update(extraction_result='no_errors_found', items=[])
        check_import(self.payload, self.curriculum, dt.date(2026, 10, 15))
        self.payload.update(extraction_result='incomplete')
        check_import(self.payload, self.curriculum, dt.date(2026, 10, 15))
        # Incomplete being structurally valid must not start general practice.

    def test_p3_imports_and_unapproved_manifest_rejected(self):
        self.payload['course'] = 'p3_chinese'
        with self.assertRaises(Invalid):
            check_import(self.payload, self.curriculum, dt.date(2026, 10, 15))
        self.payload['course'] = 'p2_chinese'
        self.payload['curriculum_manifest_version'] = self.curriculum['manifest_version']
        with self.assertRaisesRegex(Invalid, 'manifest_not_approved'):
            check_import(self.payload, self.curriculum, dt.date(2026, 10, 15))

    def test_import_date_bounds_and_no_error_contradiction(self):
        for field, value in [('target_value', '字' * 9), ('observation_date', '2026-10-16'),
                             ('observation_date', '2026-02-30'), ('knowledge_point_ref', 'invented.id')]:
            p = copy.deepcopy(self.payload)
            p['items'][0][field] = value
            with self.assertRaises(Invalid):
                check_import(p, self.curriculum, dt.date(2026, 10, 15))
        self.payload['extraction_result'] = 'no_errors_found'
        with self.assertRaisesRegex(Invalid, 'no_errors_with_entries'):
            check_import(self.payload, self.curriculum, dt.date(2026, 10, 15))

    def test_attempt_assistance_cannot_be_independent_first(self):
        item = self.batch['items'][0]
        event = {'schema_version': 'chinese-attempt/1', 'event_id': 'synthetic.e1',
                 'task_id': 'synthetic.task', 'item_id': item['id'], 'item_version': item['version'],
                 'phase': 'first', 'selected_option_id': 'opt-1', 'assistance': 'none',
                 'local_day': '2026-10-15', 'sequence': 1, 'idempotency_key': 'synthetic.key'}
        check_attempt(event, item)
        event['assistance'] = 'hint'
        with self.assertRaisesRegex(Invalid, 'attempt_assistance_phase'):
            check_attempt(event, item)
        event.update(phase='retry')
        check_attempt(event, item)

    def test_positive_versions_and_old_attempt_version_mismatch(self):
        # New versions are accepted by shape but must match the pinned key.
        for definition in ['item', 'material', 'batch']:
            record = self.batch if definition == 'batch' else self.batch[definition + 's'][0]
            for v in [1, 2, 7]:
                schema_check(dict(record, version=v), SCHEMA['$defs'][definition])
            for v in [0, -1, True, 1.5]:
                with self.assertRaises(Invalid):
                    schema_check(dict(record, version=v), SCHEMA['$defs'][definition])
        p = copy.deepcopy(self.plan)
        p['slots'][0]['item_version'] = 1
        with self.assertRaisesRegex(Invalid, 'plan_item_course_version'):
            check_plan(p, self.curriculum, self.batch)

    def test_ids_hashes_and_trailing_newlines(self):
        for value in ['7c20c966-17ad-4f45-8afb-27cc71f93220', '0123abcd', '9', 'synthetic.e1']:
            schema_check(value, SCHEMA['$defs']['opaque_id'])
        for value in ['abc\n', 'a b', '', '\n', 'a' * 129]:
            with self.assertRaises(Invalid):
                schema_check(value, SCHEMA['$defs']['opaque_id'])
        pattern = SCHEMA['$defs']['item']['properties']['id']
        digest = SCHEMA['$defs']['curriculum']['properties']['sources']['items']['properties']['sha256']
        for value, definition in [('abc\n', pattern), ('a' * 64 + '\n', digest)]:
            with self.assertRaises(Invalid):
                schema_check(value, definition)
            # The JSON Schema regex itself also rejects final newline with search semantics.
            import re
            self.assertIsNone(re.search(definition['pattern'], value))

    def test_review_states_are_shape_not_approval(self):
        b = copy.deepcopy(self.batch)
        b['status'] = 'approved'
        schema_check(b, SCHEMA['$defs']['batch'])
        with self.assertRaisesRegex(Invalid, 'approved_batch_review_state'):
            check_catalogue(self.curriculum, b)
        b['review_log'].update(independent_review='passed', owner_signoff='approved', rights_status='cleared')
        with self.assertRaisesRegex(Invalid, 'approved_batch_unresolved_items'):
            check_catalogue(self.curriculum, b)
        b['review_log']['disputed_item_ids'] = []
        check_catalogue(self.curriculum, b)  # Synthetic consistency only; not authentic sign-off.
        for field in ['sampled_item_ids', 'disputed_item_ids']:
            b['review_log'][field] = ['missing.item']
            with self.assertRaisesRegex(Invalid, 'review_item_reference'):
                check_catalogue(self.curriculum, b)
            b['review_log'][field] = []

    def test_source_grade_page_and_repair_course_corruption(self):
        for mutate in [lambda c: c['outcomes'][0].update(source_printed_page=1),
                       lambda c: c['characters'][0].update(recognition_list_pages=[5]),
                       lambda c: c['characters'][0].update(source_ref='moe-hcl-characters-2024'),
                       lambda c: c['course_character_counts'][0].update(source_pdf_pages=[5, 6])]:
            c = copy.deepcopy(self.curriculum)
            mutate(c)
            with self.assertRaises(Invalid):
                check_catalogue(c, self.batch)
        self.batch['items'][-1]['target_refs'].pop()
        with self.assertRaisesRegex(Invalid, 'target_course_coverage'):
            check_catalogue(self.curriculum, self.batch)

    def test_mapped_character_is_one_exact_codepoint(self):
        c = copy.deepcopy(self.curriculum)
        c.update(status='approved', coverage_status='approved')
        p = copy.deepcopy(self.payload)
        p['curriculum_manifest_version'] = c['manifest_version']
        p['items'][0].update(mapping_status='mapped', knowledge_point_ref='zh.p2_chinese.char.u6674')
        check_import(p, c, dt.date(2026, 10, 15), [c['manifest_version']])
        for value in ['睛', '晴天']:
            p['items'][0]['target_value'] = value
            with self.assertRaises(Invalid):
                check_import(p, c, dt.date(2026, 10, 15), [c['manifest_version']])
        p['items'][0].update(target_value='晴', knowledge_point_ref='zh.p2_chinese.r-character')
        with self.assertRaisesRegex(Invalid, 'mapped_character_value'):
            check_import(p, c, dt.date(2026, 10, 15), [c['manifest_version']])

    def test_mid_material_halfway_waits_for_end(self):
        p = load(ROOT / 'content/chinese/fixtures/task-x12.json')
        self.assertEqual(p['planned_main_count'], 15)
        self.assertEqual(p['halfway_count'], 8)
        self.assertEqual(p['halfway_safe_boundary_count'], 10)
        check_plan(p, self.curriculum, self.batch)
        p['halfway_safe_boundary_count'] = 8
        with self.assertRaisesRegex(Invalid, 'halfway_safe_boundary'):
            check_plan(p, self.curriculum, self.batch)

    def test_material_quota_is_intentionally_a_minimum(self):
        p = load(ROOT / 'content/chinese/fixtures/task-x19.json')
        p['x'] = 6
        check_plan(p, self.curriculum, self.batch)

    def test_structured_blanks_annotations_and_reciprocal_links(self):
        for mutate in [lambda b: b['materials'][2]['blanks'][0].update(question_id='missing.item'),
                       lambda b: b['materials'][2]['annotations'][0].update(id='pinyin-9'),
                       lambda b: b['items'][10].update(blank_ref='blank-5'),
                       lambda b: b['items'][-1].update(stem='未解析的（　）')]:
            b = copy.deepcopy(self.batch)
            mutate(b)
            with self.assertRaises(Invalid):
                check_catalogue(self.curriculum, b)


if __name__ == '__main__':
    unittest.main()
