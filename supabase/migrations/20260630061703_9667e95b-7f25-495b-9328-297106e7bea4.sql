
-- 1. Add admin role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';

-- 2. Job status enum + column
DO $$ BEGIN
  CREATE TYPE public.job_status AS ENUM ('pending', 'live', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS status public.job_status NOT NULL DEFAULT 'pending';

-- Backfill existing rows: anything previously published becomes live
UPDATE public.jobs SET status = 'live' WHERE published = true AND status = 'pending';

CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs (status);

-- 3. Update RPCs to use status
CREATE OR REPLACE FUNCTION public.match_jobs(query_embedding vector, match_count integer DEFAULT 20)
 RETURNS TABLE(id uuid, title text, description text, location text, remote boolean, job_type job_type, level job_level, salary_min integer, salary_max integer, tags text[], company_id uuid, created_at timestamp with time zone, similarity double precision)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  SELECT j.id, j.title, j.description, j.location, j.remote, j.job_type, j.level,
         j.salary_min, j.salary_max, j.tags, j.company_id, j.created_at,
         1 - (j.embedding <=> query_embedding) AS similarity
  FROM public.jobs j
  WHERE j.status = 'live' AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> query_embedding
  LIMIT match_count;
$function$;

CREATE OR REPLACE FUNCTION public.match_jobs_for_resume(_resume_id uuid, _limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, title text, description text, location text, remote boolean, job_type job_type, level job_level, salary_min integer, salary_max integer, tags text[], company_id uuid, created_at timestamp with time zone, similarity double precision)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_emb vector(1536);
BEGIN
  SELECT user_id, embedding INTO v_owner, v_emb FROM public.resumes WHERE public.resumes.id = _resume_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'resume not found'; END IF;
  IF v_owner <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF v_emb IS NULL THEN RAISE EXCEPTION 'resume has no embedding'; END IF;

  RETURN QUERY
  SELECT j.id, j.title, j.description, j.location, j.remote, j.job_type, j.level,
         j.salary_min, j.salary_max, j.tags, j.company_id, j.created_at,
         1 - (j.embedding <=> v_emb) AS similarity
  FROM public.jobs j
  WHERE j.status = 'live' AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> v_emb
  LIMIT _limit;
END;
$function$;

-- 4. Admin policies on jobs (read all, update status)
DROP POLICY IF EXISTS "Admins read all jobs" ON public.jobs;
CREATE POLICY "Admins read all jobs" ON public.jobs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update jobs" ON public.jobs;
CREATE POLICY "Admins update jobs" ON public.jobs
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
