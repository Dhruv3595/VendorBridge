const pool = require('../db/db');

const filterKeywords = {
  rfq: '%rfq%',
  approvals: '%approval%',
  invoices: '%invoice%',
  vendors: '%vendor%'
};

async function getActivity(req, res) {
  const filter = (req.query.filter || 'all').toLowerCase();
  const { from, to } = req.query;   // optional date range: YYYY-MM-DD

  const values = [];
  const where = [];

  // Module keyword filter
  if (filter !== 'all' && filterKeywords[filter]) {
    values.push(filterKeywords[filter]);
    where.push(`(al.action ILIKE $${values.length} OR al.description ILIKE $${values.length})`);
  }

  // Date range filter
  if (from) {
    values.push(from);
    where.push(`al.created_at >= $${values.length}::date`);
  }
  if (to) {
    values.push(to);
    where.push(`al.created_at < ($${values.length}::date + INTERVAL '1 day')`);
  }

  try {
    const result = await pool.query(
      `SELECT al.*,
              u.name AS user_name,
              u.role AS user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY al.created_at DESC
       LIMIT 200`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load activity logs' });
  }
}

module.exports = { getActivity };
