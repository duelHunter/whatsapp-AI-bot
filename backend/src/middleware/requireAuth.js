const { getUserFromToken } = require('../auth/supabase');

module.exports = async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length).trim()
      : null;

    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization bearer token' });
    }

    const { data, error } = await getUserFromToken(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.auth = { user: data.user, access_token: token };
    next();
  } catch (err) {
    console.error('❌ Auth error:', err);
    res.status(500).json({ error: 'Auth verification failed' });
  }
};

