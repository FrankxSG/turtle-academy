"""Local live-sync test server (synthetic data only): a throwaway PostgreSQL cluster with every migration applied,
behind a minimal HTTP stand-in for the two Supabase endpoints the app calls:

  POST /auth/v1/token?grant_type=password|refresh_token   synthetic email/password users only
  POST /auth/v1/logout
  POST /rest/v1/rpc/<function>                              runs the function as the caller's role, as PostgREST does

Calls run as the real client roles (`SET ROLE` + `request.jwt.claims`), so RLS, grants and the server functions are
exercised exactly as on Supabase. Error responses carry the database error code and its short message only; request
bodies are never logged. Test-only controls live under /__test/. Never point this at, or copy it to, a hosted project.

Run standalone (used by the browser tests):  python3 supabase/tests/sync_server.py --port 54331
"""
import argparse
import json
import os
import pathlib
import secrets
import sys
import threading
import time
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from test_database import ALL_MIGRATIONS, HERE, Cluster, DbError, as_role, lit  # noqa: E402

PASSWORD = 'synthetic-password'
ANON_KEY = 'synthetic-test-only'
USERS = {
    'parent-a@example.invalid': 'Turtle',
    'parent-b@example.invalid': 'Otter',
    'stranger@example.invalid': None,
    # Database contract tests provision extra children for this parent; the client scenarios use parent-a.
    'parent-c@example.invalid': None,
    # Browser tests (tests/sync.spec.ts), one parent per scenario.
    'browser-1@example.invalid': 'Kite',
    'browser-2@example.invalid': 'Lark',
    'browser-3@example.invalid': 'Wren',
}
UUID_RE = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
SIGNATURES = {
    'sync_whoami': [],
    'sync_push': [('p_child_id', 'uuid'), ('p_ops', 'jsonb')],
    'sync_pull': [('p_child_id', 'uuid'), ('p_cursor', 'bigint'), ('p_limit', 'integer')],
    'upload_snapshot': [('p_child_id', 'uuid'), ('p_operation_id', 'uuid'), ('p_base_snapshot_id', 'uuid'), ('p_payload', 'jsonb')],
}


class SyncServer:
    def __init__(self):
        self.db = Cluster()
        self.users = {}          # email -> user id
        self.children = {}       # email -> child id
        self.access = {}         # token -> {sub, exp}
        self.refresh = {}        # token -> sub
        self.lose_next = 0       # apply the next N pushes, then drop the connection without a response
        self.lock = threading.Lock()
        self.httpd = None

    # setup -----------------------------------------------------------------------------------
    def start(self, port=0):
        self.db.start()
        self.db.run((HERE / 'harness' / 'supabase_stub.sql').read_text(encoding='utf-8'))
        for path in ALL_MIGRATIONS:
            self.db.run(path.read_text(encoding='utf-8'))
        for email, nickname in USERS.items():
            uid = str(uuid.uuid4())
            self.users[email] = uid
            self.db.run(f"insert into auth.users (id, email) values ('{uid}', '{email}');")
            if nickname:
                self.children[email] = self.db.run(f"select private.provision_family('{uid}', '{nickname}');")[0][0]
        self.httpd = ThreadingHTTPServer(('127.0.0.1', port), self._handler())
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()
        return self

    @property
    def url(self):
        return f'http://127.0.0.1:{self.httpd.server_address[1]}'

    def stop(self):
        if self.httpd:
            self.httpd.shutdown()
        self.db.stop()

    def log_text(self):
        try:
            with open(os.path.join(self.db.tmp, 'log'), encoding='utf-8', errors='replace') as f:
                return f.read()
        except OSError:
            return ''

    # auth --------------------------------------------------------------------------------------
    def issue(self, sub, ttl=3600):
        access, refresh = secrets.token_hex(16), secrets.token_hex(16)
        with self.lock:
            self.access[access] = {'sub': sub, 'exp': time.time() + ttl}
            self.refresh[refresh] = sub
        return {'access_token': access, 'refresh_token': refresh, 'expires_at': int(time.time() + ttl), 'user': {'id': sub}}

    def expire(self, email, revoke_refresh=False):
        sub = self.users[email]
        with self.lock:
            for t in self.access.values():
                if t['sub'] == sub:
                    t['exp'] = 0
            if revoke_refresh:
                for k in [k for k, v in self.refresh.items() if v == sub]:
                    del self.refresh[k]

    # rpc ---------------------------------------------------------------------------------------
    def call(self, fn, args, token):
        claims = None
        if token and token != ANON_KEY:
            with self.lock:
                entry = self.access.get(token)
            if not entry or entry['exp'] <= time.time():
                return 401, {'code': 'PGRST303', 'message': 'JWT expired'}
            claims = entry['sub']
        sig = SIGNATURES.get(fn)
        if sig is None or not isinstance(args, dict) or set(args) != {name for name, _ in sig}:
            return 404, {'code': 'PGRST202', 'message': 'function_not_found'}
        parts = []
        for name, kind in sig:
            value = args[name]
            if value is None:
                parts.append(f'{name} := null::{kind}')
            elif kind == 'jsonb':
                parts.append(f'{name} := {lit(value)}::jsonb')
            elif kind == 'uuid':
                if not isinstance(value, str) or not __import__('re').match(UUID_RE, value):
                    return 400, {'code': '22P02', 'message': 'invalid_input'}
                parts.append(f"{name} := '{value}'::uuid")
            else:
                if not isinstance(value, int) or isinstance(value, bool):
                    return 400, {'code': '22P02', 'message': 'invalid_input'}
                parts.append(f'{name} := {int(value)}::{kind}')
        sql = f"select public.{fn}({', '.join(parts)})::text;"
        role = 'authenticated' if claims else 'anon'
        try:
            rows = self.db.run(as_role(sql, role, claims))
        except DbError as e:
            code = e.code
            if code == '42501':
                return (403 if claims else 401), {'code': code, 'message': getattr(e, 'message', 'not_authorized')}
            if code.startswith('PT') and code[2:].isdigit():
                return int(code[2:]), {'code': code, 'message': getattr(e, 'message', '')}
            return 400, {'code': code, 'message': 'error'}
        return 200, json.loads(rows[0][0])

    def _handler(server):  # noqa: N805 - closure over the server
        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):  # never log requests or bodies
                pass

            def _send(self, status, body=None):
                data = b'' if body is None else json.dumps(body).encode()
                self.send_response(status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)

            def _json(self):
                n = int(self.headers.get('Content-Length') or 0)
                raw = self.rfile.read(n) if n else b''
                try:
                    return json.loads(raw or b'{}')
                except ValueError:
                    return None

            def do_GET(self):
                if self.path.startswith('/__test/health'):
                    return self._send(200, {'ok': True, 'users': server.users, 'children': server.children})
                self._send(404)

            def do_POST(self):
                u = urlparse(self.path)
                body = self._json()
                if u.path == '/auth/v1/token':
                    grant = parse_qs(u.query).get('grant_type', [''])[0]
                    if grant == 'password' and isinstance(body, dict) and body.get('email') in server.users and body.get('password') == PASSWORD:
                        return self._send(200, server.issue(server.users[body['email']]))
                    if grant == 'refresh_token' and isinstance(body, dict):
                        with server.lock:
                            sub = server.refresh.pop(body.get('refresh_token'), None)
                        if sub:
                            return self._send(200, server.issue(sub))
                    return self._send(400, {'error': 'invalid_grant'})
                if u.path == '/auth/v1/logout':
                    return self._send(204)
                if u.path == '/__test/expire':
                    server.expire(body['email'], bool(body.get('revoke_refresh')))
                    return self._send(200, {})
                if u.path == '/__test/lose-next':
                    server.lose_next = int(body.get('count', 1))
                    return self._send(200, {})
                if u.path == '/__test/sql':  # read-only inspection for tests, as the table owner
                    rows = server.db.run(body['sql'])
                    return self._send(200, rows)
                if u.path.startswith('/rest/v1/rpc/'):
                    auth = self.headers.get('Authorization', '')
                    token = auth[7:] if auth.startswith('Bearer ') else None
                    status, out = server.call(u.path.rsplit('/', 1)[-1], body, token)
                    if u.path.endswith('/sync_push') and status == 200 and server.lose_next > 0:
                        server.lose_next -= 1
                        self.close_connection = True
                        self.connection.shutdown(2)  # applied, but the response never arrives
                        return
                    return self._send(status, out)
                self._send(404)

        return Handler


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--port', type=int, default=54331)
    args = p.parse_args()
    s = SyncServer().start(args.port)
    print(f'READY {s.url}', flush=True)
    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        pass
    finally:
        s.stop()


if __name__ == '__main__':
    main()
