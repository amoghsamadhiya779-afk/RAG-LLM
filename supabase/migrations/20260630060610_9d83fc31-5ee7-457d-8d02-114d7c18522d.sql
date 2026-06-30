
-- Resumes table for AI matching
CREATE TABLE public.resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  raw_text text,
  parsed jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.resumes TO authenticated;
GRANT ALL ON public.resumes TO service_role;

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resumes_owner_select" ON public.resumes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "resumes_owner_insert" ON public.resumes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resumes_owner_update" ON public.resumes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resumes_owner_delete" ON public.resumes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX resumes_user_active_idx ON public.resumes(user_id) WHERE is_active;

CREATE TRIGGER resumes_set_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: top jobs for a given resume's embedding. SECURITY DEFINER + ownership check.
CREATE OR REPLACE FUNCTION public.match_jobs_for_resume(_resume_id uuid, _limit integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  remote boolean,
  job_type job_type,
  level job_level,
  salary_min integer,
  salary_max integer,
  tags text[],
  company_id uuid,
  created_at timestamptz,
  similarity double precision
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
  WHERE j.published = true AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> v_emb
  LIMIT _limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.match_jobs_for_resume(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_jobs_for_resume(uuid, integer) TO authenticated;
