-- =====================================================================
-- LIFE-LINK / BLOODCONNECT: LIVE TRACKING & DELIVERY LIFECYCLE SCHEMA
-- =====================================================================

-- 1. Table: blood_requests
CREATE TABLE IF NOT EXISTS public.blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    component TEXT NOT NULL,
    units_required INTEGER NOT NULL DEFAULT 1,
    urgency TEXT NOT NULL DEFAULT 'NORMAL',
    hospital_latitude DOUBLE PRECISION NOT NULL,
    hospital_longitude DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL DEFAULT 'CREATED',
    required_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: request_matches
CREATE TABLE IF NOT EXISTS public.request_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'BLOOD_BANK' or 'DONOR'
    source_id TEXT NOT NULL,
    accepted_at TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'MATCHED' -- 'MATCHED', 'ACCEPTED', 'BLOOD_PREPARED', 'IN_TRANSIT', 'ARRIVING', 'DELIVERED'
);

-- 3. Table: live_tracking
CREATE TABLE IF NOT EXISTS public.live_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE,
    source_id TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    eta TEXT,
    distance_remaining DOUBLE PRECISION,
    last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Table: request_status_history
CREATE TABLE IF NOT EXISTS public.request_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.blood_requests(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for high-frequency realtime querying
CREATE INDEX IF NOT EXISTS idx_blood_requests_hospital ON public.blood_requests(hospital_id);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON public.blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_live_tracking_request ON public.live_tracking(request_id);
CREATE INDEX IF NOT EXISTS idx_status_history_request ON public.request_status_history(request_id);

-- Enable Row Level Security
ALTER TABLE public.blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_history ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for Hackathon API Access
CREATE POLICY "Allow public read of blood requests" ON public.blood_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert of blood requests" ON public.blood_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of blood requests" ON public.blood_requests FOR UPDATE USING (true);

CREATE POLICY "Allow public read of live tracking" ON public.live_tracking FOR SELECT USING (true);
CREATE POLICY "Allow public insert of live tracking" ON public.live_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of live tracking" ON public.live_tracking FOR UPDATE USING (true);

CREATE POLICY "Allow public read of request matches" ON public.request_matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert of request matches" ON public.request_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of request matches" ON public.request_matches FOR UPDATE USING (true);

CREATE POLICY "Allow public read of status history" ON public.request_status_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert of status history" ON public.request_status_history FOR INSERT WITH CHECK (true);

-- Enable Realtime for live delivery updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.blood_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_matches;
