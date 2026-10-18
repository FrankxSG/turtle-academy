"""Regression checks for leaf-specific coverage and per-route stock."""
import copy
import unittest

from chinese_release_inventory import analyse, load, missing_section, course_section


class Inventory(unittest.TestCase):
    def setUp(self):
        self.curriculum, self.batch = load()

    def single_route(self, target):
        """Keep one item per stage for a target, so a test does not depend on today's stock."""
        kept = set()
        for item in list(self.batch['items']):
            if target in item['target_refs']:
                if item['stage'] in kept:
                    self.batch['items'].remove(item)
                kept.add(item['stage'])

    def row(self, data, leaf):
        return next(r for r in data['p2_chinese']['rows']
                    if r['leaf']['id'] == 'zh.p2_chinese.' + leaf)

    def test_stages_from_another_leaf_cannot_complete_a_route(self):
        self.single_route('zh.p2_chinese.skill.char-sound')
        item = next(i for i in self.batch['items'] if i['id'] == 'zh-p2-sound-repair.q3')
        item['outcome_refs'] = ['zh.p2_chinese.r-character', 'zh.p2_higher_chinese.r-character']
        data = analyse(self.curriculum, self.batch)
        row = self.row(data, 'r-char-sound')
        self.assertEqual(row['complete'], [])
        self.assertEqual(row['status'], 'partial')

    def test_one_thin_route_does_not_make_every_route_in_its_leaf_thin(self):
        target = 'zh.p2_chinese.char.u5ea7'
        self.single_route(target)
        before = analyse(self.curriculum, self.batch)
        thin_before = {t for r in before['p2_chinese']['rows'] for t, stock in r['route_stock'].items() if stock <= 1}
        self.assertIn(target, thin_before)
        for item in list(self.batch['items']):
            if target in item['target_refs']:
                duplicate = copy.deepcopy(item)
                duplicate['id'] += '.extra'
                self.batch['items'].append(duplicate)
        data = analyse(self.curriculum, self.batch)
        row = self.row(data, 'r-character')
        self.assertEqual(row['route_stock'][target], 2)
        self.assertEqual(row['stock'], 1)
        routes = {t for r in data['p2_chinese']['rows'] for t in r['complete']}
        report = '\n'.join(missing_section(data))
        # Only the duplicated route gains spare stock; every other thin route stays thin.
        self.assertIn(f'| p2_chinese | {len(routes)} | {len(thin_before) - 1} |', report)

    def test_missing_stage_is_reported_with_no_complete_route(self):
        self.single_route('zh.p2_chinese.skill.char-sound')
        self.batch['items'] = [i for i in self.batch['items'] if i['id'] != 'zh-p2-sound-repair.q3']
        row = self.row(analyse(self.curriculum, self.batch), 'r-char-sound')
        self.assertEqual(row['stock'], 0)
        self.assertEqual(row['complete'], [])
        self.assertEqual(row['status'], 'partial')

    def test_material_quota_is_an_upper_bound_not_a_rotation_prediction(self):
        data = analyse(self.curriculum, self.batch)
        section = '\n'.join(course_section('p2_chinese', data['p2_chinese']))
        self.assertIn('at most 5 complete tasks without material reuse', section)
        self.assertIn('eligibility and rotation not simulated', section)

    def test_approval_note_names_open_gates(self):
        from chinese_release_inventory import approval_note, catalogue
        one = copy.deepcopy(self.batch['batches'][0])
        one['review_log'].update(independent_review='changes_requested', owner_signoff='approved',
                                 rights_status='cleared', disputed_item_ids=[])
        note = approval_note(self.curriculum, catalogue([one]))
        self.assertIn('independent review not passed', note)
        self.assertNotIn('owner sign-off pending', note)
        self.assertNotIn('rights', note)

    def test_each_batch_reports_its_own_gates(self):
        from chinese_release_inventory import approval_note, catalogue
        done, pending = copy.deepcopy(self.batch['batches'][0]), copy.deepcopy(self.batch['batches'][0])
        done['review_log'].update(independent_review='passed', owner_signoff='approved', rights_status='cleared',
                                  disputed_item_ids=[])
        done['batch_id'], pending['batch_id'] = 'zh-test-done', 'zh-test-pending'
        pending['review_log'].update(independent_review='pending', owner_signoff='pending',
                                     rights_status='original_draft_pending_owner_rights_review')
        note = approval_note(self.curriculum, catalogue([done, pending]))
        self.assertIn('zh-test-pending: owner sign-off pending', note)
        self.assertNotIn('zh-test-done', note)

    def test_approved_coverage_counts_only_approved_batches(self):
        from chinese_release_inventory import approved_leaves, catalogue
        curriculum = copy.deepcopy(self.curriculum)
        curriculum['status'] = 'approved'
        batches = copy.deepcopy(self.batch['batches'])
        for b in batches:
            b['status'] = 'approved'
        full = approved_leaves(curriculum, catalogue(batches))['p2_chinese']
        for b in batches:
            b['status'] = 'author_checked_pending_independent_and_owner_review'
        self.assertEqual(approved_leaves(curriculum, catalogue(batches))['p2_chinese'], 0)
        self.assertGreater(full, 0)

    def test_no_approved_coverage_before_the_leaf_list_is_approved(self):
        from chinese_release_inventory import approved_leaves
        curriculum = copy.deepcopy(self.curriculum)
        curriculum['status'] = 'proposed_not_import_enabled'
        self.assertIsNone(approved_leaves(curriculum, self.batch))


    def test_review_and_extra_targets_never_count_as_leaf_routes(self):
        review = self.batch['review']
        ids = {r['id'] for r in review['characters'] + review['extra_characters']}
        data = analyse(self.curriculum, self.batch)
        rows = data['p2_chinese']['rows']
        self.assertFalse(ids & {t for r in rows for t in r['complete']})
        # Derive the expected count from the catalogue: targets with all three stages.
        stages = {}
        for item in self.batch['items']:
            for ref in item['target_refs']:
                stages.setdefault(ref, set()).add(item['stage'])
        complete = {t for t, s in stages.items() if s == {'exact', 'similar', 'generic'}}
        expected = sum(1 for r in review['characters'] if r['course'] == 'p2_chinese' and r['id'] in complete)
        self.assertEqual(data['p2_chinese']['practice_targets']['review'], expected)
        # Without the review file the same pools would be miscounted as leaf routes; the file is what keeps them apart.
        without = analyse(self.curriculum, dict(self.batch, review=None))
        leaked = {t for r in without['p2_chinese']['rows'] for t in r['complete']} & ids
        self.assertTrue(leaked)
        self.assertFalse(without['p2_chinese']['practice_union'])

if __name__ == '__main__':
    unittest.main()
