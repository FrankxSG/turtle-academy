"""Regression checks for leaf-specific coverage and per-route stock."""
import copy
import unittest

from chinese_release_inventory import analyse, load, missing_section, course_section


class Inventory(unittest.TestCase):
    def setUp(self):
        self.curriculum, self.batch = load()

    def row(self, data, leaf):
        return next(r for r in data['p2_chinese']['rows']
                    if r['leaf']['id'] == 'zh.p2_chinese.' + leaf)

    def test_stages_from_another_leaf_cannot_complete_a_route(self):
        item = next(i for i in self.batch['items'] if i['id'] == 'zh-p2-sound-repair.q3')
        item['outcome_refs'] = ['zh.p2_chinese.r-character', 'zh.p2_higher_chinese.r-character']
        data = analyse(self.curriculum, self.batch)
        row = self.row(data, 'r-char-sound')
        self.assertEqual(row['complete'], [])
        self.assertEqual(row['status'], 'partial')

    def test_one_thin_route_does_not_make_every_route_in_its_leaf_thin(self):
        target = 'zh.p2_chinese.char.u5ea7'
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
        # Only the duplicated route gains spare stock; every other route stays thin.
        self.assertIn(f'| p2_chinese | {len(routes)} | {len(routes) - 1} |', report)

    def test_missing_stage_is_reported_with_no_complete_route(self):
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


if __name__ == '__main__':
    unittest.main()
