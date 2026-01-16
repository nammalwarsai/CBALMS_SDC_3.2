const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl && !supabaseServiceKey) {
    // Warning instead of error to allow server to start without creds initially, 
    // but logic will fail if used.
    console.warn('Supabase URL or Key is missing in .env');
}

// Fallback to empty strings to prevent crash on init, but calls will fail
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '');

module.exports = supabase;
