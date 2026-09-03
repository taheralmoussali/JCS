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

-- 4) Enable RLS on family members before adding the admin policy below.
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can insert family members" ON public.family_members;

-- 5) Allow the admin user to manage all application and lookup tables.
-- The admin user's JWT must contain: { "app_metadata": { "role": "admin" } }.
-- Set this from Supabase Dashboard > Authentication > Users > user > metadata.
DO $$
DECLARE
	table_name text;
BEGIN
	FOREACH table_name IN ARRAY ARRAY[
		'families',
		'family_members',
		'housing',
		'aid',
		'visits',
		'family_categories',
		'education_levels',
		'family_relationships',
		'genders',
		'marital_statuses'
	] LOOP
		EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
		EXECUTE format('DROP POLICY IF EXISTS "Admins can manage %1$s" ON public.%1$I', table_name);
		EXECUTE format(
			'CREATE POLICY "Admins can manage %1$s" ON public.%1$I FOR ALL TO authenticated USING ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'') WITH CHECK ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')',
			table_name
		);
	END LOOP;
END $$;
