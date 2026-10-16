"""Database contract tests for Issue #16 (synthetic data only).

Starts a throwaway local PostgreSQL cluster, applies the Supabase stub harness and every migration,
then exercises the schema as the real client roles (anon / authenticated / service_role) using
SET ROLE and request.jwt.claims, exactly as the Data API presents requests. Each psql call is a
separate connection, so the concurrency tests run on genuinely separate transactions.

Run: python3 supabase/tests/test_database.py   (needs PostgreSQL server binaries and psql, 14+)
Standard library only. No network, service keys or real learner data.
"""
import copy
import glob
import json
import os
import pathlib
import shutil
import socket
import subprocess
import tempfile
import time
import unittest
import uuid

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
MIGRATIONS = sorted((ROOT / 'supabase' / 'migrations').glob('*.sql'))
FIXTURES = HERE / 'fixtures'


def pg_bin(name):
    found = shutil.which('pg_config')
    candidates = []
    if found:
        out = subprocess.run([found, '--bindir'], capture_output=True, text=True).stdout.strip()
        candidates.append(os.path.join(out, name))
    candidates += sorted(glob.glob(f'/usr/lib/postgresql/*/bin/{name}'), reverse=True)
    candidates.append(shutil.which(name) or '')
    for c in candidates:
        if c and os.path.exists(c):
            return c
    raise RuntimeError(f'PostgreSQL binary not found: {name}')


class DbError(Exception):
    def __init__(self, stderr):
        super().__init__(stderr)
        self.stderr = stderr
        self.code = ''
        for line in stderr.splitlines():
            if line.startswith('ERROR:'):
                rest = line[len('ERROR:'):].strip()
                self.code = rest.split(':', 1)[0].strip()
                self.message = rest.split(':', 1)[1].strip() if ':' in rest else rest
                break


class Cluster:
    def __init__(self):
        self.tmp = tempfile.mkdtemp(prefix='ta-pg-')
        self.data = os.path.join(self.tmp, 'data')
        self.sock = os.path.join(self.tmp, 'sock')
        os.makedirs(self.sock)
        self.as_root = hasattr(os, 'geteuid') and os.geteuid() == 0
        if self.as_root:
            shutil.chown(self.tmp, 'postgres')
            shutil.chown(self.sock, 'postgres')
            os.chmod(self.tmp, 0o755)
        with socket.socket() as s:
            s.bind(('127.0.0.1', 0))
            self.port = str(s.getsockname()[1])
        self.user = 'tester'

    def _server_cmd(self, args):
        return (['runuser', '-u', 'postgres', '--'] if self.as_root else []) + args

    def start(self):
        subprocess.run(self._server_cmd([pg_bin('initdb'), '-D', self.data, '-U', self.user, '--auth=trust',
                                         '-E', 'UTF8', '--locale=C.UTF-8', '--no-sync']),
                       check=True, capture_output=True)
        opts = f"-k {self.sock} -c listen_addresses='' -p {self.port} -c fsync=off"
        subprocess.run(self._server_cmd([pg_bin('pg_ctl'), '-D', self.data, '-o', opts, '-w', '-l',
                                         os.path.join(self.tmp, 'log'), 'start']), check=True, capture_output=True)

    def stop(self):
        subprocess.run(self._server_cmd([pg_bin('pg_ctl'), '-D', self.data, '-m', 'immediate', 'stop']), capture_output=True)
        shutil.rmtree(self.tmp, ignore_errors=True)

    def psql_args(self):
        return [pg_bin('psql'), '-h', self.sock, '-p', self.port, '-U', self.user, '-d', 'postgres',
                '-X', '-q', '-A', '-t', '-F', '\t', '-v', 'ON_ERROR_STOP=1']

    def run(self, script):
        p = subprocess.run(self.psql_args(), input='\\set VERBOSITY verbose\n' + script, capture_output=True, text=True)
        if p.returncode != 0:
            raise DbError(p.stderr)
        return [line.split('\t') for line in p.stdout.splitlines() if line.strip()]

    def popen(self, script):
        return subprocess.Popen(self.psql_args(), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True), '\\set VERBOSITY verbose\n' + script


def as_role(sql, role='authenticated', sub=None):
    claims = json.dumps({'sub': sub, 'role': role} if sub else {'role': role})
    return ('begin;\n'
            f'set local role {role};\n'
            '\\o /dev/null\n'
            f"select set_config('request.jwt.claims', $c${claims}$c$, true);\n"
            '\\o\n'
            f'{sql}\n'
            'commit;\n')


def lit(value):
    text = json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value
    assert '$j$' not in text
    return f'$j${text}$j$'


def nullable_uuid(value):
    return 'null' if value is None else f"'{value}'::uuid"


def apply_case(base, case):
    doc = copy.deepcopy(base)
    *parents, last = case['path']
    node = doc
    for key in parents:
        node = node[key]
    if case['op'] == 'delete':
        del node[last]
    else:
        node[last] = case['value']
    return doc


class DatabaseContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = Cluster()
        cls.db.start()
        cls.db.run((HERE / 'harness' / 'supabase_stub.sql').read_text(encoding='utf-8'))
        for path in MIGRATIONS:
            cls.db.run(path.read_text(encoding='utf-8'))
        cls.parent_a, cls.parent_b, cls.stranger = (str(uuid.uuid4()) for _ in range(3))
        users = ', '.join(f"('{u}', 'synthetic-{n}@example.invalid')" for n, u in
                          enumerate([cls.parent_a, cls.parent_b, cls.stranger]))
        cls.db.run(f'insert into auth.users (id, email) values {users};')
        cls.child_a = cls.provision(cls.parent_a, 'Turtle')
        cls.child_b = cls.provision(cls.parent_b, 'Otter')
        cls.valid = json.loads((FIXTURES / 'snapshot-valid.json').read_text(encoding='utf-8'))
        cls.invalid_cases = json.loads((FIXTURES / 'snapshot-invalid.json').read_text(encoding='utf-8'))['cases']

    @classmethod
    def tearDownClass(cls):
        cls.db.stop()

    @classmethod
    def provision(cls, parent, nickname):
        return cls.db.run(f"select private.provision_family('{parent}', '{nickname}');")[0][0]

    # helpers -------------------------------------------------------------------------------
    def payload(self, child, **changes):
        doc = copy.deepcopy(self.valid)
        doc['child_ref'] = child
        doc.update(changes)
        return doc

    def upload(self, sub, child, op, base, payload, role='authenticated'):
        rows = self.db.run(as_role(
            f'select snapshot_id, snapshot_seq, replayed from public.upload_snapshot('
            f"'{child}'::uuid, '{op}'::uuid, {nullable_uuid(base)}, {lit(payload)}::jsonb);", role, sub))
        sid, seq, replayed = rows[0]
        return sid, int(seq), replayed == 't'

    def head(self, child):
        row = self.db.run(f"select coalesce(head_snapshot_id::text, ''), head_seq from public.snapshot_heads where child_id = '{child}';")[0]
        return (row[0] or None), int(row[1])

    def count(self, child):
        return int(self.db.run(f"select count(*) from public.snapshots where child_id = '{child}';")[0][0])

    def assertDbError(self, code, fn, *args):
        with self.assertRaises(DbError) as ctx:
            fn(*args)
        self.assertEqual(ctx.exception.code, code, ctx.exception.stderr)
        return ctx.exception

    def fresh_child(self, parent=None):
        return self.provision(parent or self.parent_a, 'Synthetic')

    # schema basics -------------------------------------------------------------------------
    def test_rls_enabled_on_every_table(self):
        rows = self.db.run("select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace "
                           "and relkind = 'r' order by relname;")
        self.assertEqual({r[0] for r in rows}, {'families', 'family_members', 'children', 'snapshots', 'snapshot_heads'})
        self.assertTrue(all(r[1] == 't' for r in rows))

    def test_tests_really_run_as_client_roles(self):
        for role in ('anon', 'authenticated', 'service_role'):
            rows = self.db.run(as_role('select current_user, (select rolsuper or rolbypassrls from pg_roles where rolname = current_user);',
                                       role, self.parent_a if role == 'authenticated' else None))
            self.assertEqual(rows[0][0], role)
            if role != 'service_role':
                self.assertEqual(rows[0][1], 'f')

    def test_server_schema_matches_client_descriptor(self):
        server = json.loads(self.db.run('select private.snapshot_schema()::text;')[0][0])
        client = json.loads((ROOT / 'src' / 'snapshot' / 'schema.json').read_text(encoding='utf-8'))
        self.assertEqual(server, client)

    def test_child_profile_has_no_identifying_columns(self):
        cols = {r[0] for r in self.db.run("select column_name from information_schema.columns where table_schema = 'public' "
                                           "and table_name = 'children';")}
        self.assertEqual(cols, {'id', 'family_id', 'nickname', 'created_at'})
        with self.assertRaises(DbError):
            self.provision(self.parent_a, 'someone@example.invalid')

    # access isolation ----------------------------------------------------------------------
    def test_anon_cannot_read_or_call_anything(self):
        for table in ('families', 'family_members', 'children', 'snapshots', 'snapshot_heads'):
            self.assertDbError('42501', self.db.run, as_role(f'select count(*) from public.{table};', 'anon'))
        self.assertDbError('42501', self.upload, None, self.child_a, uuid.uuid4(), None, self.payload(self.child_a), 'anon')

    def test_service_role_has_no_table_or_upload_access(self):
        self.assertDbError('42501', self.db.run, as_role('select count(*) from public.snapshots;', 'service_role'))
        self.assertDbError('42501', self.upload, self.parent_a, self.child_a, uuid.uuid4(), None, self.payload(self.child_a), 'service_role')

    def test_parent_sees_only_own_family(self):
        sql = ('select (select count(*) from public.families), (select count(*) from public.family_members), '
               '(select count(*) from public.children), (select string_agg(id::text, \',\') from public.children);')
        fam, mem, kids, ids = self.db.run(as_role(sql, sub=self.parent_a))[0]
        self.assertEqual(ids.split(',').count(self.child_b), 0)
        self.assertIn(self.child_a, ids)
        self.assertEqual(int(mem), int(self.db.run(f"select count(*) from public.family_members where user_id = '{self.parent_a}';")[0][0]))

    def test_nonmember_sees_nothing(self):
        sql = ('select (select count(*) from public.families) + (select count(*) from public.family_members) + '
               '(select count(*) from public.children) + (select count(*) from public.snapshots) + '
               '(select count(*) from public.snapshot_heads);')
        self.assertEqual(self.db.run(as_role(sql, sub=self.stranger))[0][0], '0')

    def test_direct_writes_and_ownership_bypasses_are_denied(self):
        fam_b = self.db.run(f"select family_id from public.children where id = '{self.child_b}';")[0][0]
        attempts = [
            f"insert into public.family_members (family_id, user_id, role) values ('{fam_b}', '{self.parent_a}', 'parent');",
            "insert into public.families default values;",
            f"insert into public.children (family_id, nickname) values ('{fam_b}', 'Sneaky');",
            f"update public.children set family_id = '{fam_b}' where id = '{self.child_a}';",
            f"update public.family_members set family_id = '{fam_b}' where user_id = '{self.parent_a}';",
            (f"insert into public.snapshots (child_id, seq, operation_id, request_sha256, schema_version, payload, created_by) "
             f"values ('{self.child_a}', 99, gen_random_uuid(), repeat('a', 64), 'pilot-snapshot/1', '{{}}', '{self.parent_a}');"),
            f"update public.snapshot_heads set head_seq = 99 where child_id = '{self.child_a}';",
            f"delete from public.snapshots where child_id = '{self.child_a}';",
            f"delete from public.snapshot_heads where child_id = '{self.child_a}';",
            f"delete from public.children where id = '{self.child_a}';",
            f"select private.provision_family('{self.parent_a}', 'Extra');",
            f"select private.assert_snapshot_valid('{{}}'::jsonb, '{self.child_a}');",
        ]
        before = self.db.run('select (select count(*) from public.family_members), (select count(*) from public.children), '
                             '(select count(*) from public.snapshots);')
        for sql in attempts:
            with self.subTest(sql=sql[:60]):
                self.assertDbError('42501', self.db.run, as_role(sql, sub=self.parent_a))
        after = self.db.run('select (select count(*) from public.family_members), (select count(*) from public.children), '
                            '(select count(*) from public.snapshots);')
        self.assertEqual(before, after)

    def test_upload_rejects_strangers_and_spoofed_children(self):
        child = self.fresh_child()
        self.assertDbError('42501', self.upload, self.stranger, child, uuid.uuid4(), None, self.payload(child))
        self.assertDbError('42501', self.upload, self.parent_b, child, uuid.uuid4(), None, self.payload(child))
        self.assertDbError('42501', self.upload, self.parent_a, str(uuid.uuid4()), uuid.uuid4(), None, self.payload(child))
        # payload naming another child is rejected even for the right parent
        self.assertDbError('PT422', self.upload, self.parent_a, child, uuid.uuid4(), None, self.payload(self.child_b))
        self.assertEqual(self.count(child), 0)
        self.assertEqual(self.head(child), (None, 0))

    # linear head -----------------------------------------------------------------------------
    def test_first_snapshot_then_linear_history(self):
        child = self.fresh_child()
        s1, seq1, rep1 = self.upload(self.parent_a, child, uuid.uuid4(), None, self.payload(child))
        self.assertEqual((seq1, rep1), (1, False))
        self.assertEqual(self.head(child), (s1, 1))
        s2, seq2, _ = self.upload(self.parent_a, child, uuid.uuid4(), s1, self.payload(child, app_version='0.1.1'))
        self.assertEqual(self.head(child), (s2, 2))
        # base-less upload once a head exists, an older base, and another family's snapshot as base
        self.assertDbError('PT409', self.upload, self.parent_a, child, uuid.uuid4(), None, self.payload(child))
        self.assertDbError('PT409', self.upload, self.parent_a, child, uuid.uuid4(), s1, self.payload(child))
        other = self.fresh_child(self.parent_b)
        sb, _, _ = self.upload(self.parent_b, other, uuid.uuid4(), None, self.payload(other))
        self.assertDbError('PT409', self.upload, self.parent_a, child, uuid.uuid4(), sb, self.payload(child))
        self.assertEqual(self.head(child), (s2, 2))
        self.assertEqual(self.count(child), 2)

    def test_retry_identity(self):
        child = self.fresh_child()
        op1 = uuid.uuid4()
        p1 = self.payload(child)
        s1, _, rep = self.upload(self.parent_a, child, op1, None, p1)
        self.assertFalse(rep)
        # lost response: identical retry returns the original result
        self.assertEqual(self.upload(self.parent_a, child, op1, None, p1), (s1, 1, True))
        s2, _, _ = self.upload(self.parent_a, child, uuid.uuid4(), s1, self.payload(child, app_version='0.2.0'))
        # retry of the first operation after the head advanced: original result, head not rewound
        self.assertEqual(self.upload(self.parent_a, child, op1, None, p1), (s1, 1, True))
        self.assertEqual(self.head(child), (s2, 2))
        # same operation id, different payload or base -> conflict, no change
        self.assertDbError('PT409', self.upload, self.parent_a, child, op1, None, self.payload(child, app_version='9.9.9'))
        self.assertDbError('PT409', self.upload, self.parent_a, child, op1, s2, p1)
        err = self.assertDbError('PT409', self.upload, self.parent_a, child, op1, s2, p1)
        self.assertEqual(err.message, 'operation_conflict')
        self.assertEqual(self.count(child), 2)
        self.assertEqual(self.head(child), (s2, 2))

    # minimisation at the write boundary -----------------------------------------------------
    def test_valid_fixture_accepted(self):
        child = self.fresh_child()
        self.upload(self.parent_a, child, uuid.uuid4(), None, self.payload(child))
        self.assertEqual(self.count(child), 1)

    def test_excluded_and_unknown_fields_rejected_without_side_effects(self):
        child = self.fresh_child()
        s1, _, _ = self.upload(self.parent_a, child, uuid.uuid4(), None, self.payload(child))
        base = self.payload(child)
        for case in self.invalid_cases:
            with self.subTest(case=case['name']):
                bad = apply_case(base, case)
                err = self.assertDbError('PT422', self.upload, self.parent_a, child, uuid.uuid4(), s1, bad)
                value = case.get('value')
                if isinstance(value, str) and len(value) >= 4:
                    # the error names a code only; it never echoes the rejected content
                    self.assertNotIn(value, err.stderr)
                self.assertEqual(err.message, 'invalid_snapshot')
        self.assertEqual(self.count(child), 1)
        self.assertEqual(self.head(child), (s1, 1))

    def test_oversized_snapshot_rejected(self):
        child = self.fresh_child()
        big = self.payload(child)
        big['exposure'] = [{'item_id': f'item-{n:06d}-' + 'x' * 30, 'last_presented_on': '2026-10-13', 'times': 1} for n in range(20000)]
        self.assertDbError('PT413', self.upload, self.parent_a, child, uuid.uuid4(), None, big)
        self.assertEqual(self.count(child), 0)

    # real concurrency ------------------------------------------------------------------------
    def _race(self, child, base, payload_a, payload_b):
        call = lambda op, p: as_role(
            f"select snapshot_id from public.upload_snapshot('{child}'::uuid, '{op}'::uuid, {nullable_uuid(base)}, {lit(p)}::jsonb);\n"
            'select pg_sleep(1.5);', sub=self.parent_a)
        proc_a, script_a = self.db.popen(call(uuid.uuid4(), payload_a))
        proc_a.stdin.write(script_a)
        proc_a.stdin.close()
        time.sleep(0.5)
        proc_b, script_b = self.db.popen(call(uuid.uuid4(), payload_b))
        proc_b.stdin.write(script_b)
        proc_b.stdin.close()
        # prove B is genuinely blocked on A's lock in a separate session while A is still open
        waited = False
        for _ in range(20):
            rows = self.db.run("select count(*) from pg_stat_activity where wait_event_type = 'Lock' "
                               "and query like '%upload_snapshot%';")
            if int(rows[0][0]) >= 1:
                waited = True
                break
            time.sleep(0.05)
        out_a, err_a = proc_a.communicate(timeout=20)
        out_b, err_b = proc_b.communicate(timeout=20)
        return waited, (proc_a.returncode, err_a), (proc_b.returncode, err_b)

    def test_concurrent_first_uploads_exactly_one_wins(self):
        child = self.fresh_child()
        waited, a, b = self._race(child, None, self.payload(child), self.payload(child, app_version='0.0.2'))
        self.assertTrue(waited, 'second upload never waited on the first transaction')
        self.assertEqual(a[0], 0, a[1])
        self.assertNotEqual(b[0], 0)
        self.assertEqual(DbError(b[1]).code, 'PT409', b[1])
        self.assertEqual(self.count(child), 1)
        self.assertEqual(self.head(child)[1], 1)

    def test_competing_writes_on_one_head_exactly_one_wins(self):
        child = self.fresh_child()
        s1, _, _ = self.upload(self.parent_a, child, uuid.uuid4(), None, self.payload(child))
        waited, a, b = self._race(child, s1, self.payload(child, app_version='0.0.3'), self.payload(child, app_version='0.0.4'))
        self.assertTrue(waited)
        self.assertEqual(a[0], 0, a[1])
        self.assertEqual(DbError(b[1]).code, 'PT409', b[1])
        self.assertEqual(self.count(child), 2)
        self.assertEqual(self.head(child)[1], 2)


if __name__ == '__main__':
    unittest.main(verbosity=2)
