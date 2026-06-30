
CREATE OR REPLACE FUNCTION public.match_jobs(
  query_embedding vector(1536),
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID, title TEXT, description TEXT, location TEXT, remote BOOLEAN,
  job_type job_type, level job_level, salary_min INTEGER, salary_max INTEGER,
  tags TEXT[], company_id UUID, created_at TIMESTAMPTZ, similarity FLOAT
)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT j.id, j.title, j.description, j.location, j.remote, j.job_type, j.level,
         j.salary_min, j.salary_max, j.tags, j.company_id, j.created_at,
         1 - (j.embedding <=> query_embedding) AS similarity
  FROM public.jobs j
  WHERE j.published = true AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> query_embedding
  LIMIT match_count;
$$;
