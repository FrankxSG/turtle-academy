-- Turtle Academy Pilot v0.1 — identity, family/child ownership, RLS and snapshot contract (Issue #16).
-- Synthetic-only foundation. Does not create real records, enable sign-up or configure hosted Auth.
-- Applied by the owner to the test project after review; never by CI.

-- ---------------------------------------------------------------------------------------------
-- Private helper schema (not exposed through the Data API).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
alter default privileges in schema private revoke execute on functions from public;

-- ---------------------------------------------------------------------------------------------
-- Ownership tables: Family -> parent membership -> Child -> snapshots.
create table public.families (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role = 'parent'),
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create index family_members_user_idx on public.family_members (user_id);

-- Nickname only: no real name, birth date or school fields exist.
create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24 and nickname !~ '[@[:cntrl:]]'),
  created_at timestamptz not null default now()
);
create index children_family_idx on public.children (family_id);

-- Linear snapshot history. base_snapshot_id deliberately has no foreign key so that a later,
-- separately reviewed owner-only pruning operation can remove old ancestors.
create table public.snapshots (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  seq integer not null check (seq >= 1),
  base_snapshot_id uuid,
  operation_id uuid not null,
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  schema_version text not null,
  payload jsonb not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (child_id, seq),
  unique (child_id, operation_id)
);

-- Server-authoritative committed head. One row per child, created with the child, so the
-- first-snapshot check can lock a real row instead of trusting an empty client read.
create table public.snapshot_heads (
  child_id uuid primary key references public.children (id) on delete cascade,
  head_snapshot_id uuid,
  head_seq integer not null default 0 check (head_seq >= 0),
  updated_at timestamptz not null default now(),
  check ((head_snapshot_id is null) = (head_seq = 0))
);

-- ---------------------------------------------------------------------------------------------
-- Privileges: ordinary clients may only read their own rows; every write goes through the
-- guarded function below. Supabase grants broad default privileges in the public schema, so
-- they are revoked explicitly.
revoke all on table public.families, public.family_members, public.children, public.snapshots, public.snapshot_heads
  from public, anon, authenticated, service_role;
grant select on table public.families, public.family_members, public.children, public.snapshots, public.snapshot_heads
  to authenticated;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.children enable row level security;
alter table public.snapshots enable row level security;
alter table public.snapshot_heads enable row level security;

create function private.is_family_parent(p_family_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.family_members m
    where m.family_id = p_family_id and m.user_id = auth.uid() and m.role = 'parent'
  )
$$;

create function private.is_child_parent(p_child_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.children c
    join public.family_members m on m.family_id = c.family_id
    where c.id = p_child_id and m.user_id = auth.uid() and m.role = 'parent'
  )
$$;

revoke all on function private.is_family_parent(uuid), private.is_child_parent(uuid) from public, anon;
grant execute on function private.is_family_parent(uuid), private.is_child_parent(uuid) to authenticated;

create policy families_parent_read on public.families for select to authenticated
  using (private.is_family_parent(id));
create policy family_members_self_read on public.family_members for select to authenticated
  using (user_id = auth.uid());
create policy children_parent_read on public.children for select to authenticated
  using (private.is_family_parent(family_id));
create policy snapshots_parent_read on public.snapshots for select to authenticated
  using (private.is_child_parent(child_id));
create policy snapshot_heads_parent_read on public.snapshot_heads for select to authenticated
  using (private.is_child_parent(child_id));

-- ---------------------------------------------------------------------------------------------
-- Snapshot allow-list. The descriptor is identical to src/snapshot/schema.json (parity-tested).
create function private.snapshot_schema() returns jsonb
language sql immutable set search_path = '' as $fn$
  select $schema${"id":"pilot-snapshot/1","note":"Closed allow-list for child-scoped backup snapshots (Pilot Scope section 3). Every object is closed: unknown keys are rejected. Free text is not representable; strings are enums, opaque IDs, dates or bounded target values. The same descriptor is embedded in the database migration and checked for parity by tests.","defs":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9_.:-]{0,127}$"},"nullable_id":{"type":"string","pattern":"^[a-z0-9][a-z0-9_.:-]{0,127}$","nullable":true},"uuid":{"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},"nullable_uuid":{"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$","nullable":true},"date":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},"nullable_date":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$","nullable":true},"datetime":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?(Z|[+-][0-9]{2}:[0-9]{2})$"},"nullable_datetime":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?(Z|[+-][0-9]{2}:[0-9]{2})$","nullable":true},"timezone":{"type":"string","pattern":"^[A-Za-z_]{1,32}(/[A-Za-z0-9_+-]{1,32}){0,2}$"},"subject":{"type":"string","enum":["chinese","english","mathematics","science"]},"course":{"type":"string","enum":["p2_chinese","p2_higher_chinese","p3_chinese","p3_higher_chinese","p2_english","p3_english","p2_mathematics","p3_mathematics","p3_science"]},"count":{"type":"integer","minimum":0,"maximum":100000},"x":{"type":"integer","minimum":6,"maximum":19}},"root":{"type":"object","required":["schema_version","child_ref","created_at","app_version","content_versions","settings","targets","events","tasks","completions","rest_days","story","flags","suspensions","exposure","calendar_guards","pending_upload"],"properties":{"schema_version":{"type":"string","enum":["pilot-snapshot/1"]},"child_ref":{"$ref":"uuid"},"created_at":{"$ref":"datetime"},"app_version":{"type":"string","pattern":"^[0-9]{1,4}\\.[0-9]{1,4}\\.[0-9]{1,4}$"},"content_versions":{"type":"array","maxItems":16,"items":{"type":"object","required":["subject","catalogue_version"],"properties":{"subject":{"$ref":"subject"},"catalogue_version":{"$ref":"id"}}}},"settings":{"type":"object","required":["timezone","timezone_history","subjects"],"properties":{"timezone":{"$ref":"timezone"},"timezone_history":{"type":"array","maxItems":200,"items":{"type":"object","required":["timezone","changed_at"],"properties":{"timezone":{"$ref":"timezone"},"changed_at":{"$ref":"datetime"}}}},"subjects":{"type":"array","maxItems":4,"items":{"type":"object","required":["subject","x"],"properties":{"subject":{"$ref":"subject"},"x":{"$ref":"x"}}}}}},"targets":{"type":"array","maxItems":5000,"items":{"type":"object","required":["id","subject","course","target_kind","knowledge_point_ref","target_value","mapping_status","source","review"],"properties":{"id":{"$ref":"id"},"subject":{"$ref":"subject"},"course":{"$ref":"course"},"target_kind":{"type":"string","enum":["character","word","language_point","reading_skill","skill"]},"knowledge_point_ref":{"$ref":"nullable_id"},"target_value":{"type":"string","pattern":"^[A-Za-z\\u3400-\\u4dbf\\u4e00-\\u9fff' -]{1,24}$","nullable":true},"mapping_status":{"type":"string","enum":["mapped","pending_content"]},"source":{"type":"object","required":["type","date","instance_ref","batch_ref"],"properties":{"type":{"type":"string","enum":["schoolwork","home_practice","external_assessment","other_reviewed_work","app_practice"]},"date":{"$ref":"date"},"instance_ref":{"$ref":"id"},"batch_ref":{"$ref":"nullable_id"}}},"review":{"type":"object","required":["status","reviewed_at","amends"],"properties":{"status":{"type":"string","enum":["verified","amended","invalidated"]},"reviewed_at":{"$ref":"datetime"},"amends":{"$ref":"nullable_id"}}}}}},"events":{"type":"array","maxItems":20000,"items":{"type":"object","required":["id","task_id","item_id","item_version","phase","assistance","selected_option_id","correct","at"],"properties":{"id":{"$ref":"id"},"task_id":{"$ref":"id"},"item_id":{"$ref":"id"},"item_version":{"type":"integer","minimum":1,"maximum":100000},"target_ref":{"$ref":"nullable_id"},"phase":{"type":"string","enum":["first","retry","correction","review"]},"assistance":{"type":"string","enum":["none","hint","answer_and_explanation"]},"selected_option_id":{"$ref":"id"},"correct":{"type":"boolean"},"at":{"$ref":"datetime"}}}},"tasks":{"type":"array","maxItems":5000,"items":{"type":"object","required":["id","subject","local_date","x","planned_total","cursor","status","content_version","active_seconds","target_aggregates"],"properties":{"id":{"$ref":"id"},"subject":{"$ref":"subject"},"local_date":{"$ref":"date"},"x":{"$ref":"x"},"planned_total":{"type":"integer","minimum":0,"maximum":100},"cursor":{"type":"integer","minimum":0,"maximum":100},"status":{"type":"string","enum":["active","paused","finalised"]},"content_version":{"$ref":"id"},"active_seconds":{"type":"integer","minimum":0,"maximum":86400},"target_aggregates":{"type":"array","maxItems":100,"items":{"type":"object","required":["target_ref","stage","first_correct","first_wrong"],"properties":{"target_ref":{"$ref":"id"},"stage":{"type":"string","enum":["exact","similar","generic","review"]},"first_correct":{"$ref":"count"},"first_wrong":{"$ref":"count"}}}}}}},"completions":{"type":"array","maxItems":5000,"items":{"type":"object","required":["subject","local_date","task_id","reason"],"properties":{"subject":{"$ref":"subject"},"local_date":{"$ref":"date"},"task_id":{"$ref":"nullable_id"},"reason":{"type":"string","enum":["full","shortened_no_eligible_content","flagged_replacements_exhausted"]}}}},"rest_days":{"type":"array","maxItems":3700,"items":{"$ref":"date"}},"story":{"type":"object","required":["checkpoints","chapter","ended"],"properties":{"checkpoints":{"type":"array","maxItems":10000,"items":{"type":"object","required":["id","task_id","kind","local_date"],"properties":{"id":{"$ref":"id"},"task_id":{"$ref":"nullable_id"},"kind":{"type":"string","enum":["halfway","completion","exploration"]},"local_date":{"$ref":"date"}}}},"chapter":{"type":"integer","minimum":0,"maximum":10000},"ended":{"type":"boolean"}}},"flags":{"type":"array","maxItems":2000,"items":{"type":"object","required":["item_id","item_version","reason","flagged_at","status"],"properties":{"item_id":{"$ref":"id"},"item_version":{"type":"integer","minimum":1,"maximum":100000},"reason":{"type":"string","enum":["answer_looks_wrong","question_unclear","too_hard","other"]},"flagged_at":{"$ref":"datetime"},"status":{"type":"string","enum":["open","restored","disabled"]}}}},"suspensions":{"type":"array","maxItems":2000,"items":{"type":"object","required":["item_id","item_version","scope","since","restored_at"],"properties":{"item_id":{"$ref":"id"},"item_version":{"type":"integer","minimum":1,"maximum":100000,"nullable":true},"scope":{"type":"string","enum":["child","version"]},"since":{"$ref":"datetime"},"restored_at":{"$ref":"nullable_datetime"}}}},"exposure":{"type":"array","maxItems":20000,"items":{"type":"object","required":["item_id","last_presented_on","times"],"properties":{"item_id":{"$ref":"id"},"last_presented_on":{"$ref":"date"},"times":{"$ref":"count"}}}},"calendar_guards":{"type":"object","required":["last_finalised_date","last_timezone_change_at"],"properties":{"last_finalised_date":{"$ref":"nullable_date"},"last_timezone_change_at":{"$ref":"nullable_datetime"}}},"pending_upload":{"type":"object","nullable":true,"required":["operation_id","base_snapshot_id","queued_at"],"properties":{"operation_id":{"$ref":"uuid"},"base_snapshot_id":{"$ref":"nullable_uuid"},"queued_at":{"$ref":"datetime"}}}}}}$schema$::jsonb
$fn$;

create function private.snapshot_node_valid(p_defs jsonb, p_node jsonb, p_value jsonb, p_depth integer)
returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_type text;
  v_key text;
  v_child jsonb;
  v_elem jsonb;
  v_num numeric;
begin
  if p_depth > 12 or p_node is null then
    return false;
  end if;
  if p_node ? '$ref' then
    if not (p_defs ? (p_node ->> '$ref')) then
      return false;
    end if;
    return private.snapshot_node_valid(p_defs, p_defs -> (p_node ->> '$ref'), p_value, p_depth + 1);
  end if;
  if p_value is null or jsonb_typeof(p_value) = 'null' then
    return coalesce((p_node ->> 'nullable')::boolean, false);
  end if;
  v_type := p_node ->> 'type';
  if v_type = 'object' then
    if jsonb_typeof(p_value) <> 'object' then
      return false;
    end if;
    for v_key in select jsonb_object_keys(p_value) loop
      if not coalesce((p_node -> 'properties') ? v_key, false) then
        return false;
      end if;
    end loop;
    for v_key in select jsonb_array_elements_text(coalesce(p_node -> 'required', '[]'::jsonb)) loop
      if not (p_value ? v_key) then
        return false;
      end if;
    end loop;
    for v_key, v_child in select key, value from jsonb_each(coalesce(p_node -> 'properties', '{}'::jsonb)) loop
      if p_value ? v_key and not private.snapshot_node_valid(p_defs, v_child, p_value -> v_key, p_depth + 1) then
        return false;
      end if;
    end loop;
    return true;
  elsif v_type = 'array' then
    if jsonb_typeof(p_value) <> 'array' then
      return false;
    end if;
    if p_node ? 'maxItems' and jsonb_array_length(p_value) > (p_node ->> 'maxItems')::integer then
      return false;
    end if;
    if not (p_node ? 'items') then
      return jsonb_array_length(p_value) = 0;
    end if;
    for v_elem in select value from jsonb_array_elements(p_value) loop
      if not private.snapshot_node_valid(p_defs, p_node -> 'items', v_elem, p_depth + 1) then
        return false;
      end if;
    end loop;
    return true;
  elsif v_type = 'string' then
    if jsonb_typeof(p_value) <> 'string' then
      return false;
    end if;
    if p_node ? 'enum' and not ((p_node -> 'enum') ? (p_value #>> '{}')) then
      return false;
    end if;
    if p_node ? 'pattern' and not ((p_value #>> '{}') ~ (p_node ->> 'pattern')) then
      return false;
    end if;
    return true;
  elsif v_type = 'integer' then
    if jsonb_typeof(p_value) <> 'number' then
      return false;
    end if;
    v_num := (p_value #>> '{}')::numeric;
    if v_num <> trunc(v_num) then
      return false;
    end if;
    if p_node ? 'minimum' and v_num < (p_node ->> 'minimum')::numeric then
      return false;
    end if;
    if p_node ? 'maximum' and v_num > (p_node ->> 'maximum')::numeric then
      return false;
    end if;
    return true;
  elsif v_type = 'boolean' then
    return jsonb_typeof(p_value) = 'boolean';
  end if;
  return false;
end
$$;

-- Raises without echoing payload content.
create function private.assert_snapshot_valid(p_payload jsonb, p_child_id uuid) returns void
language plpgsql stable set search_path = '' as $$
declare
  v_schema jsonb := private.snapshot_schema();
begin
  if octet_length(p_payload::text) > 1048576 then
    raise exception 'snapshot_too_large' using errcode = 'PT413';
  end if;
  if not private.snapshot_node_valid(v_schema -> 'defs', v_schema -> 'root', p_payload, 0) then
    raise exception 'invalid_snapshot' using errcode = 'PT422';
  end if;
  if (p_payload ->> 'child_ref') is distinct from p_child_id::text then
    raise exception 'invalid_snapshot' using errcode = 'PT422';
  end if;
end
$$;

revoke all on function private.snapshot_schema(), private.snapshot_node_valid(jsonb, jsonb, jsonb, integer),
  private.assert_snapshot_valid(jsonb, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- The only client write path. Retry identity = child + operation id + identical request
-- (base + payload). Stale bases are rejected; nothing is ever overwritten.
create function public.upload_snapshot(
  p_child_id uuid,
  p_operation_id uuid,
  p_base_snapshot_id uuid,
  p_payload jsonb
) returns table (snapshot_id uuid, snapshot_seq integer, replayed boolean)
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_head public.snapshot_heads%rowtype;
  v_existing public.snapshots%rowtype;
  v_hash text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_child_id is null or p_operation_id is null or p_payload is null then
    raise exception 'invalid_request' using errcode = 'PT400';
  end if;
  if not private.is_child_parent(p_child_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  -- Serialise all writers for this child on its head row.
  select * into v_head from public.snapshot_heads h where h.child_id = p_child_id for update;
  if not found then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  v_hash := encode(sha256(convert_to(coalesce(p_base_snapshot_id::text, 'none') || '|' || p_payload::text, 'UTF8')), 'hex');

  select * into v_existing from public.snapshots s
  where s.child_id = p_child_id and s.operation_id = p_operation_id;
  if found then
    if v_existing.request_sha256 = v_hash then
      return query select v_existing.id, v_existing.seq, true;
      return;
    end if;
    raise exception 'operation_conflict' using errcode = 'PT409';
  end if;

  perform private.assert_snapshot_valid(p_payload, p_child_id);

  if v_head.head_snapshot_id is null then
    -- No committed head: only a base-less first snapshot is allowed.
    if p_base_snapshot_id is not null then
      raise exception 'stale_base' using errcode = 'PT409';
    end if;
  elsif p_base_snapshot_id is distinct from v_head.head_snapshot_id then
    raise exception 'stale_base' using errcode = 'PT409';
  end if;

  insert into public.snapshots (child_id, seq, base_snapshot_id, operation_id, request_sha256, schema_version, payload, created_by)
  values (p_child_id, v_head.head_seq + 1, p_base_snapshot_id, p_operation_id, v_hash, p_payload ->> 'schema_version', p_payload, v_uid)
  returning id into v_id;

  update public.snapshot_heads
  set head_snapshot_id = v_id, head_seq = v_head.head_seq + 1, updated_at = now()
  where child_id = p_child_id;

  return query select v_id, v_head.head_seq + 1, false;
end
$$;

revoke all on function public.upload_snapshot(uuid, uuid, uuid, jsonb) from public, anon, service_role;
grant execute on function public.upload_snapshot(uuid, uuid, uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Owner-only provisioning (run by the owner in the SQL editor; not callable by any client role).
create function private.provision_family(p_parent_user_id uuid, p_child_nickname text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_family uuid;
  v_child uuid;
begin
  insert into public.families default values returning id into v_family;
  insert into public.family_members (family_id, user_id, role) values (v_family, p_parent_user_id, 'parent');
  insert into public.children (family_id, nickname) values (v_family, p_child_nickname) returning id into v_child;
  insert into public.snapshot_heads (child_id) values (v_child);
  return v_child;
end
$$;

revoke all on function private.provision_family(uuid, text) from public, anon, authenticated, service_role;
