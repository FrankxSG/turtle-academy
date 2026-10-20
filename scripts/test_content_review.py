"""Author-review preservation checks; these do not establish educational correctness."""
from html.parser import HTMLParser
import html
import json
from pathlib import Path
import tempfile
import unittest

import content_review as report


class Parsed(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.items, self.images, self.materials = [], [], []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'data-item-id' in a:
            self.items.append(a['data-item-id'])
        if 'data-material-id' in a:
            self.materials.append(a['data-material-id'])
        if tag == 'img':
            self.images.append(a['src'])


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


if __name__ == '__main__':
    unittest.main()
