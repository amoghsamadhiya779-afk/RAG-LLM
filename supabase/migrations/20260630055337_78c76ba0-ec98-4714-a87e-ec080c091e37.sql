
-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'employer', 'seeker');

-- Job type / level enums
CREATE TYPE public.job_type AS ENUM ('full_time', 'part_time', 'contract', 'internship');
CREATE TYPE public.job_level AS ENUM ('intern', 'junior', 'mid', 'senior', 'lead');
CREATE TYPE public.application_status AS ENUM ('submitted', 'reviewing', 'interview', 'offer', 'rejected');

-- Updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =====================================================================
-- PROFILES
-- =====================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  headline TEXT,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  resume_url TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- USER ROLES
-- =====================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Auto-create profile + default seeker role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'seeker');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================================
-- COMPANIES
-- =====================================================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  website TEXT,
  logo_url TEXT,
  about TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select_all" ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies_insert_own" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_update_own" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "companies_delete_own" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- JOBS
-- =====================================================================
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  remote BOOLEAN NOT NULL DEFAULT false,
  job_type job_type NOT NULL DEFAULT 'full_time',
  level job_level NOT NULL DEFAULT 'mid',
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  tags TEXT[] DEFAULT '{}',
  apply_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_select_published" ON public.jobs FOR SELECT USING (published = true);
CREATE POLICY "jobs_select_own" ON public.jobs FOR SELECT TO authenticated USING (auth.uid() = posted_by);
CREATE POLICY "jobs_insert_own" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "jobs_update_own" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = posted_by);
CREATE POLICY "jobs_delete_own" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = posted_by);
CREATE INDEX jobs_created_at_idx ON public.jobs(created_at DESC);
CREATE INDEX jobs_embedding_idx ON public.jobs USING hnsw (embedding vector_cosine_ops);
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- APPLICATIONS
-- =====================================================================
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url TEXT,
  status application_status NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps_select_own" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = applicant_id);
CREATE POLICY "apps_select_employer" ON public.applications FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid()));
CREATE POLICY "apps_insert_own" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "apps_update_employer" ON public.applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid()));
CREATE TRIGGER trg_apps_updated BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- AI MATCH FUNCTION
-- =====================================================================
CREATE OR REPLACE FUNCTION public.match_jobs(
  query_embedding vector(1536),
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  remote BOOLEAN,
  job_type job_type,
  level job_level,
  salary_min INTEGER,
  salary_max INTEGER,
  tags TEXT[],
  company_id UUID,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE sql STABLE AS $$
  SELECT j.id, j.title, j.description, j.location, j.remote, j.job_type, j.level,
         j.salary_min, j.salary_max, j.tags, j.company_id, j.created_at,
         1 - (j.embedding <=> query_embedding) AS similarity
  FROM public.jobs j
  WHERE j.published = true AND j.embedding IS NOT NULL
  ORDER BY j.embedding <=> query_embedding
  LIMIT match_count;
$$;
