CREATE TABLE public.drink_ai_cache (drink_id text PRIMARY KEY, story text, blocked_status integer, blocked_message text, updated_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.drink_ai_cache TO service_role;
ALTER TABLE public.drink_ai_cache ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.drink_ai_cache IS 'Server-only cache of public drink stories and persistent AI access blocks. No visitor access.';