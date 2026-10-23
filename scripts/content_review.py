"""Validate public catalogues; optionally render disposable offline author review pages.

python3 scripts/content_review.py --check
python3 scripts/content_review.py             # reports/content/index.html
No dependencies, private inputs, runtime code or educational approval.
"""
import argparse
import html
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SUBJECTS = ('chinese', 'english', 'mathematics', 'science')
GENERATOR = '<meta name="generator" content="turtle-academy-content-review">'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def escaped(value):
    return html.escape(str(value), quote=True)


def record_details(record, label='Source record'):
    return ('<details><summary>' + escaped(label) + '</summary><pre>' +
            escaped(json.dumps(record, ensure_ascii=False, indent=2)) + '</pre></details>')


def stimulus(record, field):
    blanks = {b['id']: f'[空{n}]' for n, b in enumerate(record.get('blanks', []), 1)}
    annotations = {a['id']: a for a in record.get('annotations', [])}

    def token(match):
        key = match.group(1)
        if key in blanks:
            return escaped(blanks[key])
        if key in annotations:
            a = annotations[key]
            return '<ruby>' + escaped(a['text']) + '<rt>' + escaped(a['pinyin']) + '</rt></ruby>'
        raise ValueError('unresolved stimulus token: ' + key)

    text = escaped(record[field]).replace('\\n', '\n')
    return re.sub(r'\{\{([^{}]+)\}\}', token, text).replace('\n', '<br>')


def images(record, assets, subject, output):
    result = []
    for aid in record.get('asset_ids', []):
        a = assets[aid]
        path = ROOT / 'content' / subject / a['path']
        src = Path(os.path.relpath(path, output)).as_posix()
        result.append('<img src="' + escaped(src) + '" alt="' + escaped(a['alt']) + '">')
    return ''.join(result)


def item_html(item, assets, subject, output):
    options = ''.join('<li>' + escaped(o['text']) + '</li>' for o in item['options'])
    answer = next(o['text'] for o in item['options'] if o['id'] == item['correct_option_id'])
    language = 'zh-Hans' if subject == 'chinese' else 'en'
    return ('<article lang="' + language + '" data-item-id="' + escaped(item['id']) + '"><h3>' + escaped(item['id']) +
            ' · v' + str(item['version']) + '</h3><p>' + stimulus(item, 'stem') + '</p>' +
            images(item, assets, subject, output) + '<ol>' + options + '</ol>' +
            '<details><summary>Key, hint and explanation (review only)</summary><p>Key: ' +
            escaped(answer) + '</p><p>Hint: ' + escaped(item['hint']) + '</p><p>' +
            escaped(item['explanation']) + '</p></details>' + record_details(item) + '</article>')


def page(title, body):
    return ('<!doctype html><html lang="en"><meta charset="utf-8">' + GENERATOR +
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            '<title>' + escaped(title) + '</title><style>'
            'body{font:18px/1.6 system-ui;max-width:960px;margin:24px auto;padding:0 20px}'
            'article,section{border-top:1px solid #bbb;margin-top:24px;padding-top:12px}'
            'img{display:block;max-width:100%;max-height:500px}pre{white-space:pre-wrap;overflow-wrap:anywhere}'
            'summary{cursor:pointer}rt{font-size:.7em}</style><body><h1>' + escaped(title) +
            '</h1><p>Author review aid; not the application or proof of educational approval.</p>' +
            body + '</body></html>\n')


def render_pool(subject, pool, curriculum, output):
    assets = {a['id']: a for a in pool.get('assets', [])}
    items = {i['id']: i for i in pool['items']}
    metadata = {k: v for k, v in pool.items() if k not in ('items', 'materials')}
    body = '<p>Status: ' + escaped(pool['status']) + '</p>'
    body += record_details(metadata, 'Batch version, mappings and review/rights record')
    body += record_details(curriculum, 'Curriculum, sources, leaves and limitations')
    if subject != 'chinese':
        body += '<h2>Topic inventory (this batch; not approved coverage)</h2><table><tr><th>Topic</th><th>Scope / Pilot</th><th>Leaves</th><th>Repair sets</th><th>Questions</th></tr>'
        for topic in curriculum['topics']:
            group = [i for i in pool['items'] if i['topic_ref'] == topic['id']]
            leaves = sum(l['topic_ref'] == topic['id'] for l in curriculum.get('leaves', []))
            targets = {i['target_id'] for i in group if i['target_id'] is not None}
            body += ('<tr><td>' + escaped(topic['label'] + ' (' + topic['id'] + ')') + '</td><td>' +
                     escaped(topic['scope'] + ' / ' + topic['pilot']) + '</td><td>' + str(leaves) +
                     '</td><td>' + str(len(targets)) + '</td><td>' + str(len(group)) + '</td></tr>')
        body += '</table>'
    shown = set()
    for material in pool['materials']:
        language = 'zh-Hans' if subject == 'chinese' else 'en'
        body += ('<section lang="' + language + '" data-material-id="' + escaped(material['id']) + '"><h2>' +
                 escaped(material['title']) + ' · ' + escaped(material['id']) +
                 '</h2><p>' + stimulus(material, 'body') + '</p>' +
                 images(material, assets, subject, output) + record_details(material))
        for qid in material['question_ids']:
            if qid in shown:
                raise ValueError('item shown twice: ' + qid)
            body += item_html(items[qid], assets, subject, output)
            shown.add(qid)
        body += '</section>'
    body += '<h2>Standalone repair and general practice</h2>'
    for item in pool['items']:
        if item['id'] not in shown:
            body += item_html(item, assets, subject, output)
            shown.add(item['id'])
    if len(shown) != len(pool['items']):
        raise ValueError('incomplete item view')
    return page(subject.title() + ' · ' + pool['batch_id'] + ' · v' + str(pool['version']), body)


def validate():
    for script in ('validate_chinese_content.py', 'validate_subject_content.py'):
        subprocess.run([sys.executable, str(ROOT / 'scripts' / script)], check=True, cwd=ROOT)
    subprocess.run([sys.executable, str(ROOT / 'scripts/chinese_release_inventory.py'), '--check'],
                   check=True, cwd=ROOT)


def render(output):
    output.mkdir(parents=True, exist_ok=True)
    rows = []
    generated = {'index.html'}
    for subject in SUBJECTS:
        base = ROOT / 'content' / subject
        curriculum = read(base / 'curriculum.json')
        paths = sorted((base / 'batches').glob('*.json')) if subject == 'chinese' else sorted(base.glob('pool-*.json'))
        for path in paths:
            pool = read(path)
            filename = subject + '-' + path.stem + '.html'
            generated.add(filename)
            (output / filename).write_text(render_pool(subject, pool, curriculum, output), encoding='utf-8')
            rows.append('<li><a href="' + filename + '">' + escaped(subject + ': ' + pool['batch_id']) +
                        '</a> · v' + str(pool['version']) + ' · ' + escaped(pool['status']) +
                        ' · ' + str(len(pool['items'])) + ' questions</li>')
    inventory = Path(os.path.relpath(ROOT / 'docs/content-review/CHINESE_RELEASE_INVENTORY.md', output)).as_posix()
    body = '<p>Generated from current public JSON. Edit the JSON, not these disposable files.</p><ul>' + ''.join(rows) + '</ul>'
    body += '<p><a href="' + escaped(inventory) + '">Chinese approved-coverage inventory</a>. '
    body += 'Use each batch\'s current review/rights record; authored mappings are not release coverage.</p>'
    (output / 'index.html').write_text(page('Content review', body), encoding='utf-8')
    for path in output.glob('*.html'):
        if path.name not in generated and GENERATOR in path.read_text(encoding='utf-8'):
            path.unlink()  # Only this tool's obsolete pages, never unrelated author files.
    print('Wrote ' + str(output / 'index.html'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='validate only; do not write reports')
    parser.add_argument('--output', type=Path, default=ROOT / 'reports/content')
    args = parser.parse_args()
    validate()
    if not args.check:
        render(args.output.resolve())


if __name__ == '__main__':
    main()
