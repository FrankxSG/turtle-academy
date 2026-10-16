"""Negative tests for the shared subject-content validator (offline, no network).

Run: python3 scripts/test_validate_subject_content.py
"""
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
        }
        for name, extra in cases.items():
            with self.subTest(name):
                self.assertNotEqual(svg_result(extra), 'ok')

    def test_rejects_xml_stylesheet_instruction(self):
        self.assertEqual(svg_result(prefix='<?xml-stylesheet href="//example.invalid/x.css"?>'), 'asset_css_import')


if __name__ == '__main__':
    unittest.main()
