"""Live-sync database contract (first milestone; synthetic data only).

Applies every migration to a throwaway PostgreSQL cluster and exercises the sync tables and functions as the real
client roles. Then runs the client's own sync code (Node) against those functions through a local HTTP stand-in
for the Supabase endpoints (sync_server.py), so client and server are tested together.

Run: python3 supabase/tests/test_sync.py   (PostgreSQL 14+ server binaries, psql and Node 22)
"""
import copy
import json
import os
import pathlib
import subprocess
import sys
import time
import unittest
import uuid

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from test_database import ALL_MIGRATIONS, FIXTURES, HERE, ROOT, Cluster, DbError, as_role, lit  # noqa: E402
from sync_server import SyncServer  # noqa: E402

WRONG_FORM = '错形哨兵'
NOTE = 'AUTHORING-NOTE-SENTINEL'
SYNC_TABLES = ['sync_heads', 'sync_devices', 'sync_receipts', 'sync_records', 'sync_changes', 'sync_field_history']


def stamp(device, t=None, c=0):
    return {'t': int(t if t is not None else time.time() * 1000), 'c': c, 'd': device}


def op(changes, device=None, seq=1, t=None, c=0):
    device = device or str(uuid.uuid4())
    return {'op_id': str(uuid.uuid4()), 'device_id': device, 'device_seq': seq, 'stamp': stamp(device, t, c),
            'changes': [{'kind': k, 'key': key, 'value': v} if v is not None else {'kind': k, 'key': key, 'deleted': True}
                        for k, key, v in changes]}


def snapshot_changes(s):
    """Every record of the synthetic snapshot fixture as sync changes (mirrors src/sync/changes.ts)."""
    out = []
    for t in s['tasks']:
        v = copy.deepcopy(t)
        v['target_aggregates'] = []
        out.append(('task', t['id'], v))
    out += [('presentation', p['id'], p) for p in s['presentations']]
    out += [('answer_event', e['id'], e) for e in s['events']]
    out += [('completion', f"{c['subject']}:{c['task_id'] or c['local_date']}", c) for c in s['completions']]
    out += [('checkpoint', c['id'], c) for c in s['story']['checkpoints']]
    st = s['story']
    out.append(('story_state', 'story', {k: st[k] for k in ('next_story_seq', 'chapter', 'world_flags', 'ended')}))
    out += [('target', t['id'], t) for t in s['targets']]
    out += [('amendment', a['id'], a) for a in s['amendments']]
    out += [('flag', f"{f['item_id']}@{f['item_version']}:{f['presentation_id'] or f['flagged_at']}", f) for f in s['flags']]
    out += [('suspension', f"{x['item_id']}@{x['item_version'] if x['item_version'] is not None else '*'}", x) for x in s['suspensions']]
    out += [('exposure', e['item_id'], e) for e in s['exposure']]
    out += [('rest_day', d, {'date': d}) for d in s['rest_days']]
    se = s['settings']
    out.append(('setting', 'timezone', {'timezone': se['timezone']}))
    out.append(('setting', 'ui_language', {'ui_language': se['ui_language']}))
    out += [('setting', f"x:{x['subject']}", {'x': x['x'], 'changed_at': x['changed_at']}) for x in se['subjects']]
    out += [('timezone_change', h['changed_at'], h) for h in se['timezone_history']]
    out.append(('guards', 'guards', s['calendar_guards']))
    out += [('content_version', c['subject'], c) for c in s['content_versions']]
    return out


def node_json(script):
    """Run a small Node snippet that prints JSON (uses the real client modules)."""
    p = subprocess.run(['node', '--experimental-strip-types', '--input-type=module', '-e', script], cwd=ROOT,
                       capture_output=True, text=True, timeout=120)
    if p.returncode != 0:
        raise RuntimeError(p.stderr[-3000:])
    return json.loads(p.stdout)


class SyncContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = SyncServer().start()
        cls.db = cls.server.db
        # Fresh children are provisioned for parent-c, so parent-a keeps exactly one child for the client scenarios.
        cls.parent_a = cls.server.users['parent-c@example.invalid']
        cls.client_parent = cls.server.users['parent-a@example.invalid']
        cls.parent_b = cls.server.users['parent-b@example.invalid']
        cls.stranger = cls.server.users['stranger@example.invalid']
        cls.child_a = cls.server.children['parent-a@example.invalid']
        cls.child_b = cls.server.children['parent-b@example.invalid']
        cls.snapshot = json.loads((FIXTURES / 'snapshot-valid.json').read_text(encoding='utf-8'))
        # A stripped synthetic pack and its version reference, made by the client's own code.
        cls.pack = node_json(
            "import { syntheticPack } from './tests/engine/fixtures/private-pack.ts';"
            "import { stripPack, versionRef } from './src/sync/pack.ts';"
            "const p = stripPack(syntheticPack({ pendingRef: 'zh.p2_higher_chinese.char.u4e00' }));"
            "console.log(JSON.stringify({ pack: p, ref: await versionRef(p) }))")

    @classmethod
    def tearDownClass(cls):
        cls.server.stop()

    # helpers -----------------------------------------------------------------------------------
    def push(self, sub, child, ops, role='authenticated'):
        rows = self.db.run(as_role(f"select public.sync_push('{child}'::uuid, {lit(ops)}::jsonb)::text;", role, sub))
        return json.loads(rows[0][0])

    def pull(self, sub, child, cursor=0, limit=500):
        rows = self.db.run(as_role(f"select public.sync_pull('{child}'::uuid, {int(cursor)}, {int(limit)})::text;", sub=sub))
        return json.loads(rows[0][0])

    def pull_all(self, sub, child, cursor=0, limit=500):
        out = []
        while True:
            page = self.pull(sub, child, cursor, limit)
            out += page['changes']
            cursor = page['cursor']
            if not page['more']:
                return out, cursor

    def fresh_child(self, parent=None):
        return self.db.run(f"select private.provision_family('{parent or self.parent_a}', 'Synthetic');")[0][0]

    def records(self, child, kind=None):
        q = f"select kind, key, value::text, deleted, stamps::text from public.sync_records where child_id = '{child}'"
        if kind:
            q += f" and kind = '{kind}'"
        return [{'kind': r[0], 'key': r[1], 'value': json.loads(r[2]) if r[2] else None, 'deleted': r[3] == 't', 'stamps': json.loads(r[4])}
                for r in self.db.run(q + ' order by change_seq;')]

    def record(self, child, kind, key):
        found = [r for r in self.records(child, kind) if r['key'] == key]
        return found[0] if found else None

    def count(self, table, child):
        return int(self.db.run(f"select count(*) from public.{table} where child_id = '{child}';")[0][0])

    def assertDbError(self, code, fn, *args):
        with self.assertRaises(DbError) as ctx:
            fn(*args)
        self.assertEqual(ctx.exception.code, code, ctx.exception.stderr)
        return ctx.exception

    def seeded(self):
        """A fresh child with the full synthetic snapshot uploaded in one operation."""
        child = self.fresh_child()
        r = self.push(self.parent_a, child, [op(snapshot_changes(self.snapshot))])
        self.assertEqual(r['results'][0]['status'], 'applied', r)
        return child

    # schema and access -------------------------------------------------------------------------
    def test_server_descriptor_matches_client(self):
        server = json.loads(self.db.run('select private.sync_schema()::text;')[0][0])
        client = json.loads((ROOT / 'src' / 'sync' / 'schema.json').read_text(encoding='utf-8'))
        pack = json.loads((ROOT / 'src' / 'sync' / 'pack-schema.json').read_text(encoding='utf-8'))
        client['defs'].update(pack['defs'])
        client['kinds'].update(pack['kinds'])
        self.assertEqual(server, client)
        # The public bundle's part names no private-pack structure.
        self.assertNotIn('turtle-private-pack/1', (ROOT / 'src' / 'sync' / 'schema.json').read_text(encoding='utf-8'))

    def test_rls_on_every_sync_table_and_family_isolation(self):
        rows = dict(self.db.run("select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';"))
        for t in SYNC_TABLES:
            self.assertEqual(rows[t], 't', t)
        child = self.seeded()
        for t in SYNC_TABLES:
            mine = int(self.db.run(as_role(f"select count(*) from public.{t} where child_id = '{child}';", sub=self.parent_a))[0][0])
            if t != 'sync_field_history':
                self.assertGreater(mine, 0, t)
            for who in (self.parent_b, self.stranger):
                self.assertEqual(self.db.run(as_role(f"select count(*) from public.{t} where child_id = '{child}';", sub=who))[0][0], '0')
            self.assertDbError('42501', self.db.run, as_role(f'select count(*) from public.{t};', 'anon'))

    def test_direct_table_writes_are_refused_for_every_client_role(self):
        child = self.seeded()
        attempts = [
            f"insert into public.sync_records (child_id, kind, key, value, change_seq) values ('{child}', 'setting', 'timezone', '{{}}', 999);",
            f"update public.sync_records set value = '{{}}' where child_id = '{child}';",
            f"delete from public.sync_records where child_id = '{child}';",
            f"update public.sync_heads set change_seq = 0 where child_id = '{child}';",
            f"insert into public.sync_receipts (child_id, op_id, device_id, device_seq, request_sha256, accepted_stamp, created_by) "
            f"values ('{child}', gen_random_uuid(), gen_random_uuid(), 1, repeat('a', 64), '{{}}', '{self.parent_a}');",
            f"delete from public.sync_field_history where child_id = '{child}';",
            f"delete from public.sync_changes where child_id = '{child}';",
            f"select private.sync_apply_change('{child}', '{{}}'::jsonb, '{{}}'::jsonb, gen_random_uuid());",
        ]
        before = self.count('sync_records', child)
        for role, sub in (('authenticated', self.parent_a), ('anon', None), ('service_role', None)):
            for sql in attempts:
                with self.subTest(role=role, sql=sql[:50]):
                    self.assertDbError('42501', self.db.run, as_role(sql, role, sub))
        self.assertEqual(self.count('sync_records', child), before)

    def test_client_snapshot_upload_is_retired(self):
        payload = copy.deepcopy(self.snapshot)
        payload['child_ref'] = self.child_a
        sql = f"select public.upload_snapshot('{self.child_a}'::uuid, gen_random_uuid(), null, {lit(payload)}::jsonb);"
        for role, sub in (('authenticated', self.client_parent), ('anon', None)):
            self.assertDbError('42501', self.db.run, as_role(sql, role, sub))
        # The function, its tables and existing evidence remain.
        self.assertEqual(self.db.run("select count(*) from pg_proc where proname = 'upload_snapshot';")[0][0], '1')

    def test_anonymous_other_family_and_spoofed_child_are_refused(self):
        child = self.fresh_child()
        o = op([('setting', 'timezone', {'timezone': 'Asia/Singapore'})])
        self.assertDbError('42501', self.push, None, child, [o], 'anon')
        self.assertDbError('42501', self.push, self.stranger, child, [o])
        self.assertDbError('42501', self.push, self.parent_b, child, [o])
        self.assertDbError('42501', self.push, self.parent_a, str(uuid.uuid4()), [o])
        self.assertDbError('42501', self.pull, self.parent_b, child)
        self.assertDbError('42501', self.pull, self.stranger, child)
        self.assertDbError('42501', self.db.run, as_role(f"select public.sync_pull('{child}'::uuid, 0, 10);", 'anon'))
        self.assertDbError('42501', self.db.run, as_role('select public.sync_whoami();', 'anon'))
        self.assertEqual(self.count('sync_records', child), 0)
        mine = json.loads(self.db.run(as_role('select public.sync_whoami()::text;', sub=self.parent_b))[0][0])
        self.assertEqual([m['child_id'] for m in mine], [self.child_b])
        self.assertEqual(json.loads(self.db.run(as_role('select public.sync_whoami()::text;', sub=self.stranger))[0][0]), [])

    # validation at the write boundary --------------------------------------------------------------
    def test_malformed_and_excluded_payloads_are_refused_without_echo_or_side_effects(self):
        child = self.fresh_child()
        pack = copy.deepcopy(self.pack['pack'])
        ref = self.pack['ref']
        base_task = copy.deepcopy(self.snapshot['tasks'][0])
        base_task['target_aggregates'] = []
        bad = {
            'unknown_kind': [('snapshot', 'x', {'a': 1})],
            'unknown_field': [('setting', 'timezone', {'timezone': 'Asia/Singapore', 'note': WRONG_FORM})],
            'wrong_form_in_pack': [('pack_version', ref, {'version_ref': ref, 'pack': {**pack, 'register': {**pack['register'], 'cases': [{**pack['register']['cases'][0], 'observed': WRONG_FORM}] + pack['register']['cases'][1:]}}})],
            'rationale_in_pack': [('pack_version', ref, {'version_ref': ref, 'pack': {**pack, 'corrective_batches': [{**pack['corrective_batches'][0], 'items': [{**pack['corrective_batches'][0]['items'][0], 'rationale': NOTE}]}]}})],
            'provenance_on_material': [('pack_version', ref, {'version_ref': ref, 'pack': {**pack, 'corrective_batches': [{**pack['corrective_batches'][0], 'materials': [{'id': 'm1', 'version': 1, 'courses': ['p2_higher_chinese'], 'kind': 'passage', 'title': 't', 'body': 'b', 'question_ids': [], 'blanks': [], 'annotations': [], 'provenance': NOTE}]}]}})],
            'long_cause': [('pack_version', ref, {'version_ref': ref, 'pack': {**pack, 'register': {**pack['register'], 'cases': [{**pack['register']['cases'][0], 'cause': NOTE * 3}] + pack['register']['cases'][1:]}}})],
            'dated_policy': [('pack_version', ref, {'version_ref': ref, 'pack': {**pack, 'register': {**pack['register'], 'policy': 'seen 2026-05-04'}}})],
            'stem_over_bound': [('pack_version', ref, {'version_ref': ref, 'pack': {**pack, 'corrective_batches': [{**pack['corrective_batches'][0], 'items': [{**pack['corrective_batches'][0]['items'][0], 'stem': '题' * 601}]}]}})],
            'pin_hash': [('setting', 'pin_hash', {'timezone': 'Asia/Singapore'})],
            'derived_aggregates': [('task', base_task['id'], {**base_task, 'target_aggregates': self.snapshot['tasks'][0]['target_aggregates']})],
            'spoofed_key': [('answer_event', 'e-other', self.snapshot['events'][0])],
            'wrong_form_on_event': [('answer_event', 'e-0000', {**self.snapshot['events'][0], 'observed_wrong_form': WRONG_FORM})],
            'school_detail': [('target', 't-x', {**self.snapshot['targets'][0], 'id': 't-x', 'school': NOTE})],
            'deleted_add_only': [('answer_event', 'e-0000', None)],
            'x_out_of_range': [('setting', 'x:english', {'x': 21, 'changed_at': None})],
        }
        for name, changes in bad.items():
            with self.subTest(case=name):
                r = self.push(self.parent_a, child, [op(changes)])
                self.assertEqual(r['results'][0]['status'], 'rejected', name)
                self.assertIn(r['results'][0]['code'], ('invalid_change', 'invalid_operation'))
                self.assertNotIn(WRONG_FORM, json.dumps(r, ensure_ascii=False))
                self.assertNotIn(NOTE, json.dumps(r))
        # Envelope problems.
        o = op([('setting', 'timezone', {'timezone': 'Asia/Singapore'})])
        for broken in ({**o, 'op_id': 'nope'}, {**o, 'stamp': {**o['stamp'], 'd': str(uuid.uuid4())}}, {**o, 'changes': []}, {**o, 'extra': 1}, 'text'):
            r = self.push(self.parent_a, child, [broken])
            self.assertEqual(r['results'][0]['status'], 'rejected')
        self.assertDbError('PT400', self.push, self.parent_a, child, {'not': 'a list'})
        self.assertDbError('PT400', self.push, self.parent_a, child, [])
        self.assertDbError('PT400', self.push, self.parent_a, child, [o] * 51)
        self.assertEqual(self.count('sync_records', child), 0)
        self.assertEqual(self.count('sync_receipts', child), 0)
        stored = self.db.run('select coalesce(string_agg(value::text, \'\'), \'\') from public.sync_records;')[0][0]
        self.assertNotIn(WRONG_FORM, stored)
        self.assertNotIn(NOTE, stored)

    def test_size_limits(self):
        child = self.fresh_child()
        pack = copy.deepcopy(self.pack['pack'])
        pack['corrective_batches'][0]['materials'] = [
            {'id': f'm{n}', 'version': 1, 'courses': ['p2_higher_chinese'], 'kind': 'passage', 'title': 't', 'body': 'a' * 4000,
             'question_ids': [], 'blanks': [], 'annotations': []} for n in range(420)]
        ref = self.pack['ref']
        big = op([('pack_version', ref, {'version_ref': ref, 'pack': pack})])
        r = self.push(self.parent_a, child, [big])
        self.assertEqual(r['results'][0], {'op_id': big['op_id'], 'status': 'rejected', 'code': 'operation_too_large'})
        many = [big, {**big, 'op_id': str(uuid.uuid4()), 'device_seq': 2}]  # over the 2 MiB request limit
        self.assertDbError('PT413', self.push, self.parent_a, child, many)
        self.assertEqual(self.count('sync_records', child), 0)

    # receipts, retries and ordering -------------------------------------------------------------
    def test_identical_retry_is_acknowledged_once_and_reused_id_with_other_content_is_refused(self):
        child = self.fresh_child()
        o = op(snapshot_changes(self.snapshot))
        first = self.push(self.parent_a, child, [o])['results'][0]
        self.assertEqual(first['status'], 'applied')
        changes = self.count('sync_changes', child)
        records = self.records(child)
        again = self.push(self.parent_a, child, [o])['results'][0]
        self.assertEqual(again, {'op_id': o['op_id'], 'status': 'duplicate', 'stamp': first['stamp']})
        self.assertEqual(self.count('sync_changes', child), changes, 'a retry is not applied again')
        self.assertEqual(self.records(child), records)
        other = copy.deepcopy(o)
        other['changes'][0]['value']['cursor'] = 0
        r = self.push(self.parent_a, child, [other])['results'][0]
        self.assertEqual((r['status'], r['code']), ('rejected', 'operation_conflict'))
        self.assertEqual(self.count('sync_receipts', child), 1)

    def test_per_device_ordering_and_batch_stops_at_first_refusal(self):
        child = self.fresh_child()
        device = str(uuid.uuid4())
        o1 = op([('setting', 'timezone', {'timezone': 'Asia/Singapore'})], device, 5)
        o2 = op([('setting', 'ui_language', {'ui_language': 'zh'})], device, 3)  # older than o1
        o3 = op([('setting', 'ui_language', {'ui_language': 'en'})], device, 6)
        r = self.push(self.parent_a, child, [o1, o2, o3])['results']
        self.assertEqual([x['status'] for x in r], ['applied', 'rejected'])
        self.assertEqual(r[1]['code'], 'out_of_order')
        self.assertIsNone(self.record(child, 'setting', 'ui_language'))
        self.assertEqual(self.push(self.parent_a, child, [o3])['results'][0]['status'], 'applied')

    def test_references_must_resolve_and_a_refused_operation_leaves_nothing_behind(self):
        child = self.fresh_child()
        before = self.db.run(f"select coalesce((select change_seq from public.sync_heads where child_id = '{child}'), 0);")[0][0]
        orphan = op([('setting', 'timezone', {'timezone': 'Asia/Singapore'}), ('answer_event', 'e-0000', self.snapshot['events'][0])])
        r = self.push(self.parent_a, child, [orphan])['results'][0]
        self.assertEqual((r['status'], r['code']), ('rejected', 'invalid_reference'))
        self.assertEqual(self.count('sync_records', child), 0, 'the whole operation was rolled back')
        self.assertEqual(self.count('sync_changes', child), 0)
        self.assertEqual(self.db.run(f"select change_seq from public.sync_heads where child_id = '{child}';")[0][0], before)
        pack_ref = self.pack['ref']
        r = self.push(self.parent_a, child, [op([('active_pack', 'active', {'version_ref': pack_ref})])])['results'][0]
        self.assertEqual(r['code'], 'invalid_reference')

    # merge rules -----------------------------------------------------------------------------
    def test_add_only_records_are_never_overwritten(self):
        child = self.seeded()
        event = copy.deepcopy(self.snapshot['events'][0])
        event['correct'] = not event['correct']
        self.assertEqual(self.push(self.parent_a, child, [op([('answer_event', event['id'], event)])])['results'][0]['status'], 'applied')
        self.assertEqual(self.record(child, 'answer_event', event['id'])['value'], self.snapshot['events'][0])
        comp = copy.deepcopy(self.snapshot['completions'][0])
        comp['answered'] = 99 if comp['answered'] != 99 else 98
        self.push(self.parent_a, child, [op([('completion', f"{comp['subject']}:{comp['task_id']}", comp)])])
        self.assertEqual(self.record(child, 'completion', f"{comp['subject']}:{comp['task_id']}")['value'], self.snapshot['completions'][0])

    def test_task_plan_first_wins_and_progress_only_moves_forward(self):
        child = self.seeded()
        t = copy.deepcopy(self.snapshot['tasks'][0])
        t['target_aggregates'] = []
        changed = copy.deepcopy(t)
        changed['x'] = 7
        changed['plan']['slots'] = changed['plan']['slots'][:1]
        changed['cursor'] = 0
        changed['status'] = 'finalised'
        changed['finalised_at'] = '2026-10-14T09:00:00+08:00'
        changed['activity'] = t['activity'] + [{'state': 'closed', 'at': '2026-10-14T09:00:00+08:00'}]
        self.push(self.parent_a, child, [op([('task', t['id'], changed)])])
        stored = self.record(child, 'task', t['id'])['value']
        self.assertEqual(stored['plan'], t['plan'])
        self.assertEqual(stored['x'], t['x'])
        self.assertEqual(stored['cursor'], t['cursor'])
        self.assertEqual(stored['status'], 'finalised')
        self.assertEqual(stored['finalised_at'], '2026-10-14T09:00:00+08:00')
        self.assertIn({'state': 'closed', 'at': '2026-10-14T09:00:00+08:00'}, stored['activity'])
        back = copy.deepcopy(changed)
        back['status'] = 'paused'
        back['finalised_at'] = None
        self.push(self.parent_a, child, [op([('task', t['id'], back)])])
        self.assertEqual(self.record(child, 'task', t['id'])['value']['status'], 'finalised')

    def test_presentation_status_checkpoint_delivery_and_growth_never_revert(self):
        child = self.seeded()
        p = next(x for x in self.snapshot['presentations'] if x['status'] == 'answered')
        self.push(self.parent_a, child, [op([('presentation', p['id'], {**p, 'status': 'presented'})])])
        self.assertEqual(self.record(child, 'presentation', p['id'])['value']['status'], 'answered')
        self.push(self.parent_a, child, [op([('presentation', p['id'], {**p, 'status': 'corrected'})])])
        self.assertEqual(self.record(child, 'presentation', p['id'])['value']['status'], 'corrected')
        cp = next(c for c in self.snapshot['story']['checkpoints'] if c['state'] == 'delivered')
        self.push(self.parent_a, child, [op([('checkpoint', cp['id'], {**cp, 'state': 'pending', 'delivered_at': None})])])
        self.assertEqual(self.record(child, 'checkpoint', cp['id'])['value']['state'], 'delivered')
        st = self.record(child, 'story_state', 'story')['value']
        self.push(self.parent_a, child, [op([('story_state', 'story', {'next_story_seq': 0, 'chapter': 0, 'world_flags': [], 'ended': False})])])
        self.assertEqual(self.record(child, 'story_state', 'story')['value'], st)
        g = self.snapshot['calendar_guards']
        self.push(self.parent_a, child, [op([('guards', 'guards', {k: None for k in g})])])
        self.assertEqual(self.record(child, 'guards', 'guards')['value'], g)

    def test_editable_fields_follow_accepted_stamps_and_keep_replaced_values(self):
        child = self.fresh_child()
        d1, d2 = str(uuid.uuid4()), str(uuid.uuid4())
        now = int(time.time() * 1000)
        self.push(self.parent_a, child, [op([('setting', 'x:chinese', {'x': 8, 'changed_at': None})], d1, 1, now)])
        self.push(self.parent_a, child, [op([('setting', 'x:chinese', {'x': 12, 'changed_at': None})], d1, 2, now + 10)])
        self.assertEqual(self.record(child, 'setting', 'x:chinese')['value']['x'], 12)
        # An older stamp arriving later loses, and its value is kept in history.
        self.push(self.parent_a, child, [op([('setting', 'x:chinese', {'x': 6, 'changed_at': None})], d2, 1, now - 1000)])
        self.assertEqual(self.record(child, 'setting', 'x:chinese')['value']['x'], 12)
        hist = self.db.run(f"select replaced_value::text from public.sync_field_history where child_id = '{child}' and key = 'x:chinese' order by id;")
        self.assertEqual([json.loads(h[0])['x'] for h in hist], [8, 6])
        # Equal time and counter: the device id decides, deterministically.
        a, b = sorted([str(uuid.uuid4()), str(uuid.uuid4())])
        self.push(self.parent_a, child, [op([('setting', 'ui_language', {'ui_language': 'zh'})], b, 1, now + 20)])
        self.push(self.parent_a, child, [op([('setting', 'ui_language', {'ui_language': 'en'})], a, 1, now + 20)])
        self.assertEqual(self.record(child, 'setting', 'ui_language')['value'], {'ui_language': 'zh'})
        # Tombstones: a deletion with a newer stamp wins and is returned to devices.
        self.push(self.parent_a, child, [op([('rest_day', '2026-10-20', {'date': '2026-10-20'})], d1, 3, now + 30)])
        self.push(self.parent_a, child, [op([('rest_day', '2026-10-20', None)], d1, 4, now + 40)])
        rec = self.record(child, 'rest_day', '2026-10-20')
        self.assertEqual((rec['deleted'], rec['value']), (True, None))
        changes, _ = self.pull_all(self.parent_a, child)
        self.assertIn({'kind': 'rest_day', 'key': '2026-10-20', 'deleted': True, 'value': None}, [{k: c[k] for k in ('kind', 'key', 'deleted', 'value')} for c in changes])

    def test_future_stamp_is_clamped_once_and_retries_keep_it(self):
        child = self.fresh_child()
        far = int(time.time() * 1000) + 10 * 24 * 3600 * 1000
        o = op([('setting', 'timezone', {'timezone': 'Asia/Tokyo'})], t=far)
        r = self.push(self.parent_a, child, [o])['results'][0]
        self.assertLess(r['stamp']['t'], far)
        self.assertLessEqual(r['stamp']['t'], int(time.time() * 1000) + 300000)
        time.sleep(0.05)
        self.assertEqual(self.push(self.parent_a, child, [o])['results'][0]['stamp'], r['stamp'])
        self.assertEqual(self.record(child, 'setting', 'timezone')['stamps']['value'], r['stamp'])

    def test_target_observations_are_add_only_and_mapping_status_is_stamped(self):
        child = self.seeded()
        t = copy.deepcopy(self.snapshot['targets'][0])
        newer = copy.deepcopy(t)
        newer['observations'] = [{**t['observations'][0], 'id': 'obs-new', 'recurrence': 'independent'}]
        newer['mapping_status'] = 'pending_content' if t['mapping_status'] == 'mapped' else 'mapped'
        newer['target_value'] = None
        self.push(self.parent_a, child, [op([('target', t['id'], newer)], t=int(time.time() * 1000) + 1000)])
        stored = self.record(child, 'target', t['id'])['value']
        self.assertEqual([o['id'] for o in stored['observations']], [o['id'] for o in t['observations']] + ['obs-new'])
        self.assertEqual(stored['mapping_status'], newer['mapping_status'])
        self.assertEqual(stored['target_value'], t['target_value'], 'identity fields are kept')

    # reads -----------------------------------------------------------------------------------
    def test_pull_pages_are_stable_bounded_and_complete(self):
        child = self.seeded()
        everything, head = self.pull_all(self.parent_a, child, 0, 500)
        paged, head2 = self.pull_all(self.parent_a, child, 0, 7)
        self.assertEqual(head, head2)
        self.assertEqual([c['seq'] for c in paged], sorted(c['seq'] for c in paged))
        self.assertEqual({(c['kind'], c['key']) for c in paged}, {(c['kind'], c['key']) for c in everything})
        self.assertEqual(len(everything), self.count('sync_records', child))
        page = self.pull(self.parent_a, child, 0, 5)
        self.assertEqual(len(page['changes']), 5)
        self.assertTrue(page['more'])
        caught_up = self.pull(self.parent_a, child, head, 5)
        self.assertEqual((caught_up['changes'], caught_up['more'], caught_up['cursor'], caught_up['head']), ([], False, head, head))
        self.assertDbError('PT409', self.pull, self.parent_a, child, head + 1)
        # Every uploaded touch re-issues the record, so the uploading device re-reads the merged value.
        cp = self.snapshot['story']['checkpoints'][0]
        self.push(self.parent_a, child, [op([('checkpoint', cp['id'], cp)])])
        later = self.pull(self.parent_a, child, head)
        self.assertEqual([(c['kind'], c['key']) for c in later['changes']], [('checkpoint', cp['id'])])

    def test_a_cursor_never_skips_a_transaction_that_commits_later(self):
        child = self.seeded()
        _, head = self.pull_all(self.parent_a, child)
        slow = op([('setting', 'timezone', {'timezone': 'Asia/Tokyo'})])
        script = as_role(f"select public.sync_push('{child}'::uuid, {lit([slow])}::jsonb);\nselect pg_sleep(1.5);", sub=self.parent_a)
        proc, text = self.db.popen(script)
        proc.stdin.write(text)
        proc.stdin.close()
        time.sleep(0.4)
        # While the slow upload is uncommitted, a reader sees neither its records nor its change numbers.
        during = self.pull(self.parent_a, child, head)
        self.assertEqual(during['changes'], [])
        self.assertEqual(during['cursor'], head)
        # A second writer waits for the first (per-child lock), then gets later change numbers.
        fast = op([('setting', 'ui_language', {'ui_language': 'zh'})])
        t0 = time.time()
        self.push(self.parent_a, child, [fast])
        self.assertGreater(time.time() - t0, 0.5, 'the second writer waited for the first')
        proc.wait(timeout=20)
        self.assertEqual(proc.returncode, 0, proc.stderr.read())
        after = self.pull(self.parent_a, child, during['cursor'])
        self.assertEqual([c['key'] for c in after['changes']], ['timezone', 'ui_language'])

    def test_deleting_a_child_removes_its_synced_data_only(self):
        child = self.seeded()
        other = self.seeded()
        self.db.run(f"delete from public.children where id = '{child}';")  # owner-only path, not a client
        for t in SYNC_TABLES:
            self.assertEqual(self.count(t, child), 0, t)
        self.assertGreater(self.count('sync_records', other), 0)

    def test_server_logs_never_contain_refused_content(self):
        child = self.fresh_child()
        self.push(self.parent_a, child, [op([('setting', 'timezone', {'timezone': 'Asia/Singapore', 'note': WRONG_FORM + NOTE})])])
        self.assertNotIn(WRONG_FORM, self.server.log_text())
        self.assertNotIn(NOTE, self.server.log_text())

    # the client's own code against these functions ---------------------------------------------
    def test_client_against_server(self):
        env = {**os.environ, 'SYNC_SERVER_URL': self.server.url, 'SYNC_ANON_KEY': 'synthetic-test-only'}
        p = subprocess.run(['node', '--experimental-strip-types', '--test', 'supabase/tests/client/sync-live.test.ts'],
                           cwd=ROOT, env=env, capture_output=True, text=True, timeout=600)
        if p.returncode != 0:
            print(p.stdout[-6000:])
            print(p.stderr[-3000:])
        self.assertEqual(p.returncode, 0, 'client scenarios against the real server functions failed')
        log = self.server.log_text()
        self.assertNotIn(WRONG_FORM, log)


if __name__ == '__main__':
    unittest.main(verbosity=2)
