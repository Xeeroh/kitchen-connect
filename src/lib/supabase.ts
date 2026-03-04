import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase'; // We will create this later or generate it

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

export const supabase = createClient<Database>(
    supabaseUrl || '',
    supabaseAnonKey || ''
);
