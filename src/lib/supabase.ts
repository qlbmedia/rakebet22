import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kftseiqfzjykiqvuthyc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmdHNlaXFmemp5a2lxdnV0aHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTUwMjYsImV4cCI6MjA4OTg3MTAyNn0.T1ifcdwb25Fdl9IH5oEKrLymYloBI2PFnqm5uKK2Q18';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
