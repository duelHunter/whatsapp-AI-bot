const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing. Auth middleware will fail until they are set.'
  );
}

const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { 'X-Client-Info': 'whatsapp-ai-bot-backend' },
        },
      })
    : null;

async function getUserFromToken(accessToken) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }
  return supabaseAdmin.auth.getUser(accessToken);
}

module.exports = {
  supabaseAdmin,
  getUserFromToken,
};

