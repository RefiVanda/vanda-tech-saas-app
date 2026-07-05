import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqvjsvywjuczjfgvurrp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xdmpzdnl3anVjempmZ3Z1cnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxODkxNDYsImV4cCI6MjA5ODc2NTE0Nn0.N2NbgYBPHFXvsCfYQ2USCYhZ5qikIdBcN4Gav2EMv9Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);