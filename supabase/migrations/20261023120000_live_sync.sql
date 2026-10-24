-- Turtle Academy Pilot v0.1 — live sync, first milestone (one signed-in device; Pilot Scope §3, Learning Engine §6).
-- Synthetic-only. Adds the live records, operation receipts, server change history, editable-field history and
-- versioned pack data, the checked upload/download functions, and retires the client snapshot upload.
-- Applied by the owner to a verified test project after review; never by CI.
--
-- Write path: clients call public.sync_push only. It authenticates the parent, checks child ownership, validates
-- every change against the closed `pilot-sync/1` descriptor (identical to src/sync/schema.json, parity-tested),
-- and applies each operation in its own subtransaction under a per-child lock. Identical retries return the
-- original result; an operation id reused with different content is refused. Immutable records are never
-- overwritten. Direct table writes stay impossible for every client role.
--
-- Read path: public.sync_pull returns records changed after a server-issued cursor, in a stable order and bounded
-- pages. Change numbers come from a per-child counter that is only advanced while holding that child's lock, so a
-- transaction that commits later always gets higher numbers than anything already readable: a cursor never skips
-- it. Pages are bounded by the head read at the start of the call. Deletions are returned as tombstones.

-- ---------------------------------------------------------------------------------------------
-- Tables. All cascade from children, so deleting a child or family removes its synced data.
create table public.sync_heads (
  child_id uuid primary key references public.children (id) on delete cascade,
  change_seq bigint not null default 0 check (change_seq >= 0),
  updated_at timestamptz not null default now()
);

create table public.sync_devices (
  child_id uuid not null references public.children (id) on delete cascade,
  device_id uuid not null,
  last_seq bigint not null check (last_seq >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (child_id, device_id)
);

-- Operation receipts: one per applied operation. Retry identity = child + operation id + identical request.
create table public.sync_receipts (
  child_id uuid not null references public.children (id) on delete cascade,
  op_id uuid not null,
  device_id uuid not null,
  device_seq bigint not null,
  request_sha256 text not null check (request_sha256 ~ '^[0-9a-f]{64}$'),
  accepted_stamp jsonb not null,
  created_by uuid not null,
  applied_at timestamptz not null default now(),
  primary key (child_id, op_id)
);

-- Live records: the merged, server-authoritative value per child, kind and key. Pack versions are immutable rows
-- of kind `pack_version`, retained so tasks pinned to an earlier version still work.
create table public.sync_records (
  child_id uuid not null references public.children (id) on delete cascade,
  kind text not null,
  key text not null,
  value jsonb,
  deleted boolean not null default false,
  stamps jsonb not null default '{}'::jsonb,
  change_seq bigint not null,
  updated_at timestamptz not null default now(),
  primary key (child_id, kind, key),
  unique (child_id, change_seq),
  check ((value is null) = deleted)
);

-- Server change history (add-only): every record touch by an operation.
create table public.sync_changes (
  child_id uuid not null references public.children (id) on delete cascade,
  change_seq bigint not null,
  kind text not null,
  key text not null,
  op_id uuid not null,
  outcome text not null check (outcome in ('created', 'merged', 'unchanged', 'deleted')),
  recorded_at timestamptz not null default now(),
  primary key (child_id, change_seq)
);

-- Editable-field history: the value that lost a per-field stamp comparison (replaced or arriving too late).
create table public.sync_field_history (
  id bigint generated always as identity primary key,
  child_id uuid not null references public.children (id) on delete cascade,
  kind text not null,
  key text not null,
  field text not null,
  replaced_value jsonb,
  replaced_stamp jsonb,
  winning_stamp jsonb not null,
  op_id uuid not null,
  recorded_at timestamptz not null default now()
);
create index sync_field_history_child_idx on public.sync_field_history (child_id, kind, key);

revoke all on table public.sync_heads, public.sync_devices, public.sync_receipts, public.sync_records,
  public.sync_changes, public.sync_field_history from public, anon, authenticated, service_role;
grant select on table public.sync_heads, public.sync_devices, public.sync_receipts, public.sync_records,
  public.sync_changes, public.sync_field_history to authenticated;

alter table public.sync_heads enable row level security;
alter table public.sync_devices enable row level security;
alter table public.sync_receipts enable row level security;
alter table public.sync_records enable row level security;
alter table public.sync_changes enable row level security;
alter table public.sync_field_history enable row level security;

create policy sync_heads_parent_read on public.sync_heads for select to authenticated using (private.is_child_parent(child_id));
create policy sync_devices_parent_read on public.sync_devices for select to authenticated using (private.is_child_parent(child_id));
create policy sync_receipts_parent_read on public.sync_receipts for select to authenticated using (private.is_child_parent(child_id));
create policy sync_records_parent_read on public.sync_records for select to authenticated using (private.is_child_parent(child_id));
create policy sync_changes_parent_read on public.sync_changes for select to authenticated using (private.is_child_parent(child_id));
create policy sync_field_history_parent_read on public.sync_field_history for select to authenticated using (private.is_child_parent(child_id));

-- ---------------------------------------------------------------------------------------------
-- The closed allow-list. Identical to src/sync/schema.json (parity-tested).
create function private.sync_schema() returns jsonb
language sql immutable set search_path = '' as $fn$
  select $schema${"id":"pilot-sync/1","note":"Closed allow-list for live-sync uploads (Pilot Scope section 3; Learning Engine section 6). One operation per committed local change; every object is closed, so unknown keys, wrong forms (the pack case `observed`), item/material `rationale` and `provenance`, the parent PIN/hash, worksheets, copied source questions, school/teacher details and device-only metadata are rejected. Practice text is bounded per field; descriptive pack fields are short single-line text. Stages, due dates and unlocks are never uploaded. The same descriptor is embedded in the database migration and parity-tested.","limits":{"op_bytes":1572864,"request_bytes":2097152,"ops_per_request":50,"changes_per_op":2000,"pull_page":500},"defs":{"id":{"type":"string","pattern":"^[a-z0-9][a-z0-9_.:-]{0,127}$"},"nullable_id":{"type":"string","pattern":"^[a-z0-9][a-z0-9_.:-]{0,127}$","nullable":true},"token":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,47}$"},"nullable_token":{"type":"string","pattern":"^[a-z][a-z0-9_]{0,47}$","nullable":true},"uuid":{"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"},"nullable_uuid":{"type":"string","pattern":"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$","nullable":true},"date":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"},"nullable_date":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}$","nullable":true},"datetime":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?(Z|[+-][0-9]{2}:[0-9]{2})$"},"nullable_datetime":{"type":"string","pattern":"^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,6})?(Z|[+-][0-9]{2}:[0-9]{2})$","nullable":true},"timezone":{"type":"string","pattern":"^[A-Za-z_]{1,32}(/[A-Za-z0-9_+-]{1,32}){0,2}$"},"subject":{"type":"string","enum":["chinese","english","mathematics","science"]},"course":{"type":"string","enum":["p2_chinese","p2_higher_chinese","p3_chinese","p3_higher_chinese","p2_english","p3_english","p2_mathematics","p3_science"]},"count":{"type":"integer","minimum":0,"maximum":100000},"position":{"type":"integer","minimum":0,"maximum":200},"item_version":{"type":"integer","minimum":1,"maximum":100000},"nullable_item_version":{"type":"integer","minimum":1,"maximum":100000,"nullable":true},"x":{"type":"integer","minimum":6,"maximum":20},"stage":{"type":"string","enum":["acquisition","exact","similar","generic","delayed_review"]},"nullable_stage":{"type":"string","enum":["acquisition","exact","similar","generic","delayed_review"],"nullable":true},"role":{"type":"string","enum":["material_question","repair","delayed_review","general_practice","acquisition_test","replacement"]},"format_class":{"type":"string","enum":["high_option","low_option"]},"id_list":{"type":"array","maxItems":60,"items":{"$ref":"id"}},"stamp":{"type":"object","required":["t","c","d"],"properties":{"t":{"type":"integer","minimum":0,"maximum":9999999999999},"c":{"type":"integer","minimum":0,"maximum":1000000},"d":{"$ref":"uuid"}}},"short_text":{"type":"string","minLength":1,"maxLength":48,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"(19|20)[0-9]{2}-[01][0-9]-[0-3][0-9]|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"case_text":{"type":"string","minLength":1,"maxLength":80,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"(19|20)[0-9]{2}-[01][0-9]-[0-3][0-9]|[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"pack_token":{"type":"string","pattern":"^[a-z0-9][a-z0-9_.:-]{0,79}$"},"plan_id":{"type":"string","pattern":"^[a-z0-9][a-z0-9_.:-]{0,160}$"},"option_id":{"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,31}$"},"pack_course":{"type":"string","enum":["p2_chinese","p2_higher_chinese","p3_chinese","p3_higher_chinese"]},"pack_courses":{"type":"array","maxItems":8,"items":{"$ref":"pack_course"}},"ref_list":{"type":"array","maxItems":64,"items":{"$ref":"id"}},"prompt":{"type":"string","maxLength":400,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"blanks":{"type":"array","maxItems":40,"items":{"type":"object","required":["id","question_id"],"properties":{"id":{"$ref":"option_id"},"question_id":{"$ref":"id"}}}},"annotations":{"type":"array","maxItems":40,"items":{"type":"object","required":["id","text","pinyin"],"properties":{"id":{"$ref":"option_id"},"text":{"type":"string","maxLength":16,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"pinyin":{"type":"string","maxLength":48,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"}}}},"plan":{"type":"object","required":["id","mode","stages","success_rule"],"properties":{"id":{"$ref":"plan_id"},"mode":{"type":"string","enum":["external_writing","external_speaking"]},"stages":{"type":"object","required":["exact","similar","generic"],"properties":{"exact":{"type":"object","required":["prompt","verification","automatically_scored"],"properties":{"prompt":{"$ref":"prompt"},"verification":{"type":"string","enum":["parent_observation"]},"automatically_scored":{"type":"boolean","enum":[false]}}},"similar":{"type":"object","required":["prompt","verification","automatically_scored"],"properties":{"prompt":{"$ref":"prompt"},"verification":{"type":"string","enum":["parent_observation"]},"automatically_scored":{"type":"boolean","enum":[false]}}},"generic":{"type":"object","required":["prompt","verification","automatically_scored"],"properties":{"prompt":{"$ref":"prompt"},"verification":{"type":"string","enum":["parent_observation"]},"automatically_scored":{"type":"boolean","enum":[false]}}}}},"success_rule":{"type":"string","maxLength":1200,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"}}},"pins":{"type":"array","maxItems":200,"items":{"type":"object","required":["item_id","version"],"properties":{"item_id":{"$ref":"id"},"version":{"$ref":"item_version"}}}},"objective_route":{"type":"object","required":["mode","progress_target_ref","batch_id","batch_version","content_state","stages","ready_for_runtime"],"properties":{"mode":{"type":"string","enum":["objective"]},"progress_target_ref":{"$ref":"id"},"batch_id":{"$ref":"id"},"batch_version":{"$ref":"item_version"},"content_state":{"$ref":"pack_token"},"stages":{"type":"object","required":["exact","similar","generic"],"properties":{"exact":{"$ref":"pins"},"similar":{"$ref":"pins"},"generic":{"$ref":"pins"}}},"ready_for_runtime":{"type":"boolean"}}},"external_route":{"type":"object","required":["mode","plan"],"properties":{"mode":{"type":"string","enum":["external"]},"plan":{"$ref":"plan"}}},"register_case":{"type":"object","required":["id","target","observation_type","review_status","cause","source_interpretation_uncertain","correction_status","route"],"properties":{"id":{"type":"string","pattern":"^O[0-9]{3}$"},"target":{"$ref":"case_text"},"observation_type":{"type":"string","enum":["character","word","pinyin","reading","writing","speaking"]},"review_status":{"type":"string","enum":["parent_accepted"]},"cause":{"$ref":"short_text"},"source_interpretation_uncertain":{"type":"boolean"},"correction_status":{"$ref":"short_text"},"route":{"anyOf":[{"$ref":"objective_route"},{"$ref":"external_route"}]},"production_followup":{"$ref":"plan"}}},"pack_item":{"type":"object","required":["id","version","courses","target_refs","family","format","stem","options","correct_option_id","hint","explanation","material_id","stage","blanks","annotations","blank_ref"],"properties":{"id":{"$ref":"id"},"version":{"$ref":"item_version"},"courses":{"$ref":"pack_courses"},"outcome_refs":{"$ref":"ref_list"},"target_refs":{"$ref":"ref_list"},"repair_target_refs":{"type":"array","nullable":true,"maxItems":64,"items":{"$ref":"id"}},"family":{"$ref":"pack_token"},"format":{"type":"string","enum":["mcq_4plus"]},"stem":{"type":"string","maxLength":600,"pattern":"^[^\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"options":{"type":"array","maxItems":12,"items":{"type":"object","required":["id","text"],"properties":{"id":{"$ref":"option_id"},"text":{"type":"string","maxLength":200,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"}}}},"correct_option_id":{"$ref":"option_id"},"hint":{"type":"string","maxLength":400,"pattern":"^[^\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"explanation":{"type":"string","maxLength":800,"pattern":"^[^\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"material_id":{"$ref":"nullable_id"},"stage":{"type":"string","nullable":true,"enum":["exact","similar","generic"]},"asset_refs":{"$ref":"ref_list"},"blanks":{"$ref":"blanks"},"annotations":{"$ref":"annotations"},"blank_ref":{"type":"string","nullable":true,"pattern":"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,31}$"}}},"pack_material":{"type":"object","required":["id","version","courses","kind","title","body","question_ids","blanks","annotations"],"properties":{"id":{"$ref":"id"},"version":{"$ref":"item_version"},"courses":{"$ref":"pack_courses"},"kind":{"$ref":"pack_token"},"title":{"type":"string","maxLength":120,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"body":{"type":"string","maxLength":4000,"pattern":"^[^\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"question_ids":{"$ref":"ref_list"},"blanks":{"$ref":"blanks"},"annotations":{"$ref":"annotations"},"outcome_refs":{"$ref":"ref_list"},"asset_refs":{"$ref":"ref_list"}}},"pack_group":{"type":"object","required":["id","target_refs","item_ids"],"properties":{"id":{"$ref":"id"},"version":{"$ref":"item_version"},"label_zh":{"type":"string","maxLength":64,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"label_en":{"type":"string","maxLength":120,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"courses":{"$ref":"pack_courses"},"target_refs":{"type":"array","maxItems":400,"items":{"$ref":"id"}},"item_ids":{"type":"array","maxItems":1000,"items":{"$ref":"id"}}}},"pack_batch":{"type":"object","required":["batch_id","version","status","curriculum_manifest_version","materials","items","groups"],"properties":{"batch_id":{"$ref":"id"},"version":{"$ref":"item_version"},"status":{"$ref":"pack_token"},"curriculum_manifest_version":{"$ref":"pack_token"},"review_characters_version":{"$ref":"pack_token"},"materials":{"type":"array","maxItems":500,"items":{"$ref":"pack_material"}},"items":{"type":"array","maxItems":3000,"items":{"$ref":"pack_item"}},"groups":{"type":"array","maxItems":500,"items":{"$ref":"pack_group"}}}},"private_target":{"type":"object","required":["id","course","kind","label_zh","assessed_skill"],"properties":{"id":{"$ref":"id"},"course":{"$ref":"pack_course"},"outcome_ref":{"$ref":"id"},"kind":{"type":"string","enum":["word","language_point","reading_skill"]},"label_zh":{"type":"string","maxLength":64,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"},"assessed_skill":{"$ref":"short_text"},"word":{"type":"string","maxLength":24,"pattern":"^[^\\r\\n\\t\\u0001-\\u0008\\u000b\\u000c\\u000e-\\u001f\\u007f]*$","notPattern":"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\\.[A-Za-z]"}}},"pack":{"type":"object","required":["schema_version","pack_id","course","register","corrective_batches","private_targets"],"properties":{"schema_version":{"type":"string","enum":["turtle-private-pack/1"]},"pack_id":{"$ref":"id"},"course":{"type":"string","enum":["p2_chinese","p2_higher_chinese"]},"register":{"type":"object","required":["schema_version","register_id","course","policy","review_complete","cases"],"properties":{"schema_version":{"type":"string","enum":["anonymous-mistake-register/1"]},"register_id":{"$ref":"id"},"course":{"type":"string","enum":["p2_chinese","p2_higher_chinese"]},"policy":{"$ref":"short_text"},"review_complete":{"type":"boolean","enum":[true]},"cases":{"type":"array","maxItems":2000,"items":{"$ref":"register_case"}}}},"corrective_batches":{"type":"array","maxItems":20,"items":{"$ref":"pack_batch"}},"private_targets":{"type":"array","maxItems":2000,"items":{"$ref":"private_target"}}}}},"operation":{"type":"object","required":["op_id","device_id","device_seq","stamp","changes"],"properties":{"op_id":{"$ref":"uuid"},"device_id":{"$ref":"uuid"},"device_seq":{"type":"integer","minimum":1,"maximum":9007199254740991},"stamp":{"$ref":"stamp"},"changes":{"type":"array","maxItems":2000,"items":{"type":"object","required":["kind","key"],"properties":{"kind":{"type":"string","enum":["answer_event","presentation","task","completion","checkpoint","story_state","target","amendment","flag","suspension","exposure","rest_day","setting","timezone_change","guards","content_version","pack_version","active_pack","case_link","production_event"]},"key":{"type":"string","pattern":"^[A-Za-z0-9][A-Za-z0-9_.:@+*/-]{0,199}$"},"value":{"type":"object","open":true},"deleted":{"type":"boolean","enum":[true]}}}}}},"kinds":{"answer_event":{"class":"add_only","key":"id","value":{"type":"object","required":["id","presentation_id","local_seq","phase","assistance","response","correct","at"],"properties":{"id":{"$ref":"id"},"presentation_id":{"$ref":"id"},"local_seq":{"type":"integer","minimum":0,"maximum":10000000},"phase":{"type":"string","enum":["first","retry","correction"]},"assistance":{"type":"string","enum":["none","hint","worked_steps","answer_and_explanation"]},"response":{"type":"object","required":["kind","option_ids","pairs"],"properties":{"kind":{"type":"string","enum":["single","ordered","matching","word_bank"]},"option_ids":{"type":"array","maxItems":16,"items":{"$ref":"id"}},"pairs":{"type":"array","maxItems":16,"items":{"type":"object","required":["left","right"],"properties":{"left":{"$ref":"id"},"right":{"$ref":"id"}}}}}},"correct":{"type":"boolean"},"at":{"$ref":"datetime"}}}},"presentation":{"class":"presentation","key":"id","value":{"type":"object","required":["id","task_id","position","item_id","item_version","role","material_ref","target_ref","stage","format_class","first_response_eligible","prior_exposures","novel_context","presented_at","status"],"properties":{"id":{"$ref":"id"},"task_id":{"$ref":"id"},"position":{"$ref":"position"},"item_id":{"$ref":"id"},"item_version":{"$ref":"item_version"},"role":{"$ref":"role"},"material_ref":{"$ref":"nullable_id"},"target_ref":{"$ref":"nullable_id"},"stage":{"$ref":"nullable_stage"},"format_class":{"$ref":"format_class"},"first_response_eligible":{"type":"boolean"},"prior_exposures":{"$ref":"count"},"novel_context":{"type":"boolean"},"presented_at":{"$ref":"datetime"},"status":{"type":"string","enum":["presented","answered","corrected","flagged_replaced","invalidated"]}}}},"task":{"class":"task","key":"id","value":{"type":"object","required":["id","subject","local_date","created_at","finalised_at","x","policy_version","content_version","status","plan","planned_total","cursor","active_seconds","activity","target_aggregates"],"properties":{"id":{"$ref":"id"},"subject":{"$ref":"subject"},"local_date":{"$ref":"date"},"created_at":{"$ref":"datetime"},"finalised_at":{"$ref":"nullable_datetime"},"x":{"$ref":"x"},"policy_version":{"$ref":"id"},"content_version":{"$ref":"id"},"status":{"type":"string","enum":["active","paused","finalised"]},"plan":{"type":"object","required":["materials","slots"],"properties":{"materials":{"type":"array","maxItems":8,"items":{"type":"object","required":["material_ref","material_version","family","question_count"],"properties":{"material_ref":{"$ref":"id"},"material_version":{"$ref":"item_version"},"family":{"$ref":"token"},"question_count":{"type":"integer","minimum":1,"maximum":40}}}},"slots":{"type":"array","maxItems":100,"items":{"type":"object","required":["position","kind","material_ref","item_id","item_version","role","target_ref","stage","counts_toward_x"],"properties":{"position":{"$ref":"position"},"kind":{"type":"string","enum":["material_question","short","teaching"]},"material_ref":{"$ref":"nullable_id"},"item_id":{"$ref":"nullable_id"},"item_version":{"$ref":"nullable_item_version"},"role":{"type":"string","enum":["material_question","repair","delayed_review","general_practice","acquisition_test","replacement","teaching"]},"target_ref":{"$ref":"nullable_id"},"stage":{"$ref":"nullable_stage"},"counts_toward_x":{"type":"boolean"}}}}}},"planned_total":{"type":"integer","minimum":0,"maximum":100},"cursor":{"type":"integer","minimum":0,"maximum":100},"active_seconds":{"type":"integer","minimum":0,"maximum":86400},"activity":{"type":"array","maxItems":2000,"items":{"type":"object","required":["state","at"],"properties":{"state":{"type":"string","enum":["active","paused","backgrounded","idle","closed"]},"at":{"$ref":"datetime"}}}},"target_aggregates":{"type":"array","maxItems":0}}}},"completion":{"class":"add_only","key":"completion","value":{"type":"object","required":["subject","local_date","task_id","reason","answered"],"properties":{"subject":{"$ref":"subject"},"local_date":{"$ref":"date"},"task_id":{"$ref":"nullable_id"},"reason":{"type":"string","enum":["full","shortened_no_eligible_content","zero_eligible","replacements_exhausted"]},"answered":{"type":"integer","minimum":0,"maximum":100}}}},"checkpoint":{"class":"checkpoint","key":"id","value":{"type":"object","required":["id","task_id","kind","local_date","story_seq","state","delivered_at"],"properties":{"id":{"$ref":"id"},"task_id":{"$ref":"nullable_id"},"kind":{"type":"string","enum":["halfway","completion","combined","exploration"]},"local_date":{"$ref":"date"},"story_seq":{"type":"integer","minimum":0,"maximum":100000},"state":{"type":"string","enum":["pending","delivered"]},"delivered_at":{"$ref":"nullable_datetime"}}}},"story_state":{"class":"grow","key":"story","value":{"type":"object","required":["next_story_seq","chapter","world_flags","ended"],"properties":{"next_story_seq":{"type":"integer","minimum":0,"maximum":100000},"chapter":{"type":"integer","minimum":0,"maximum":10000},"world_flags":{"type":"array","maxItems":500,"items":{"$ref":"token"}},"ended":{"type":"boolean"}}}},"target":{"class":"target","key":"id","value":{"type":"object","required":["id","subject","course","target_kind","knowledge_point_ref","target_value","assessed_skill","error_type","mapping_status","verification","status","verified_at","replaces","observations"],"properties":{"id":{"$ref":"id"},"subject":{"$ref":"subject"},"course":{"$ref":"course"},"target_kind":{"type":"string","enum":["character","word","language_point","reading_skill","science_concept","math_relationship","math_method","vocabulary","grammar"]},"knowledge_point_ref":{"$ref":"nullable_id"},"target_value":{"type":"string","pattern":"^[A-Za-z0-9\\u3400-\\u4dbf\\u4e00-\\u9fff' -]{1,24}$","nullable":true},"assessed_skill":{"$ref":"nullable_token"},"error_type":{"$ref":"token"},"mapping_status":{"type":"string","enum":["mapped","pending_content"]},"verification":{"type":"string","enum":["verified","uncertain"]},"status":{"type":"string","enum":["active","superseded","invalidated"]},"verified_at":{"$ref":"nullable_datetime"},"replaces":{"$ref":"nullable_id"},"observations":{"type":"array","maxItems":500,"items":{"type":"object","required":["id","source_type","observed_on","recorded_on","instance_ref","batch_ref","recurrence","invalidated"],"properties":{"id":{"$ref":"id"},"source_type":{"type":"string","enum":["schoolwork","home_practice","external_assessment","other_reviewed_work","app_practice"]},"observed_on":{"$ref":"date"},"recorded_on":{"$ref":"date"},"instance_ref":{"$ref":"id"},"batch_ref":{"$ref":"nullable_id"},"recurrence":{"type":"string","enum":["first","independent","duplicate"]},"invalidated":{"type":"boolean"}}}}}}},"amendment":{"class":"add_only","key":"id","value":{"type":"object","required":["id","at","actor","kind","refs","replacement_ref","reason","reducer_revision"],"properties":{"id":{"$ref":"id"},"at":{"$ref":"datetime"},"actor":{"type":"string","enum":["parent"]},"kind":{"type":"string","enum":["amend_target","invalidate_target","invalidate_observation","invalidate_presentation","restore_item","disable_item"]},"refs":{"type":"array","maxItems":50,"items":{"$ref":"id"}},"replacement_ref":{"$ref":"nullable_id"},"reason":{"type":"string","enum":["wrong_target","wrong_skill","wrong_error_type","wrong_date","duplicate","question_problem","not_a_mistake"]},"reducer_revision":{"type":"integer","minimum":1,"maximum":100000}}}},"flag":{"class":"flag","key":"flag","value":{"type":"object","required":["presentation_id","item_id","item_version","reason","flagged_at","status","decided_at"],"properties":{"presentation_id":{"$ref":"nullable_id"},"item_id":{"$ref":"id"},"item_version":{"$ref":"item_version"},"reason":{"type":"string","enum":["answer_looks_wrong","question_unclear","too_hard","other"]},"flagged_at":{"$ref":"datetime"},"status":{"type":"string","enum":["open","restored","disabled"]},"decided_at":{"$ref":"nullable_datetime"}}}},"suspension":{"class":"editable","key":"suspension","value":{"type":"object","required":["item_id","item_version","scope","since","restored_at"],"properties":{"item_id":{"$ref":"id"},"item_version":{"$ref":"nullable_item_version"},"scope":{"type":"string","enum":["child","version"]},"since":{"$ref":"datetime"},"restored_at":{"$ref":"nullable_datetime"}}}},"exposure":{"class":"grow","key":"exposure","value":{"type":"object","required":["item_id","first_presented_on","last_presented_on","times"],"properties":{"item_id":{"$ref":"id"},"first_presented_on":{"$ref":"date"},"last_presented_on":{"$ref":"date"},"times":{"$ref":"count"}}}},"rest_day":{"class":"editable","key":"rest_day","deletable":true,"value":{"type":"object","required":["date"],"properties":{"date":{"$ref":"date"}}}},"setting":{"class":"editable","key":"setting","value":{"anyOf":[{"type":"object","required":["timezone"],"properties":{"timezone":{"$ref":"timezone"}}},{"type":"object","required":["ui_language"],"properties":{"ui_language":{"type":"string","enum":["zh","en"]}}},{"type":"object","required":["x","changed_at"],"properties":{"x":{"$ref":"x"},"changed_at":{"$ref":"nullable_datetime"}}}]}},"timezone_change":{"class":"add_only","key":"changed_at","value":{"type":"object","required":["from_timezone","timezone","changed_at"],"properties":{"from_timezone":{"$ref":"timezone"},"timezone":{"$ref":"timezone"},"changed_at":{"$ref":"datetime"}}}},"guards":{"class":"grow","key":"guards","value":{"type":"object","required":["last_finalised_date","last_timezone_change_at","max_local_date_seen"],"properties":{"last_finalised_date":{"$ref":"nullable_date"},"last_timezone_change_at":{"$ref":"nullable_datetime"},"max_local_date_seen":{"$ref":"nullable_date"}}}},"content_version":{"class":"editable","key":"subject","value":{"type":"object","required":["subject","catalogue_version","manifest_version"],"properties":{"subject":{"$ref":"subject"},"catalogue_version":{"$ref":"id"},"manifest_version":{"$ref":"nullable_id"}}}},"pack_version":{"class":"add_only","key":"version_ref","value":{"type":"object","required":["version_ref","pack"],"properties":{"version_ref":{"type":"string","pattern":"^[a-z0-9][a-z0-9_.:-]{0,127}@[0-9a-f]{16}$"},"pack":{"$ref":"pack"}}}},"active_pack":{"class":"editable","key":"active","value":{"type":"object","required":["version_ref"],"properties":{"version_ref":{"type":"string","pattern":"^[a-z0-9][a-z0-9_.:-]{0,127}@[0-9a-f]{16}$"}}}},"case_link":{"class":"editable","key":"case_id","deletable":true,"value":{"type":"object","required":["case_id","mode","target_ref","engine_target_id","plan_id","shared_with"],"properties":{"case_id":{"type":"string","pattern":"^O[0-9]{3}$"},"mode":{"type":"string","enum":["objective","external"]},"target_ref":{"$ref":"nullable_id"},"engine_target_id":{"$ref":"nullable_id"},"plan_id":{"type":"string","nullable":true,"pattern":"^[a-z0-9][a-z0-9_.:-]{0,160}$"},"shared_with":{"type":"array","maxItems":2000,"items":{"type":"string","pattern":"^O[0-9]{3}$"}}}}},"production_event":{"class":"add_only","key":"id","value":{"type":"object","required":["id","plan_id","stage","observed_on","mode","result","recorded_at"],"properties":{"id":{"$ref":"id"},"plan_id":{"$ref":"plan_id"},"stage":{"type":"string","enum":["exact","similar","generic","delayed_review"]},"observed_on":{"$ref":"date"},"mode":{"type":"string","enum":["independent","supported"]},"result":{"type":"string","enum":["correct","not_yet"]},"recorded_at":{"$ref":"datetime"}}}}}}$schema$::jsonb
$fn$;

-- Structural validator. Same keywords and semantics as src/sync/validate.ts `check`.
create function private.sync_node_valid(p_defs jsonb, p_node jsonb, p_value jsonb, p_depth integer)
returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_type text;
  v_key text;
  v_child jsonb;
  v_elem jsonb;
  v_num numeric;
  v_text text;
begin
  if p_depth > 32 or p_node is null then
    return false;
  end if;
  if p_node ? '$ref' then
    if not (p_defs ? (p_node ->> '$ref')) then
      return false;
    end if;
    return private.sync_node_valid(p_defs, p_defs -> (p_node ->> '$ref'), p_value, p_depth + 1);
  end if;
  if p_node ? 'anyOf' then
    for v_child in select value from jsonb_array_elements(p_node -> 'anyOf') loop
      if private.sync_node_valid(p_defs, v_child, p_value, p_depth + 1) then
        return true;
      end if;
    end loop;
    return false;
  end if;
  if p_value is null or jsonb_typeof(p_value) = 'null' then
    return coalesce((p_node ->> 'nullable')::boolean, false);
  end if;
  v_type := p_node ->> 'type';
  if v_type = 'object' then
    if jsonb_typeof(p_value) <> 'object' then
      return false;
    end if;
    if coalesce((p_node ->> 'open')::boolean, false) then
      return true;
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
      if p_value ? v_key and not private.sync_node_valid(p_defs, v_child, p_value -> v_key, p_depth + 1) then
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
      if not private.sync_node_valid(p_defs, p_node -> 'items', v_elem, p_depth + 1) then
        return false;
      end if;
    end loop;
    return true;
  elsif v_type = 'string' then
    if jsonb_typeof(p_value) <> 'string' then
      return false;
    end if;
    v_text := p_value #>> '{}';
    if p_node ? 'enum' and not ((p_node -> 'enum') ? v_text) then
      return false;
    end if;
    if p_node ? 'minLength' and char_length(v_text) < (p_node ->> 'minLength')::integer then
      return false;
    end if;
    if p_node ? 'maxLength' and char_length(v_text) > (p_node ->> 'maxLength')::integer then
      return false;
    end if;
    if p_node ? 'pattern' and not (v_text ~ (p_node ->> 'pattern')) then
      return false;
    end if;
    if p_node ? 'notPattern' and v_text ~ (p_node ->> 'notPattern') then
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
    return jsonb_typeof(p_value) = 'boolean' and (not (p_node ? 'enum') or (p_node -> 'enum') @> jsonb_build_array(p_value));
  end if;
  return false;
end
$$;

-- The key a change must use. Mirrors keyFor/settingMatches in src/sync/validate.ts.
create function private.sync_key_valid(p_kind text, p_key text, p_value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_rule text := private.sync_schema() -> 'kinds' -> p_kind ->> 'key';
  v_keys text;
begin
  if v_rule = 'setting' then
    select string_agg(k, ',' order by k) into v_keys from jsonb_object_keys(p_value) k;
    return case
      when p_key = 'timezone' then v_keys = 'timezone'
      when p_key = 'ui_language' then v_keys = 'ui_language'
      when p_key in ('x:chinese', 'x:english', 'x:mathematics', 'x:science') then v_keys = 'changed_at,x'
      else false end;
  end if;
  return p_key = case v_rule
    when 'id' then p_value ->> 'id'
    when 'completion' then (p_value ->> 'subject') || ':' || coalesce(p_value ->> 'task_id', p_value ->> 'local_date')
    when 'story' then 'story'
    when 'guards' then 'guards'
    when 'active' then 'active'
    when 'flag' then (p_value ->> 'item_id') || '@' || (p_value ->> 'item_version') || ':' || coalesce(p_value ->> 'presentation_id', p_value ->> 'flagged_at')
    when 'suspension' then (p_value ->> 'item_id') || '@' || coalesce(p_value ->> 'item_version', '*')
    when 'exposure' then p_value ->> 'item_id'
    when 'rest_day' then p_value ->> 'date'
    when 'changed_at' then p_value ->> 'changed_at'
    when 'subject' then p_value ->> 'subject'
    when 'version_ref' then p_value ->> 'version_ref'
    when 'case_id' then p_value ->> 'case_id'
    else null end;
end
$$;

create function private.sync_change_valid(p_change jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare
  v_schema jsonb := private.sync_schema();
  v_spec jsonb;
begin
  if jsonb_typeof(p_change) <> 'object' or jsonb_typeof(p_change -> 'kind') <> 'string' or jsonb_typeof(p_change -> 'key') <> 'string' then
    return false;
  end if;
  v_spec := v_schema -> 'kinds' -> (p_change ->> 'kind');
  if v_spec is null then
    return false;
  end if;
  if p_change ? 'deleted' then
    return coalesce((v_spec ->> 'deletable')::boolean, false) and p_change -> 'deleted' = 'true'::jsonb and not (p_change ? 'value');
  end if;
  if jsonb_typeof(p_change -> 'value') is distinct from 'object' then
    return false;
  end if;
  return private.sync_node_valid(v_schema -> 'defs', v_spec -> 'value', p_change -> 'value', 0)
    and private.sync_key_valid(p_change ->> 'kind', p_change ->> 'key', p_change -> 'value');
end
$$;

-- Hybrid logical stamps compare as (time, counter, device id); a missing stamp always loses.
create function private.sync_stamp_gt(a jsonb, b jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select b is null or jsonb_typeof(b) = 'null'
    or ((a ->> 't')::bigint, (a ->> 'c')::bigint, a ->> 'd') > ((b ->> 't')::bigint, (b ->> 'c')::bigint, b ->> 'd')
$$;

create function private.sync_status_rank(p_status text) returns integer
language sql immutable set search_path = '' as $$
  select case p_status when 'presented' then 0 when 'answered' then 1 when 'corrected' then 2
    when 'flagged_replaced' then 3 when 'invalidated' then 3 else -1 end
$$;

create function private.sync_greatest_text(a jsonb, b jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select case
    when a is null or jsonb_typeof(a) = 'null' then coalesce(b, 'null'::jsonb)
    when b is null or jsonb_typeof(b) = 'null' then a
    when (b #>> '{}') > (a #>> '{}') then b else a end
$$;

create function private.sync_history(p_child uuid, p_kind text, p_key text, p_field text, p_value jsonb, p_stamp jsonb, p_winner jsonb, p_op uuid)
returns void language sql set search_path = '' as $$
  insert into public.sync_field_history (child_id, kind, key, field, replaced_value, replaced_stamp, winning_stamp, op_id)
  values (p_child, p_kind, p_key, p_field, p_value, p_stamp, p_winner, p_op)
$$;

-- Merge one change into the live record. Rules per kind (Learning Engine §6):
--   add_only: first accepted value kept; never overwritten.
--   presentation: identity kept; status only moves forward (presented < answered < corrected < replaced).
--   task: the first accepted frozen plan wins; progress moves forward (cursor, active time, finalisation, activity).
--   checkpoint: delivered never reverts. grow: story meta, exposure and calendar guards only increase.
--   target: identity kept; observations add-only by id; mapping status is an editable field.
--   flag: identity kept; the parent decision is an editable field.
--   editable: the value with the higher server-accepted stamp wins; the other is kept in field history.
create function private.sync_apply_change(p_child uuid, p_change jsonb, p_stamp jsonb, p_op uuid)
returns void language plpgsql set search_path = '' as $$
declare
  v_kind text := p_change ->> 'kind';
  v_key text := p_change ->> 'key';
  v_class text := private.sync_schema() -> 'kinds' -> v_kind ->> 'class';
  v_new jsonb := p_change -> 'value';
  v_del boolean := coalesce((p_change ->> 'deleted')::boolean, false);
  v_old public.sync_records%rowtype;
  v_found boolean;
  v_value jsonb;
  v_deleted boolean := false;
  v_stamps jsonb;
  v_field text;
  v_seq bigint;
  v_outcome text;
begin
  select * into v_old from public.sync_records r where r.child_id = p_child and r.kind = v_kind and r.key = v_key for update;
  v_found := found;
  if not v_found then
    v_value := v_new;
    v_deleted := v_del;
    v_stamps := case when v_class in ('editable', 'target', 'flag') then jsonb_build_object(
      case v_class when 'target' then 'mapping_status' when 'flag' then 'decision' else 'value' end, p_stamp) else '{}'::jsonb end;
  else
    v_value := v_old.value;
    v_deleted := v_old.deleted;
    v_stamps := v_old.stamps;
    if v_class = 'add_only' then
      null; -- immutable: the first accepted value stays
    elsif v_class = 'presentation' then
      if private.sync_status_rank(v_new ->> 'status') > private.sync_status_rank(v_value ->> 'status') then
        v_value := jsonb_set(v_value, '{status}', v_new -> 'status');
      end if;
    elsif v_class = 'task' then
      v_value := v_value
        || jsonb_build_object('cursor', greatest((v_value ->> 'cursor')::integer, (v_new ->> 'cursor')::integer))
        || jsonb_build_object('active_seconds', greatest((v_value ->> 'active_seconds')::integer, (v_new ->> 'active_seconds')::integer))
        || jsonb_build_object('status', case when v_value ->> 'status' = 'finalised' or v_new ->> 'status' = 'finalised' then 'finalised' else v_new ->> 'status' end)
        || jsonb_build_object('finalised_at', case when jsonb_typeof(v_value -> 'finalised_at') = 'string' then v_value -> 'finalised_at' else v_new -> 'finalised_at' end)
        || jsonb_build_object('activity', coalesce((
          select jsonb_agg(a order by a ->> 'at', a ->> 'state') from (
            select a from (
              select distinct x.a from jsonb_array_elements((v_value -> 'activity') || (v_new -> 'activity')) as x(a)
            ) d order by a ->> 'at' desc, a ->> 'state' desc limit 2000
          ) l), '[]'::jsonb));
    elsif v_class = 'checkpoint' then
      if v_new ->> 'state' = 'delivered' and v_value ->> 'state' <> 'delivered' then
        v_value := v_value || jsonb_build_object('state', 'delivered', 'delivered_at', v_new -> 'delivered_at');
      end if;
    elsif v_class = 'grow' then
      if v_kind = 'story_state' then
        v_value := jsonb_build_object(
          'next_story_seq', greatest((v_value ->> 'next_story_seq')::integer, (v_new ->> 'next_story_seq')::integer),
          'chapter', greatest((v_value ->> 'chapter')::integer, (v_new ->> 'chapter')::integer),
          'world_flags', coalesce((select jsonb_agg(f order by f) from (
            select distinct y.f from jsonb_array_elements_text((v_value -> 'world_flags') || (v_new -> 'world_flags')) as y(f) order by y.f limit 500) u), '[]'::jsonb),
          'ended', (v_value ->> 'ended')::boolean or (v_new ->> 'ended')::boolean);
      elsif v_kind = 'exposure' then
        v_value := v_value || jsonb_build_object(
          'first_presented_on', least(v_value ->> 'first_presented_on', v_new ->> 'first_presented_on'),
          'last_presented_on', greatest(v_value ->> 'last_presented_on', v_new ->> 'last_presented_on'),
          'times', greatest((v_value ->> 'times')::integer, (v_new ->> 'times')::integer));
      elsif v_kind = 'guards' then
        v_value := jsonb_build_object(
          'last_finalised_date', private.sync_greatest_text(v_value -> 'last_finalised_date', v_new -> 'last_finalised_date'),
          'last_timezone_change_at', private.sync_greatest_text(v_value -> 'last_timezone_change_at', v_new -> 'last_timezone_change_at'),
          'max_local_date_seen', private.sync_greatest_text(v_value -> 'max_local_date_seen', v_new -> 'max_local_date_seen'));
      end if;
    elsif v_class = 'target' then
      v_value := jsonb_set(v_value, '{observations}', (v_value -> 'observations') || coalesce((
        select jsonb_agg(x.o order by x.n) from jsonb_array_elements(v_new -> 'observations') with ordinality as x(o, n)
        where not exists (select 1 from jsonb_array_elements(v_value -> 'observations') as z(e) where z.e ->> 'id' = x.o ->> 'id')), '[]'::jsonb));
      if v_new -> 'mapping_status' <> v_value -> 'mapping_status' then
        if private.sync_stamp_gt(p_stamp, v_stamps -> 'mapping_status') then
          perform private.sync_history(p_child, v_kind, v_key, 'mapping_status', v_value -> 'mapping_status', v_stamps -> 'mapping_status', p_stamp, p_op);
          v_value := jsonb_set(v_value, '{mapping_status}', v_new -> 'mapping_status');
          v_stamps := v_stamps || jsonb_build_object('mapping_status', p_stamp);
        else
          perform private.sync_history(p_child, v_kind, v_key, 'mapping_status', v_new -> 'mapping_status', p_stamp, v_stamps -> 'mapping_status', p_op);
        end if;
      end if;
    elsif v_class = 'flag' then
      if jsonb_build_array(v_new -> 'status', v_new -> 'decided_at') <> jsonb_build_array(v_value -> 'status', v_value -> 'decided_at') then
        if private.sync_stamp_gt(p_stamp, v_stamps -> 'decision') then
          perform private.sync_history(p_child, v_kind, v_key, 'decision',
            jsonb_build_object('status', v_value -> 'status', 'decided_at', v_value -> 'decided_at'), v_stamps -> 'decision', p_stamp, p_op);
          v_value := v_value || jsonb_build_object('status', v_new -> 'status', 'decided_at', v_new -> 'decided_at');
          v_stamps := v_stamps || jsonb_build_object('decision', p_stamp);
        else
          perform private.sync_history(p_child, v_kind, v_key, 'decision',
            jsonb_build_object('status', v_new -> 'status', 'decided_at', v_new -> 'decided_at'), p_stamp, v_stamps -> 'decision', p_op);
        end if;
      end if;
    elsif v_class = 'editable' then
      v_field := 'value';
      if v_del is distinct from v_old.deleted or v_new is distinct from v_old.value then
        if private.sync_stamp_gt(p_stamp, v_stamps -> v_field) then
          perform private.sync_history(p_child, v_kind, v_key, v_field, v_old.value, v_stamps -> v_field, p_stamp, p_op);
          v_value := case when v_del then null else v_new end;
          v_deleted := v_del;
          v_stamps := v_stamps || jsonb_build_object(v_field, p_stamp);
        else
          perform private.sync_history(p_child, v_kind, v_key, v_field, v_new, p_stamp, v_stamps -> v_field, p_op);
        end if;
      end if;
    end if;
  end if;
  if v_deleted then
    v_value := null;
  end if;

  -- Every touched record gets a new change number, so the uploading device re-reads the merged value.
  update public.sync_heads set change_seq = change_seq + 1, updated_at = now() where child_id = p_child returning change_seq into v_seq;
  v_outcome := case when not v_found then (case when v_deleted then 'deleted' else 'created' end)
    when v_deleted and not v_old.deleted then 'deleted'
    when v_value is not distinct from v_old.value and v_stamps = v_old.stamps then 'unchanged' else 'merged' end;
  insert into public.sync_records (child_id, kind, key, value, deleted, stamps, change_seq)
  values (p_child, v_kind, v_key, v_value, v_deleted, v_stamps, v_seq)
  on conflict (child_id, kind, key) do update
    set value = excluded.value, deleted = excluded.deleted, stamps = excluded.stamps, change_seq = excluded.change_seq, updated_at = now();
  insert into public.sync_changes (child_id, change_seq, kind, key, op_id, outcome) values (p_child, v_seq, v_kind, v_key, p_op, v_outcome);
end
$$;

-- References a change makes must resolve within the same child (earlier operations or this one).
create function private.sync_refs_valid(p_child uuid, p_changes jsonb) returns boolean
language sql stable set search_path = '' as $$
  with c as (select value as ch from jsonb_array_elements(p_changes)),
  refs as (
    select 'presentation' as kind, ch -> 'value' ->> 'presentation_id' as key from c where ch ->> 'kind' = 'answer_event'
    union all select 'task', ch -> 'value' ->> 'task_id' from c where ch ->> 'kind' = 'presentation'
    union all select 'task', ch -> 'value' ->> 'task_id' from c where ch ->> 'kind' in ('completion', 'checkpoint') and jsonb_typeof(ch -> 'value' -> 'task_id') = 'string'
    union all select 'presentation', ch -> 'value' ->> 'presentation_id' from c where ch ->> 'kind' = 'flag' and jsonb_typeof(ch -> 'value' -> 'presentation_id') = 'string'
    union all select 'pack_version', ch -> 'value' ->> 'version_ref' from c where ch ->> 'kind' = 'active_pack'
    union all select 'target', ch -> 'value' ->> 'engine_target_id' from c where ch ->> 'kind' = 'case_link' and jsonb_typeof(ch -> 'value' -> 'engine_target_id') = 'string'
  )
  select not exists (
    select 1 from refs where not exists (
      select 1 from public.sync_records r where r.child_id = p_child and r.kind = refs.kind and r.key = refs.key and not r.deleted))
$$;

-- Apply one operation. Raises PT4xx codes without echoing content.
create function private.sync_apply_op(p_child uuid, p_op jsonb, p_uid uuid, p_now_ms bigint)
returns jsonb language plpgsql set search_path = '' as $$
declare
  v_schema jsonb := private.sync_schema();
  v_op_id uuid;
  v_device uuid;
  v_seq bigint;
  v_hash text;
  v_receipt public.sync_receipts%rowtype;
  v_last bigint;
  v_stamp jsonb;
  v_change jsonb;
  v_order text[] := array['task', 'presentation', 'answer_event', 'completion', 'checkpoint', 'story_state', 'target', 'amendment',
    'flag', 'suspension', 'exposure', 'rest_day', 'setting', 'timezone_change', 'guards', 'content_version', 'pack_version',
    'active_pack', 'case_link', 'production_event'];
begin
  if jsonb_typeof(p_op) <> 'object' or coalesce(p_op ->> 'op_id', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'invalid_operation' using errcode = 'PT422';
  end if;
  if octet_length(p_op::text) > (v_schema -> 'limits' ->> 'op_bytes')::integer then
    raise exception 'operation_too_large' using errcode = 'PT413';
  end if;
  v_op_id := (p_op ->> 'op_id')::uuid;
  v_hash := encode(sha256(convert_to(p_op::text, 'UTF8')), 'hex');
  select * into v_receipt from public.sync_receipts r where r.child_id = p_child and r.op_id = v_op_id;
  if found then
    if v_receipt.request_sha256 = v_hash then
      return jsonb_build_object('op_id', v_op_id, 'status', 'duplicate', 'stamp', v_receipt.accepted_stamp);
    end if;
    raise exception 'operation_conflict' using errcode = 'PT409';
  end if;
  if not private.sync_node_valid(v_schema -> 'defs', v_schema -> 'operation', p_op, 0) then
    raise exception 'invalid_operation' using errcode = 'PT422';
  end if;
  if p_op -> 'stamp' ->> 'd' <> p_op ->> 'device_id' or jsonb_array_length(p_op -> 'changes') = 0 then
    raise exception 'invalid_operation' using errcode = 'PT422';
  end if;
  for v_change in select value from jsonb_array_elements(p_op -> 'changes') loop
    if not private.sync_change_valid(v_change) then
      raise exception 'invalid_change' using errcode = 'PT422';
    end if;
  end loop;

  -- Per-device ordering: a new operation must come after every operation already applied from that device.
  v_device := (p_op ->> 'device_id')::uuid;
  v_seq := (p_op ->> 'device_seq')::bigint;
  select d.last_seq into v_last from public.sync_devices d where d.child_id = p_child and d.device_id = v_device for update;
  if found and v_seq <= v_last then
    raise exception 'out_of_order' using errcode = 'PT409';
  end if;
  insert into public.sync_devices (child_id, device_id, last_seq) values (p_child, v_device, v_seq)
  on conflict (child_id, device_id) do update set last_seq = excluded.last_seq, last_seen_at = now();

  -- Accepted stamp: excessively future device time is clamped once, here; retries return this stored stamp.
  v_stamp := jsonb_build_object('t', least((p_op -> 'stamp' ->> 't')::bigint, p_now_ms + 300000),
    'c', (p_op -> 'stamp' ->> 'c')::bigint, 'd', p_op -> 'stamp' ->> 'd');

  for v_change in
    select x.ch from jsonb_array_elements(p_op -> 'changes') with ordinality as x(ch, n)
    order by array_position(v_order, x.ch ->> 'kind'), x.n
  loop
    perform private.sync_apply_change(p_child, v_change, v_stamp, v_op_id);
  end loop;
  if not private.sync_refs_valid(p_child, p_op -> 'changes') then
    raise exception 'invalid_reference' using errcode = 'PT422';
  end if;

  insert into public.sync_receipts (child_id, op_id, device_id, device_seq, request_sha256, accepted_stamp, created_by)
  values (p_child, v_op_id, v_device, v_seq, v_hash, v_stamp, p_uid);
  return jsonb_build_object('op_id', v_op_id, 'status', 'applied', 'stamp', v_stamp);
end
$$;

revoke all on function private.sync_schema(), private.sync_node_valid(jsonb, jsonb, jsonb, integer),
  private.sync_key_valid(text, text, jsonb), private.sync_change_valid(jsonb), private.sync_stamp_gt(jsonb, jsonb),
  private.sync_status_rank(text), private.sync_greatest_text(jsonb, jsonb),
  private.sync_history(uuid, text, text, text, jsonb, jsonb, jsonb, uuid), private.sync_apply_change(uuid, jsonb, jsonb, uuid),
  private.sync_refs_valid(uuid, jsonb), private.sync_apply_op(uuid, jsonb, uuid, bigint)
  from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Client entry points.

-- Which child this signed-in parent may sync. Pilot: one family, one child.
create function public.sync_whoami() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('family_id', c.family_id, 'child_id', c.id) order by c.created_at, c.id)
    from public.children c join public.family_members m on m.family_id = c.family_id
    where m.user_id = auth.uid() and m.role = 'parent'), '[]'::jsonb);
end
$$;

-- Upload up to `ops_per_request` operations in device order. Each is applied in its own subtransaction; processing
-- stops at the first refused operation so later operations never jump ahead of it.
create function public.sync_push(p_child_id uuid, p_ops jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_schema jsonb := private.sync_schema();
  v_now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000);
  v_results jsonb := '[]'::jsonb;
  v_op jsonb;
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_child_id is null or p_ops is null or jsonb_typeof(p_ops) <> 'array' or jsonb_array_length(p_ops) = 0
     or jsonb_array_length(p_ops) > (v_schema -> 'limits' ->> 'ops_per_request')::integer then
    raise exception 'invalid_request' using errcode = 'PT400';
  end if;
  if not private.is_child_parent(p_child_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if octet_length(p_ops::text) > (v_schema -> 'limits' ->> 'request_bytes')::integer then
    raise exception 'request_too_large' using errcode = 'PT413';
  end if;
  -- Serialise every writer for this child; change numbers are assigned only while holding this lock.
  insert into public.sync_heads (child_id) values (p_child_id) on conflict (child_id) do nothing;
  perform 1 from public.sync_heads h where h.child_id = p_child_id for update;

  for v_op in select value from jsonb_array_elements(p_ops) loop
    begin
      v_result := private.sync_apply_op(p_child_id, v_op, v_uid, v_now_ms);
      v_results := v_results || jsonb_build_array(v_result);
    exception when sqlstate 'PT422' or sqlstate 'PT409' or sqlstate 'PT413' then
      v_results := v_results || jsonb_build_array(jsonb_build_object(
        'op_id', case when jsonb_typeof(v_op) = 'object' and coalesce(v_op ->> 'op_id', '') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
          then v_op ->> 'op_id' else null end,
        'status', 'rejected', 'code', sqlerrm));
      exit;
    end;
  end loop;
  return jsonb_build_object('server_time_ms', v_now_ms, 'results', v_results);
end
$$;

-- Download records changed after `p_cursor`, oldest change first, at most `pull_page` per call. `cursor` is the
-- next server-issued checkpoint; `more` says whether records up to `head` remain.
create function public.sync_pull(p_child_id uuid, p_cursor bigint, p_limit integer) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_page integer := (private.sync_schema() -> 'limits' ->> 'pull_page')::integer;
  v_head bigint;
  v_rows jsonb;
  v_count integer;
  v_last bigint;
begin
  if auth.uid() is null then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_child_id is null or p_cursor is null or p_cursor < 0 then
    raise exception 'invalid_request' using errcode = 'PT400';
  end if;
  if not private.is_child_parent(p_child_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  v_page := least(greatest(coalesce(p_limit, v_page), 1), v_page);
  select h.change_seq into v_head from public.sync_heads h where h.child_id = p_child_id;
  v_head := coalesce(v_head, 0);
  if p_cursor > v_head then
    raise exception 'invalid_cursor' using errcode = 'PT409';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('seq', r.change_seq, 'kind', r.kind, 'key', r.key, 'value', r.value, 'deleted', r.deleted)
           order by r.change_seq), '[]'::jsonb), count(*), max(r.change_seq)
    into v_rows, v_count, v_last
    from (select * from public.sync_records s
          where s.child_id = p_child_id and s.change_seq > p_cursor and s.change_seq <= v_head
          order by s.change_seq limit v_page) r;
  return jsonb_build_object(
    'changes', v_rows,
    'cursor', case when v_count < v_page then v_head else v_last end,
    'head', v_head,
    'more', v_count = v_page and v_last < v_head,
    'server_time_ms', floor(extract(epoch from clock_timestamp()) * 1000));
end
$$;

revoke all on function public.sync_whoami(), public.sync_push(uuid, jsonb), public.sync_pull(uuid, bigint, integer)
  from public, anon, service_role;
grant execute on function public.sync_whoami(), public.sync_push(uuid, jsonb), public.sync_pull(uuid, bigint, integer)
  to authenticated;

-- New children start with a sync head (existing children get one on first upload).
create or replace function private.provision_family(p_parent_user_id uuid, p_child_nickname text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_family uuid;
  v_child uuid;
begin
  insert into public.families default values returning id into v_family;
  insert into public.family_members (family_id, user_id, role) values (v_family, p_parent_user_id, 'parent');
  insert into public.children (family_id, nickname) values (v_family, p_child_nickname) returning id into v_child;
  insert into public.snapshot_heads (child_id) values (v_child);
  insert into public.sync_heads (child_id) values (v_child);
  return v_child;
end
$$;
revoke all on function private.provision_family(uuid, text) from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Retire the superseded client snapshot upload (Pilot Scope §3). Its function, tables, migrations and recorded
-- evidence stay; no client role can call it any more. Server-made snapshots are a later increment.
revoke execute on function public.upload_snapshot(uuid, uuid, uuid, jsonb) from public, anon, authenticated, service_role;
