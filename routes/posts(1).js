// routes/posts.js — Public & Admin Post Routes
const express   = require('express');
const router    = express.Router();
const requireAdmin = require('../middleware/auth');
const Post      = require('../models/Post');

// ─── PUBLIC: Get all live posts ───────────
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20, search } = req.query;
    const filter = { status: 'live' };
    if (category && category !== 'all') filter.category = category;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Post.countDocuments(filter);
    res.json({ posts, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── ADMIN: Get all posts (pending too) ───
router.get('/all', requireAdmin, async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
});

// ─── ADMIN: Approve post ──────────────────
router.patch('/:id/approve', requireAdmin, async (req, res) => {
  await Post.findByIdAndUpdate(req.params.id, { status: 'live' });
  res.json({ success: true });
});

// ─── ADMIN: Reject/delete post ────────────
router.delete('/:id', requireAdmin, async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ─── ADMIN: Update post category ──────────
router.patch('/:id', requireAdmin, async (req, res) => {
  const { category, title, description, tags, status } = req.body;
  await Post.findByIdAndUpdate(req.params.id, { category, title, description, tags, status });
  res.json({ success: true });
});

module.exports = router;
