import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aukmjbgbukxwmvgymiau.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1a21qYmdidWt4d212Z3ltaWF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzY0MzAsImV4cCI6MjA5MjYxMjQzMH0.bZlq84ytBiD7f4K6Ji0Oa9bJfhsRh9r4ErfX1lt2bIk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  },
});