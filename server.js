// ─────────────────────────────────────────
//  TATTOO HUB — Main Server
//  Run: node server.js
// ─────────────────────────────────────────
require('dotenv').config();
const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path         = require('path');
const cron         = require('node-cron');
const axios        = require('axios');
const cheerio      = require('cheerio');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const syncRoutes = require('./routes/sync');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── SECURITY MIDDLEWARE ───────────────────
// Helmet: sets secure HTTP headers (XSS, clickjacking protection etc.)
app.use(helmet({
  contentSecurityPolicy: false // allow our frontend to load fonts/images
}));

// CORS: only allow our own frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate Limiter: max 100 requests per 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use(limiter);

// Strict rate limit for login: max 5 attempts per 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many login attempts. Account locked for 15 minutes.' }
});

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// ─── MONGODB CONNECTION ────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

// ─── ROUTES ───────────────────────────────
app.use('/api/auth',  loginLimiter, authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/sync',  syncRoutes);

// ─── SERVE FRONTEND ───────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── PINTEREST AUTO-SYNC (Every 10 minutes) ─
cron.schedule('*/10 * * * *', async () => {
  console.log('🔄 Pinterest auto-sync running...');
  try {
    await runPinterestSync();
  } catch(e) {
    console.error('Sync error:', e.message);
  }
});

async function runPinterestSync() {
  const Config = require('./models/Config');
  const Post   = require('./models/Post');

  const config = await Config.findOne({ key: 'pinterestSync' });
  if (!config || !config.value.enabled) return;

  const { boardUrl, apiToken, mode } = config.value;

  let pins = [];

  if (mode === 'api' && apiToken) {
    // Pinterest Official API
    const boardId = config.value.boardId;
    const res = await axios.get(
      `https://api.pinterest.com/v5/boards/${boardId}/pins`,
      { headers: { Authorization: `Bearer ${apiToken}` } }
    );
    pins = res.data.items.map(pin => ({
      title:       pin.title || 'Pinterest Pin',
      description: pin.description || '',
      image:       pin.media?.images?.['600x']?.url || '',
      pinUrl:      `https://pinterest.com/pin/${pin.id}`,
      pinterestId: pin.id,
      tags:        (pin.description || '').split(' ')
                     .filter(w => w.startsWith('#'))
                     .map(w => w.replace('#','')).slice(0,5)
    }));
  } else if (mode === 'rss' && boardUrl) {
    // RSS Scrape Method (fallback)
    const rssUrl = boardUrl.replace('pinterest.com','pinterest.com') + '.rss';
    const res = await axios.get(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
      { timeout: 8000 }
    );
    if (res.data.items) {
      pins = res.data.items.map(item => ({
        title:       item.title || 'Pinterest Pin',
        description: item.description ? cheerio.load(item.description).text().slice(0,300) : '',
        image:       item.enclosure?.link || item.thumbnail || '',
        pinUrl:      item.link,
        pinterestId: item.guid,
        tags:        []
      }));
    }
  }

  // Save new pins to MongoDB (skip duplicates)
  let newCount = 0;
  for (const pin of pins) {
    const exists = await Post.findOne({ pinterestId: pin.pinterestId });
    if (!exists) {
      await Post.create({
        ...pin,
        category: config.value.defaultCategory || 'custom',
        status:   config.value.autoApprove ? 'live' : 'pending',
        source:   'pinterest'
      });
      newCount++;
    }
  }
  console.log(`✅ Pinterest sync done. ${newCount} new pins added.`);
}

app.listen(PORT, () => {
  console.log(`\n🚀 Tattoo Hub server running on http://localhost:${PORT}`);
  console.log(`🔒 Admin panel: http://localhost:${PORT}/admin-secret-panel\n`);
});
