-- LOCAL TEST HARNESS ONLY — never applied to a hosted project.
-- Reproduces the parts of a Supabase database that the migrations and RLS rely on, so policies
-- are exercised under the same roles and default privileges they will meet on Supabase:
--   * NOLOGIN API roles anon / authenticated / service_role (service_role bypasses RLS);
--   * the auth schema with auth.users and auth.uid()/auth.role() reading request JWT claims;
--   * Supabase's broad default privileges on objects created in the public schema.
-- Tests switch to these roles with SET ROLE inside a transaction and set request.jwt.claims,
-- which is how the Data API presents a request to Postgres.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create schema auth;
create table auth.users (
  id uuid primary key,
  email text unique
);

create function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create function auth.role() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
