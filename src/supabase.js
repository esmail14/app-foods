import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://huphasmpsvpkpdavmpzu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1cGhhc21wc3Zwa3BkYXZtcHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTI3NzEsImV4cCI6MjA4MTYyODc3MX0.2Ppj41NgZ9yZQuD506dAg1Izi1P0P_hKvEQRosP7NAU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
