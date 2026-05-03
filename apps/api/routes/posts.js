const express = require('express');
const router = express.Router({ mergeParams: true });
const { prisma } = require('../db/index');
const { schemaName } = require('../db/tenant');

// GET /api/accounts/:slug/posts
router.get('/:slug/posts', async (req, res) => {
  const { slug } = req.params;
  const { page = 1, limit = 20, sort = 'posted_at', order = 'desc' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const validSorts = ['posted_at', 'likes', 'comments', 'reach'];
  const safeSort = validSorts.includes(sort) ? sort : 'posted_at';
  const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

  try {
    const influencer = await prisma.influencer.findUnique({ where: { slug } });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    const schema = schemaName(influencer.id);

    const rows = await prisma.$queryRawUnsafe(
      `SELECT p.id, p.run_id, p.type, p.platform_id, p.permalink, p.image_url,
              p.caption, p.song, p.posted_at, p.likes, p.comments, p.reach
       FROM "${schema}".posts p
       ORDER BY ${safeSort} ${safeOrder}
       LIMIT $1 OFFSET $2`,
      Number(limit), offset
    );

    const [{ count }] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "${schema}".posts`
    );

    res.json({ success: true, data: rows, meta: { total: count, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error('[posts] GET posts:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/accounts/:slug/stats
router.get('/:slug/stats', async (req, res) => {
  const { slug } = req.params;

  try {
    const influencer = await prisma.influencer.findUnique({ where: { slug } });
    if (!influencer) return res.status(404).json({ success: false, error: 'Account not found' });

    const schema = schemaName(influencer.id);

    // Posts this month
    const [postsMonth] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "${schema}".posts
       WHERE posted_at >= date_trunc('month', NOW())`
    );

    // Total runs + success rate
    const [runStats] = await prisma.$queryRawUnsafe(
      `SELECT
         COUNT(*)::int AS total_runs,
         COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_runs,
         MAX(created_at) AS last_run_at
       FROM "${schema}".runs`
    );

    // Last post time
    const [lastPost] = await prisma.$queryRawUnsafe(
      `SELECT MAX(posted_at) AS last_posted_at FROM "${schema}".posts`
    );

    // Posts per week for last 12 weeks (for chart)
    const weekly = await prisma.$queryRawUnsafe(
      `SELECT
         date_trunc('week', posted_at)::date AS week_start,
         COUNT(*)::int AS count
       FROM "${schema}".posts
       WHERE posted_at >= NOW() - INTERVAL '12 weeks'
       GROUP BY 1
       ORDER BY 1`
    );

    // Post type split
    const typeSplit = await prisma.$queryRawUnsafe(
      `SELECT type, COUNT(*)::int AS count FROM "${schema}".posts GROUP BY type`
    );

    const totalRuns = runStats.total_runs || 0;
    const completedRuns = runStats.completed_runs || 0;
    const successRate = totalRuns > 0 ? Math.round((completedRuns / totalRuns) * 100) : 0;

    res.json({
      success: true,
      data: {
        posts_this_month: postsMonth.count,
        total_runs: totalRuns,
        success_rate: successRate,
        last_posted_at: lastPost.last_posted_at || null,
        last_run_at: runStats.last_run_at || null,
        weekly_posts: weekly,
        post_type_split: typeSplit,
      },
    });
  } catch (err) {
    console.error('[posts] GET stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
