"""Boundary and corruption checks for public authoring contracts, not app tests."""
import copy
import datetime as dt
import unittest

from validate_chinese_content import (ROOT, SCHEMA, Invalid, check_attempt,
                                     check_batches, check_catalogue, check_import,
                                     check_plan, check_review_characters, load, schema_check)


class Contracts(unittest.TestCase):
    def setUp(self):
        self.curriculum = load(ROOT / 'content/chinese/curriculum.json')
        self.batch = load(ROOT / 'content/chinese/batches/starter-001.json')
        self.plan = load(ROOT / 'content/chinese/fixtures/task-x10.json')
        self.review = load(ROOT / 'content/chinese/review-characters.json')
        self.payload = {'schema_version': 'pilot-mistakes/1', 'subject': 'chinese',
                        'course': 'p2_chinese', 'curriculum_manifest_version': None,
                        'extraction_result': 'errors_found', 'items': [{
                            'mapping_status': 'pending_content', 'knowledge_point_ref': None,
                            'target_kind': 'character', 'target_value': '晴',
                            'assessed_skill': 'character_recognition', 'error_type': 'unknown_cause',
                            'observation_date': '2026-10-14', 'source_type': 'home_practice'}]}

    def test_every_published_batch_is_valid_on_its_own(self):
        batches = [load(p) for p in sorted((ROOT / 'content/chinese/batches').glob('*.json'))]
        check_batches(self.curriculum, batches, self.review)

    def test_ids_must_be_unique_across_batches(self):
        other = copy.deepcopy(self.batch)
        other['batch_id'] = 'zh-test-other'
        with self.assertRaisesRegex(Invalid, 'duplicate_catalogue_id_across_batches'):
            check_batches(self.curriculum, [self.batch, other])
        with self.assertRaisesRegex(Invalid, 'duplicate_batch_id'):
            check_batches(self.curriculum, [self.batch, copy.deepcopy(self.batch)])

    def test_all_public_plans_valid(self):
        for path in (ROOT / 'content/chinese/fixtures').glob('task-*.json'):
            check_plan(load(path), self.curriculum, self.batch)

    def test_x_boundary_rejects_bool_fraction_and_old_limits(self):
        for x in [True, 5, 21, 10.5]:
            with self.subTest(x=x), self.assertRaises(Invalid):
                schema_check(dict(self.plan, x=x), SCHEMA['$defs']['task_plan'])
        # Owner decision 2026-10-18: Chinese may go up to 20 a day in the first pilot.
        schema_check(dict(self.plan, x=20), SCHEMA['$defs']['task_plan'])

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
        p['slots'].insert(1, {'item_id': 'zh-p2-confusable-u5ea7.q1', 'item_version': 3,
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
        self.batch['items'] = [r for r in self.batch['items'] if r['id'] != 'zh-p2-confusable-u5ea7.q3']
        with self.assertRaisesRegex(Invalid, 'incomplete_repair_pool'):
            check_catalogue(self.curriculum, self.batch)

    def test_whole_repair_pool_deletion_is_detected(self):
        self.batch['items'] = [r for r in self.batch['items'] if not r['id'].startswith('zh-p2-confusable-u6e05.')]
        with self.assertRaisesRegex(Invalid, 'group_missing_item'):
            check_catalogue(self.curriculum, self.batch)

    def test_group_must_declare_every_repair_item(self):
        group = self.batch['groups'][0]
        group['item_ids'] = [i for i in group['item_ids'] if not i.startswith('zh-p2-confusable-u6e05.')]
        group['target_refs'] = [t for t in group['target_refs'] if not t.endswith('.u6e05')]
        with self.assertRaisesRegex(Invalid, 'repair_item_group_membership'):
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
        # Synthetic pending states, independent of the real batch's current review state.
        b['review_log'].update(independent_review='changes_requested', owner_signoff='pending',
                               rights_status='original_draft_pending_owner_rights_review')
        schema_check(b, SCHEMA['$defs']['batch'])
        with self.assertRaisesRegex(Invalid, 'approved_batch_review_state'):
            check_catalogue(self.curriculum, b)
        b['review_log'].update(independent_review='passed', owner_signoff='approved', rights_status='cleared')
        # Synthetic open dispute, independent of the real batch's current review state.
        b['review_log']['disputed_item_ids'] = [b['items'][0]['id']]
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
        next(r for r in reversed(self.batch['items']) if r['target_refs'])['target_refs'].pop()
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
        with self.assertRaisesRegex(Invalid, 'mapped_ref'):
            check_import(p, c, dt.date(2026, 10, 15), [c['manifest_version']])
        p['items'][0].update(knowledge_point_ref='zh.p2_chinese.char.u6674', assessed_skill='word_meaning')
        with self.assertRaisesRegex(Invalid, 'mapped_assessed_skill'):
            check_import(p, c, dt.date(2026, 10, 15), [c['manifest_version']])

    def _approved_word_import(self, **entry):
        c = copy.deepcopy(self.curriculum)
        c.update(status='approved', coverage_status='approved')
        p = copy.deepcopy(self.payload)
        p['curriculum_manifest_version'] = c['manifest_version']
        p['items'][0].update(mapping_status='mapped', **entry)
        return p, c

    def test_mapped_imports_need_a_typed_compatible_target(self):
        today = dt.date(2026, 10, 15)
        # Review probe: a raw reading outcome is not a word target.
        p, c = self._approved_word_import(target_kind='word', target_value='苹果', assessed_skill='word_meaning',
                                          knowledge_point_ref='zh.p2_chinese.r-explicit')
        with self.assertRaisesRegex(Invalid, 'mapped_ref'):
            check_import(p, c, today, [c['manifest_version']])
        # Review probe: a word cannot map to an ability target.
        p['items'][0]['knowledge_point_ref'] = 'zh.p2_chinese.skill.collocation'
        with self.assertRaisesRegex(Invalid, 'mapped_target_kind'):
            check_import(p, c, today, [c['manifest_version']])
        # An ability import must match the target's reviewed assessed skill.
        p['items'][0].update(target_kind='language_point', target_value='词语搭配', assessed_skill='word_meaning')
        with self.assertRaisesRegex(Invalid, 'mapped_assessed_skill'):
            check_import(p, c, today, [c['manifest_version']])
        p['items'][0]['assessed_skill'] = 'language_use'
        check_import(p, c, today, [c['manifest_version']])
        # A concrete word target must carry, and match, its word.
        c['skill_targets'].append({'id': 'zh.p2_chinese.word.synthetic', 'course': 'p2_chinese',
                                   'outcome_ref': 'zh.p2_chinese.lu-word-choice', 'kind': 'word',
                                   'assessed_skill': 'word_meaning', 'word': '紧张', 'label_zh': '紧张'})
        p['items'][0].update(knowledge_point_ref='zh.p2_chinese.word.synthetic', target_kind='word',
                             assessed_skill='word_meaning', target_value='苹果')
        with self.assertRaisesRegex(Invalid, 'mapped_word_value'):
            check_import(p, c, today, [c['manifest_version']])
        p['items'][0]['target_value'] = '紧张'
        check_import(p, c, today, [c['manifest_version']])

    def test_skill_target_word_identity(self):
        for mutate in [lambda t: t.update(kind='word'), lambda t: t.update(word='紧张')]:
            c = copy.deepcopy(self.curriculum)
            mutate(next(t for t in c['skill_targets'] if t['id'] == 'zh.p2_chinese.skill.word-choice'))
            with self.subTest(), self.assertRaisesRegex(Invalid, 'skill_target_word_identity'):
                check_catalogue(c, self.batch)

    def test_repair_route_must_fit_the_assessed_skill(self):
        # Review probe: explicit-information questions routed to punctuation targets.
        b = copy.deepcopy(self.batch)
        next(r for r in b['items'] if r['id'] == 'zh-m01.q1').update(
            repair_target_refs=['zh.p2_chinese.skill.punctuation', 'zh.p2_higher_chinese.skill.punctuation'])
        with self.assertRaisesRegex(Invalid, 'repair_route_skill'):
            check_catalogue(self.curriculum, b)
        # A reviewed exception makes that specific pair acceptable.
        c = copy.deepcopy(self.curriculum)
        c['route_compatibility'] = [
            {'item_outcome': 'zh.p2_chinese.r-explicit', 'target_ref': 'zh.p2_chinese.skill.punctuation', 'note': 'synthetic test'},
            {'item_outcome': 'zh.p2_higher_chinese.r-explicit', 'target_ref': 'zh.p2_higher_chinese.skill.punctuation', 'note': 'synthetic test'}]
        check_catalogue(c, b)
        # A character target needs a character-recognition question.
        b = copy.deepcopy(self.batch)
        next(r for r in b['items'] if r['id'] == 'zh-m01.q1').update(
            repair_target_refs=['zh.p2_chinese.char.u6674', 'zh.p2_higher_chinese.char.u6674'])
        with self.assertRaisesRegex(Invalid, 'repair_route_skill'):
            check_catalogue(self.curriculum, b)

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

    def test_every_non_repair_question_declares_a_complete_route(self):
        item = next(r for r in self.batch['items'] if r['id'] == 'zh-m01.q1')
        for mutate, code in [(lambda r: r.pop('repair_target_refs'), 'missing_repair_route'),
                             (lambda r: r.update(repair_target_refs=['zh.p2_chinese.skill.explicit-info']), 'repair_route_course'),
                             (lambda r: r.update(repair_target_refs=['zh.p2_chinese.skill.unknown', 'zh.p2_higher_chinese.skill.unknown']), 'repair_route_reference')]:
            b = copy.deepcopy(self.batch)
            mutate(next(r for r in b['items'] if r['id'] == item['id']))
            with self.subTest(code=code), self.assertRaisesRegex(Invalid, code):
                check_catalogue(self.curriculum, b)
        b = copy.deepcopy(self.batch)
        next(r for r in b['items'] if r['id'] == 'zh-p2-measure.q1').update(repair_target_refs=['zh.p2_chinese.skill.measure-word'])
        with self.assertRaisesRegex(Invalid, 'repair_item_has_route'):
            check_catalogue(self.curriculum, b)

    def test_skill_targets_sit_under_an_in_scope_outcome_of_the_same_course(self):
        for mutate, code in [(lambda c: c['skill_targets'][0].update(outcome_ref='zh.p3_chinese.r-explicit'), 'skill_target_outcome'),
                             (lambda c: c['skill_targets'][0].update(outcome_ref='zh.p2_chinese.listen-sounds'), 'skill_target_scope'),
                             (lambda c: c['skill_targets'].append(dict(c['skill_targets'][0])), 'duplicate_id')]:
            c = copy.deepcopy(self.curriculum)
            mutate(c)
            with self.subTest(code=code), self.assertRaisesRegex(Invalid, code):
                check_catalogue(c, self.batch)


class ReviewCharacters(unittest.TestCase):
    """P1 review characters: P2-course practice targets from the P1 pages of the official lists."""

    def setUp(self):
        self.curriculum = load(ROOT / 'content/chinese/curriculum.json')
        self.review = load(ROOT / 'content/chinese/review-characters.json')
        self.batch = load(ROOT / 'content/chinese/batches/starter-001.json')

    def test_approved_batch_cannot_depend_on_proposed_review_targets(self):
        batch = load(ROOT / 'content/chinese/batches/starter-003.json')
        batch['status'] = 'approved'
        batch['review_log'].update(independent_review='passed', owner_signoff='approved', rights_status='cleared', disputed_item_ids=[])
        with self.assertRaisesRegex(Invalid, 'approved_batch_review_characters_not_approved'):
            check_catalogue(self.curriculum, batch, self.review)
        check_catalogue(self.curriculum, batch, dict(self.review, status='approved'))

    def _row(self, review, char, course='p2_chinese'):
        return next(r for r in review['characters'] if r['character'] == char and r['course'] == course)

    def test_published_list_is_valid_and_never_repeats_a_grade_character(self):
        rows = check_review_characters(self.curriculum, self.review)
        grade = {(r['course'], r['character']) for r in self.curriculum['characters']}
        self.assertFalse({(r['course'], r['character']) for r in rows.values()} & grade)
        self.assertEqual({r['course'] for r in rows.values()}, {'p2_chinese', 'p2_higher_chinese'})

    def test_corruptions_are_rejected(self):
        first = self.review['characters'][0]
        cases = [
            (lambda r: r['characters'][0].update(recognition_list_pages=[3]), 'review_character_grade_pages'),
            (lambda r: r['characters'][0].update(recognition_list_pages=[], writing_list_pages=[]), 'review_character_grade_pages'),
            (lambda r: r['characters'][0].update(id=first['id'].replace('.review.', '.char.')), 'review_character_id'),
            (lambda r: r['characters'][0].update(course='p3_chinese'), 'enum'),
            (lambda r: r['characters'][0].update(source_ref='moe-hcl-characters-2024')
             if first['course'] == 'p2_chinese' else r['characters'][0].update(source_ref='moe-cl-characters-2024'), 'review_character_source'),
            (lambda r: r['characters'].append(dict(first, character='晴', id='zh.p2_chinese.review.u6674', course='p2_chinese',
                                                   source_ref='moe-cl-characters-2024')), 'review_duplicates_grade_character'),
            (lambda r: r['characters'].append(dict(first)), 'duplicate_id'),
            (lambda r: r['counts'][0].update(review_records=r['counts'][0]['review_records'] + 1), 'review_count_records'),
            (lambda r: r.update(curriculum_manifest_version='other'), 'review_manifest_version'),
            (lambda r: r['characters'][0].update(extra=1), 'unknown_key'),
            (lambda r: r['extra_characters'][0].update(id=r['extra_characters'][0]['id'].replace('.extra.', '.review.')), 'extra_character_id'),
            (lambda r: r['extra_characters'].append({'id': 'zh.p2_chinese.extra.u6674', 'course': 'p2_chinese', 'character': '晴',
                                                     'example_word': '晴天', 'official_list': 'none'}), 'extra_character_on_official_list'),
            (lambda r: r['extra_characters'].append({'id': 'zh.p2_chinese.extra.u4ee5', 'course': 'p2_chinese', 'character': '以',
                                                     'example_word': '所以', 'official_list': 'none'}), 'extra_character_on_official_list'),
            (lambda r: r['extra_characters'][0].update(example_word='天气'), 'extra_character_example_word'),
            (lambda r: r['extra_characters'][0].update(official_list='p3' if r['extra_characters'][0]['official_list'] == 'none' else 'none'),
             'extra_character_official_list'),
        ]
        for mutate, code in cases:
            r = copy.deepcopy(self.review)
            mutate(r)
            with self.subTest(code=code), self.assertRaisesRegex(Invalid, code):
                check_review_characters(self.curriculum, r)

    def _review_pool_batch(self):
        """A synthetic batch with one complete review-character pool."""
        b = copy.deepcopy(self.batch)
        template = next(i for i in b['items'] if i['stage'] == 'exact' and i['id'].startswith('zh-p2-confusable-'))
        refs = [self._row(self.review, '以')['id'], self._row(self.review, '以', 'p2_higher_chinese')['id']]
        new = []
        for n, stage in enumerate(['exact', 'similar', 'generic'], 1):
            item = copy.deepcopy(template)
            item.update(id=f'zh-test-review.q{n}', stage=stage, target_refs=refs)
            item['blanks'] = [dict(item['blanks'][0], question_id=item['id'])] if item['blanks'] else []
            new.append(item)
        b['items'] += new
        b['groups'].append({'id': 'zh-test-review-group', 'version': 1, 'label_zh': '测试', 'label_en': 'test',
                            'courses': ['p2_chinese', 'p2_higher_chinese'], 'target_refs': refs,
                            'item_ids': [i['id'] for i in new]})
        return b

    def test_batch_using_review_targets_must_pin_the_list_version(self):
        b = self._review_pool_batch()
        with self.assertRaisesRegex(Invalid, 'target_reference'):
            check_catalogue(self.curriculum, b)
        with self.assertRaisesRegex(Invalid, 'review_characters_version'):
            check_catalogue(self.curriculum, b, self.review)
        b['review_characters_version'] = self.review['version']
        check_catalogue(self.curriculum, b, dict(self.review, status='approved'))
        b['review_characters_version'] = 'stale'
        with self.assertRaisesRegex(Invalid, 'review_characters_version'):
            check_catalogue(self.curriculum, b, self.review)

    def test_mapped_import_to_a_review_character_needs_an_approved_list(self):
        today = dt.date(2026, 10, 15)
        c = copy.deepcopy(self.curriculum)
        c.update(status='approved', coverage_status='approved')
        row = self._row(self.review, '以')
        p = {'schema_version': 'pilot-mistakes/1', 'subject': 'chinese', 'course': 'p2_chinese',
             'curriculum_manifest_version': c['manifest_version'], 'extraction_result': 'errors_found',
             'items': [{'mapping_status': 'mapped', 'knowledge_point_ref': row['id'], 'target_kind': 'character',
                        'target_value': '以', 'assessed_skill': 'character_recognition', 'error_type': 'unknown_cause',
                        'observation_date': '2026-10-14', 'source_type': 'home_practice'}]}
        with self.assertRaisesRegex(Invalid, 'mapped_ref'):
            check_import(p, c, today, [c['manifest_version']])
        with self.assertRaisesRegex(Invalid, 'review_characters_not_approved'):
            check_import(p, c, today, [c['manifest_version']], self.review)
        approved = dict(self.review, status='approved')
        check_import(p, c, today, [c['manifest_version']], approved)
        p['items'][0]['target_value'] = '东'
        with self.assertRaisesRegex(Invalid, 'mapped_character_value'):
            check_import(p, c, today, [c['manifest_version']], approved)


if __name__ == '__main__':
    unittest.main()
