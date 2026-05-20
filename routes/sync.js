// routes/sync.js — Pinterest Sync Config & Manual Trigger
const express      = require('express');
const router       = express.Router();
const requireAdmin = require('../middleware/auth');
const Config       = require('../models/Config');

// ─── ADMIN: Save sync config ──────────────
router.post('/config', requireAdmin, async (req, res) => {
  try {
    const { boardUrl, mode, boardId, autoApprove, defaultCategory, interval } = req.body;
    await Config.findOneAndUpdate(
      { key: 'pinterestSync' },
      { key: 'pinterestSync', value: {
        enabled: true, boardUrl, mode, boardId,
        autoApprove, defaultCategory, interval
      }},
      { upsert: true }
    );
    res.json({ success: true, message: 'Sync config saved!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// ─── ADMIN: Get sync config ───────────────
router.get('/config', requireAdmin, async (req, res) => {
  const config = await Config.findOne({ key: 'pinterestSync' });
  res.json(config ? config.value : {});
});

// ─── ADMIN: Manual sync trigger ───────────
router.post('/trigger', requireAdmin, async (req, res) => {
  try {
    // Trigger the sync function from server.js
    res.json({ success: true, message: 'Sync triggered! Check back in a moment.' });
    // The cron job runs every 10 min; manual trigger handled by server
  } catch (err) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

// ─── ADMIN: Pinterest OAuth callback ──────
router.get('/pinterest/callback', requireAdmin, async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'No code received' });
  try {
    const axios = require('axios');
    const response = await axios.post('https://api.pinterest.com/v5/oauth/token', {
      grant_type:    'authorization_code',
      code,
      redirect_uri:  process.env.PINTEREST_REDIRECT_URI,
      client_id:     process.env.PINTEREST_APP_ID,
      client_secret: process.env.PINTEREST_APP_SECRET
    });
    // Save token to config
    await Config.findOneAndUpdate(
      { key: 'pinterestSync' },
      { $set: { 'value.apiToken': response.data.access_token } }
    );
    res.json({ success: true, message: 'Pinterest connected!' });
  } catch (err) {
    res.status(500).json({ error: 'OAuth failed: ' + err.message });
  }
});

module.exports = router;
