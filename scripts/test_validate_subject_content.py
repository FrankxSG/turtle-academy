"""Negative tests for the shared subject-content validator (offline, no network).

Run: python3 scripts/test_validate_subject_content.py
"""
import json
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import validate_subject_content as v  # noqa: E402

OK = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>t</title>'
      '<defs><linearGradient id="g"/></defs><rect width="5" height="5" fill="url(#g)"/>{extra}</svg>')


def svg_result(extra='', prefix=''):
    with tempfile.TemporaryDirectory() as d:
        path = pathlib.Path(d) / 'probe.svg'
        path.write_text(prefix + OK.format(extra=extra), encoding='utf-8')
        try:
            v.check_svg(path, 'probe')
            return 'ok'
        except v.Invalid as exc:
            return str(exc).split(':')[0]


class SvgGuard(unittest.TestCase):
    def test_plain_svg_with_local_url_passes(self):
        self.assertEqual(svg_result(), 'ok')

    def test_rejects_external_and_style_references(self):
        cases = {
            'css import in style element': '<style>@import url(//example.invalid/probe.css);</style>',
            'style element without import': '<style>rect{fill:red}</style>',
            'protocol-relative url in style attribute': '<rect style="fill:url(//example.invalid/p.svg#x)"/>',
            'relative file url in fill': '<rect fill="url(other.svg#x)"/>',
            'css import in style attribute': '<rect style="@import \'x.css\'"/>',
            'protocol-relative attribute': '<rect src="//example.invalid/x"/>',
            'https reference': '<rect fill="https://example.invalid/x"/>',
            'href': '<rect href="#g"/>',
            'feImage': '<filter id="f"><feImage/></filter>',
            'event handler': '<rect onload="x()"/>',
            # Review of 280dd4d: character references decode to url() only after XML parsing.
            'encoded url in fill': '<rect width="5" height="5" fill="&#117;rl(//example.invalid/p.svg#g)"/>',
            'encoded url in style': '<rect width="5" height="5" style="fill:&#117;rl(//example.invalid/p.svg#g)"/>',
            'hex-encoded url': '<rect fill="&#x75;&#x72;&#x6c;(other.svg#x)"/>',
            'encoded protocol-relative value': '<rect src="&#47;&#47;example.invalid/x"/>',
            'encoded https': '<rect fill="&#104;ttps://example.invalid/x"/>',
            'css escape in style': '<rect style="fill:\\75 rl(//example.invalid/p.svg#g)"/>',
            'data uri': '<rect fill="data:image/svg+xml,x"/>',
        }
        for name, extra in cases.items():
            with self.subTest(name):
                self.assertNotEqual(svg_result(extra), 'ok')

    def test_encoded_local_url_still_allowed(self):
        # Decoding must not over-block: an encoded same-file reference is still a same-file reference.
        self.assertEqual(svg_result('<rect width="5" height="5" fill="&#117;rl(#g)"/>'), 'ok')

    def test_rejects_xml_stylesheet_instruction(self):
        self.assertEqual(svg_result(prefix='<?xml-stylesheet href="//example.invalid/x.css"?>'), 'asset_css_import')


class RouteGuard(unittest.TestCase):
    def test_cross_family_routes(self):
        self.assertTrue(v.route_compatible('english', 'cloze', 'grammar'))
        self.assertTrue(v.route_compatible('english', 'comprehension', 'comprehension'))
        # Review finding on #15: grammar-cloze blanks were routed to an editing set.
        self.assertFalse(v.route_compatible('english', 'cloze', 'editing'))
        self.assertFalse(v.route_compatible('english', 'comprehension', 'grammar'))
        self.assertFalse(v.route_compatible('mathematics', 'word_problem', 'computation'))
        self.assertTrue(v.route_compatible('science', 'acquisition', 'concept'))

    def test_pinned_reviewed_routes(self):
        # Reviewed routes that must not silently drift back (skipped where the subject is absent).
        pinned = {
            ('english', 'el-p3-cloze-robot.q2'): 'el.p3.object-pronoun',
            ('english', 'el-p3-cloze-robot.q3'): 'el.p3.and-but-or',
        }
        for (subject, qid), target in pinned.items():
            path = v.ROOT / 'content' / subject / 'pool-001.json'
            if not path.exists():
                continue
            items = {i['id']: i for i in json.loads(path.read_text(encoding='utf-8'))['items']}
            with self.subTest(qid):
                self.assertEqual(items[qid].get('repair_target_id'), target)


if __name__ == '__main__':
    unittest.main()
