"""Author-review preservation checks; these do not establish educational correctness."""
from html.parser import HTMLParser
import html
import json
import os
from pathlib import Path
import tempfile
import unittest

import content_review as report


class Parsed(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.items, self.images, self.materials = [], [], []
        self.contexts, self.current_material = {}, None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'data-item-id' in a:
            self.items.append(a['data-item-id'])
            self.contexts[a['data-item-id']] = self.current_material
        if 'data-material-id' in a:
            self.materials.append(a['data-material-id'])
            self.current_material = a['data-material-id']
        if tag == 'img':
            self.images.append(a['src'])

    def handle_endtag(self, tag):
        if tag == 'section':
            self.current_material = None


class Preservation(unittest.TestCase):
    def test_every_current_record_and_asset_survives_the_review_view(self):
        output = report.ROOT / 'reports/content'
        for subject in report.SUBJECTS:
            base = report.ROOT / 'content' / subject
            cur = report.read(base / 'curriculum.json')
            paths = sorted((base / 'batches').glob('*.json')) if subject == 'chinese' else sorted(base.glob('pool-*.json'))
            for path in paths:
                with self.subTest(subject=subject, pool=path.name):
                    pool = report.read(path)
                    text = report.render_pool(subject, pool, cur, output)
                    parsed = Parsed(text)
                    self.assertCountEqual(parsed.items, [i['id'] for i in pool['items']])
                    self.assertCountEqual(parsed.materials, [m['id'] for m in pool['materials']])
                    self.assertEqual(parsed.contexts, {i['id']: i['material_id'] for i in pool['items']})
                    assets = {a['id']: a for a in pool.get('assets', [])}
                    expected_images = [Path(os.path.relpath(base / assets[aid]['path'], output)).as_posix()
                                       for row in pool['items'] + pool['materials']
                                       for aid in row.get('asset_ids', [])]
                    self.assertCountEqual(parsed.images, expected_images)
                    for record in pool['items'] + pool['materials']:
                        # The whole versioned source record, including rationale, routes, blanks and
                        # annotations, must remain inspectable; a stem/key-only view loses knowledge.
                        source = html.escape(json.dumps(record, ensure_ascii=False, indent=2), quote=True)
                        self.assertIn(source, text)
                    self.assertEqual(len(parsed.items), len(set(parsed.items)))
                    for image in parsed.images:
                        self.assertTrue((output / image).resolve().is_file(), image)

    def test_tokens_are_rendered_and_untrusted_text_is_inert(self):
        row = {'stem': '<script>x</script>一{{blank-1}}山，{{pinyin-1}}',
               'blanks': [{'id': 'blank-1'}],
               'annotations': [{'id': 'pinyin-1', 'text': '沿', 'pinyin': 'yán'}]}
        text = report.stimulus(row, 'stem')
        self.assertIn('[空1]', text)
        self.assertIn('<ruby>沿<rt>yán</rt></ruby>', text)
        self.assertIn('&lt;script&gt;', text)
        self.assertNotIn('<script>', text)
        with self.assertRaises(ValueError):
            report.stimulus(dict(row, stem='{{missing}}'), 'stem')

    def test_render_does_not_modify_source_or_approval_records(self):
        paths = list((report.ROOT / 'content').rglob('*.json'))
        before = {p: p.read_bytes() for p in paths}
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            report.render(output)
            first = {p.name: p.read_bytes() for p in output.iterdir()}
            report.render(output)
            self.assertEqual(first, {p.name: p.read_bytes() for p in output.iterdir()})
            count = len(list((report.ROOT / 'content/chinese/batches').glob('*.json')))
            count += sum(len(list((report.ROOT / 'content' / s).glob('pool-*.json')))
                         for s in report.SUBJECTS if s != 'chinese')
            self.assertEqual(len(first), count + 1)
        self.assertEqual(before, {p: p.read_bytes() for p in paths})

    def test_obsolete_generated_pages_are_removed_but_author_files_survive(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            obsolete = output / 'retired-batch.html'
            obsolete.write_text(report.page('Old report', ''), encoding='utf-8')
            note = output / 'author-notes.html'
            note.write_text('<p>Keep my notes.</p>', encoding='utf-8')
            report.render(output)
            self.assertFalse(obsolete.exists())
            self.assertEqual(note.read_text(), '<p>Keep my notes.</p>')


if __name__ == '__main__':
    unittest.main()
