import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ostzdzthagctsdrkbsbg.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdHpkenRoYWdjdHNkcmtic2JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODQ4MDMsImV4cCI6MjA2Mzg2MDgwM30.NLzKNC0aThumLn5epFHRtL5mnCqhqe6RVSE1O4eM-Ws';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;