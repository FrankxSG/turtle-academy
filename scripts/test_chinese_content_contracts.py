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
        p['slots'].insert(1, {'item_id': 'zh-short-u5ea7.q1', 'item_version': 1,
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

    def test_import_pending_and_verified_no_errors(self):
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
                 'task_id': 'synthetic.task', 'item_id': item['id'], 'item_version': 1,
                 'phase': 'first', 'selected_option_id': 'opt-1', 'assistance': 'none',
                 'local_day': '2026-10-15', 'sequence': 1, 'idempotency_key': 'synthetic.key'}
        check_attempt(event, item)
        event['assistance'] = 'hint'
        with self.assertRaisesRegex(Invalid, 'attempt_assistance_phase'):
            check_attempt(event, item)
        event.update(phase='retry')
        check_attempt(event, item)


if __name__ == '__main__':
    unittest.main()
