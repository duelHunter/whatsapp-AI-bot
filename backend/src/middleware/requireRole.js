const { supabaseAdmin } = require('../auth/supabase');

const ROLE_ORDER = ['viewer', 'operator', 'admin', 'owner'];

function normalizeRole(role) {
  if (!role) return null;
  return role.toLowerCase();
}

module.exports = function requireRole(allowedRoles = []) {
  const normalized = allowedRoles.map(normalizeRole);

  return async function (req, res, next) {
    try {
      if (!supabaseAdmin) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const waAccountId =
        req.headers['x-wa-account-id'] ||
        req.body?.wa_account_id ||
        req.query?.wa_account_id;

      if (!waAccountId) {
        return res.status(400).json({ error: 'wa_account_id is required' });
      }

      if (!req.auth?.user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { data, error } = await supabaseAdmin
        .from('memberships')
        .select('role')
        .eq('wa_account_id', waAccountId)
        .eq('user_id', req.auth.user.id)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking membership:', error);
        return res.status(500).json({ error: 'Membership check failed' });
      }

      if (!data?.role) {
        return res.status(403).json({ error: 'Not a member of this WhatsApp account' });
      }

      const role = normalizeRole(data.role);
      req.auth.role = role;
      req.auth.wa_account_id = waAccountId;

      if (normalized.length === 0) {
        return next();
      }

      if (!normalized.includes(role)) {
        return res.status(403).json({ error: 'Insufficient role for this action' });
      }

      next();
    } catch (err) {
      console.error('❌ Role check error:', err);
      res.status(500).json({ error: 'Role verification failed' });
    }
  };
};

