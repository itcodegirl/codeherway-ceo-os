-- Align ownership columns with authenticated Supabase context.
-- These defaults reduce the need for client-side user_id plumbing and
-- keep inserts aligned with RLS policies based on auth.uid().

alter table if exists public.profiles
  alter column id set default auth.uid();

alter table if exists public.opportunities
  alter column user_id set default auth.uid();

alter table if exists public.content_items
  alter column user_id set default auth.uid();

alter table if exists public.weekly_briefs
  alter column user_id set default auth.uid();

alter table if exists public.weekly_brief_items
  alter column user_id set default auth.uid();

alter table if exists public.chief_sessions
  alter column user_id set default auth.uid();

alter table if exists public.chief_outputs
  alter column user_id set default auth.uid();
