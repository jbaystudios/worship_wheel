-- Security fix: tighten assessment_sessions SELECT policy (spec 005 hand-off)
--
-- PROBLEM: the original "assessment_sessions_select_by_id" policy was
--   for select to anon, authenticated using (true)
-- Despite its name it does NOT scope by id — `using (true)` lets ANY client
-- holding the public anon key run `select * from assessment_sessions` and read
-- every lead's first_name and email. RLS cannot enforce "only when queried by
-- primary key" (a policy sees rows, not WHERE clauses), so the correct fix is
-- to remove anonymous read access entirely.
--
-- IMPACT:
--   - Public results page (/results/[id]): MUST fetch server-side with the
--     service role key, which bypasses RLS. The current results page renders
--     from client sessionStorage (spec 003) and does not query this table, so
--     there is no regression today. The future shareable-URL fetch (spec 001
--     GET /results/[id]) must use the service role client server-side.
--   - Admin dashboard: the `authenticated` role retains full SELECT.

-- Remove the over-permissive anon+authenticated policy.
drop policy if exists "assessment_sessions_select_by_id"
  on public.assessment_sessions;

-- Dashboard (authenticated) role keeps full read access for the Leads/Outcomes views.
create policy "assessment_sessions_select_authenticated"
  on public.assessment_sessions
  for select
  to authenticated
  using (true);

-- The anon role now has NO select policy => cannot read assessment_sessions.
-- Public insert is unchanged (assessment_sessions_insert_public remains).
