-- Run once in Supabase SQL Editor.
-- Rename Stories → Community, move Coding under new Other board (+ Gaming).

-- 1) Stories → Community (keep existing threads via board_id)
update public.boards
set
  slug = 'community',
  name = 'Community',
  description = 'Community discussion, stories, and opinions'
where slug = 'stories';

-- 2) Other board
insert into public.boards (slug, name, description, is_adult, sort_order)
values ('other', 'Other', 'Gaming, coding, and miscellaneous', false, 3)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_adult = excluded.is_adult,
  sort_order = excluded.sort_order;

-- Keep Adult after Other
update public.boards set sort_order = 4 where slug = 'adult';
update public.boards set sort_order = 1 where slug = 'general';
update public.boards set sort_order = 2 where slug = 'community';
update public.boards set sort_order = 3 where slug = 'other';

-- 3) Sub-boards under Other
insert into public.sub_boards (
  board_id, slug, name, description, is_adult, sort_order,
  max_threads_per_user, op_only_replies, allow_anonymous
)
select
  b.id,
  v.slug,
  v.name,
  v.description,
  false,
  v.sort_order,
  null,
  false,
  false
from public.boards b
cross join (
  values
    ('gaming', 'Gaming', 'Games and gaming discussion', 1),
    ('coding', 'Coding', 'Code, tools, and technical talk', 2)
) as v(slug, name, description, sort_order)
where b.slug = 'other'
on conflict (board_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- 4) Move threads from General/Coding → Other/Coding
with old_coding as (
  select sb.id as old_sub_id, sb.board_id as old_board_id
  from public.sub_boards sb
  join public.boards b on b.id = sb.board_id
  where b.slug = 'general' and sb.slug = 'coding'
),
new_coding as (
  select sb.id as new_sub_id, sb.board_id as new_board_id
  from public.sub_boards sb
  join public.boards b on b.id = sb.board_id
  where b.slug = 'other' and sb.slug = 'coding'
)
update public.threads t
set
  board_id = n.new_board_id,
  sub_board_id = n.new_sub_id
from old_coding o, new_coding n
where t.sub_board_id = o.old_sub_id;

-- 5) Remove Coding from General
delete from public.sub_boards sb
using public.boards b
where sb.board_id = b.id
  and b.slug = 'general'
  and sb.slug = 'coding';

-- Reorder remaining General sub-boards
update public.sub_boards sb
set sort_order = 1
from public.boards b
where sb.board_id = b.id and b.slug = 'general' and sb.slug = 'site-updates';

update public.sub_boards sb
set sort_order = 2
from public.boards b
where sb.board_id = b.id and b.slug = 'general' and sb.slug = 'suggestions';
