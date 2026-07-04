import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ybepfufjvdecscparsvy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliZXBmdWZqdmRlY3NjcGFyc3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNzgwMTksImV4cCI6MjA5ODc1NDAxOX0.MlB1NoIgwB8EUVdREIOPlk3IR2A7Y7P4e23DgJ6Izw0';

// Kita paksa matikan persistSession agar tidak bentrok dengan sistem login V.E.S.T
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false 
  }
});