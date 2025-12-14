import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rhjecnudmoawimbgtifx.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamVjbnVkbW9hd2ltYmd0aWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2OTcwNDYsImV4cCI6MjA4MTI3MzA0Nn0.WGX6k13d0XWkFh6EW5oj9XHRxKTgQrOm354r2P_os7Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);