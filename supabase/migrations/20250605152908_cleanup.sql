-- Remove temporary policy after setup
DROP POLICY IF EXISTS "Temporary allow all" ON public.users; 