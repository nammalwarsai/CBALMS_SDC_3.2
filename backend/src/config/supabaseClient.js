const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    // Warning instead of error to allow server to start without creds initially, 
    // but logic will fail if used.
    console.warn('Supabase URL or Key is missing in .env');
}

// Create client with extended timeout and retry options
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
        autoRefreshToken: true,
        persistSession: false
    },
    global: {
        fetch: (url, options = {}) => {
            return fetch(url, {
                ...options,
                signal: AbortSignal.timeout(30000) // 30 second timeout
            });
        }
    },
    db: {
        schema: 'public'
    }
});

// Test connection (call explicitly from server.js instead of running as side-effect)
const testConnection = async () => {
    try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) {
            console.error('Supabase connection test failed:', error.message);
        } else {
            console.log('Supabase connection successful');
        }
    } catch (err) {
        console.error('Supabase connection error:', err.message);
    }
};

module.exports = supabase;
module.exports.testConnection = testConnection;
