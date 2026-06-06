const pool = require('../db/db');

const filters = {
  rfq: ['%rfq%'],
  approvals: ['%approval%'],
  invoices: ['%invoice%'],
  vendors: ['%vendor%']
};

async function getActivity(req, res) {
  const filter = (req.query.filter || 'all').toLowerCase();

  try {
    if (!filter || filter === 'all' || !filters[filter]) {
      const result = await pool.query(
        'SELECT * FROM activity_logs ORDER BY created_at DESC'
      );
      return res.json(result.rows);
    }

    const words = filters[filter];
    const result = await pool.query(
      `SELECT *
       FROM activity_logs
       WHERE action ILIKE $1 OR description ILIKE $1
       ORDER BY created_at DESC`,
      [words[0]]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load activity logs' });
  }
}

module.exports = {
  getActivity
};
