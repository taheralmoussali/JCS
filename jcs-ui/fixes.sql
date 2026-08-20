-- Review these before production. They address issues noticed in the supplied schema.
-- 1) Do not generate random UUIDs for visitor/provided_by. The app should use auth.uid().
ALTER TABLE public.visits ALTER COLUMN visitor_id DROP DEFAULT;
ALTER TABLE public.aid ALTER COLUMN provided_by DROP DEFAULT;

-- 2) bathroom_count looks like a count but is currently boolean.
-- Choose ONE of the following depending on the business rule:
-- ALTER TABLE public.housing ALTER COLUMN bathroom_count TYPE integer USING CASE WHEN bathroom_count THEN 1 ELSE 0 END;
-- OR rename it to bathroom_available if it is only yes/no.

-- 3) If every family member must belong to a family:
-- ALTER TABLE public.family_members ALTER COLUMN family_id SET NOT NULL;
