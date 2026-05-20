# 🎨 Tattoo Hub — Complete Setup Guide

## Zarori Software (Pehle Install Karo)

| Software | Link | Kyu Chahiye |
|----------|------|-------------|
| Node.js (LTS) | https://nodejs.org | Server chalane ke liye |
| VS Code | https://code.visualstudio.com | Code likhne ke liye |
| Git | https://git-scm.com | (Optional) |

---

## Step 1: MongoDB Atlas Setup (FREE Database)

1. https://mongodb.com/atlas pe jao
2. "Try Free" click karo — free account banao
3. "Free Cluster" (M0) banao
4. Database Access → Add User:
   - Username: `tattoohub`
   - Password: koi bhi strong password
5. Network Access → Add IP: `0.0.0.0/0` (sabko allow karo)
6. Cluster → Connect → "Connect your application"
7. Connection string copy karo — kuch aisa dikhega:
   ```
   mongodb+srv://tattoohub:PASSWORD@cluster0.xxxxx.mongodb.net/tattoohub
   ```

---

## Step 2: .env File Banao

1. `.env.example` file copy karo
2. Naam badal ke `.env` rakho
3. Fill in karo:

```env
PORT=3000
MONGO_URI=mongodb+srv://tattoohub:YOURPASSWORD@cluster0.xxxxx.mongodb.net/tattoohub
ADMIN_USERNAME=admin
ADMIN_PASSWORD=MySecurePass123!
ADMIN_SECRET_URL=my-hidden-admin-abc123
JWT_SECRET=thisismylongrandomsecretkey12345678901234
JWT_EXPIRES_IN=8h
NODE_ENV=development
```

⚠️  `.env` file kabhi bhi GitHub pe upload mat karo!

---

## Step 3: Dependencies Install Karo

VS Code mein Terminal kholo (Ctrl + `) aur likho:

```bash
npm install
```

Sab packages automatically install ho jayenge. (1-2 minute lagenge)

---

## Step 4: Server Start Karo

```bash
node server.js
```

Yeh dikhega:
```
✅ MongoDB connected
🚀 Server running on http://localhost:3000
🔒 Admin panel: http://localhost:3000/admin-secret-panel
```

---

## Step 5: Admin Panel Access Karo

Browser mein jao:
```
http://localhost:3000/[ADMIN_SECRET_URL]
```

Example: agar aapne `.env` mein `ADMIN_SECRET_URL=my-hidden-admin-abc123` rakha hai:
```
http://localhost:3000/my-hidden-admin-abc123
```

**Bahar ka koi bhi `/admin` pe nahi ja sakta — kyunki woh URL exist hi nahi karta!**

---

## Step 6: Pinterest Sync Setup

Admin dashboard mein:
1. "Pinterest Sync" tab pe jao
2. Mode select karo:
   - **RSS Mode**: Board URL paste karo — foran kaam karta hai
   - **API Mode**: Pinterest App ID + Token chahiye
3. Auto-approve ON/OFF rakho
4. Save karo
5. Har 10 minute mein automatically new pins check hote hain

---

## Step 7: FREE Live Deployment (Render.com)

### Backend Deploy (Render — FREE)

1. https://render.com pe free account banao
2. "New Web Service" click karo
3. GitHub se connect karo (ya manual deploy)
4. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Environment Variables mein sab `.env` values add karo
6. Deploy!

Milega: `https://tattoo-hub.onrender.com`

### Frontend (Public folder)
- `tattoo-hub.html` ko `index.html` rename karo
- `public/` folder mein rakho
- Same Render service serve karegi

---

## Security Features Summary

| Feature | Status |
|---------|--------|
| JWT Authentication | ✅ |
| Secure HTTP-only Cookies | ✅ |
| Rate Limiting (Login: 5 attempts) | ✅ |
| Helmet.js (XSS, Clickjacking) | ✅ |
| CORS Protection | ✅ |
| Secret Admin URL | ✅ |
| IP Login Tracking | ✅ |
| Session Timeout (8h) | ✅ |
| MongoDB Injection Prevention | ✅ |
| Environment Variables | ✅ |

---

## Folder Structure

```
tattoo-hub-server/
├── server.js          ← Main server (entry point)
├── .env               ← YOUR SECRET KEYS (never share!)
├── .env.example       ← Template (safe to share)
├── package.json       ← Dependencies list
├── middleware/
│   └── auth.js        ← JWT verification
├── models/
│   ├── Post.js        ← Post database schema
│   └── Config.js      ← Settings schema
├── routes/
│   ├── auth.js        ← Login/logout
│   ├── posts.js       ← Get/approve/delete posts
│   └── sync.js        ← Pinterest sync config
└── public/
    └── index.html     ← Your tattoo-hub.html (renamed)
```

---

## Koi Problem Aaye?

Common fixes:

| Error | Fix |
|-------|-----|
| `MongoDB connection failed` | .env mein MONGO_URI check karo |
| `Cannot find module` | `npm install` dobara chalao |
| `Port already in use` | .env mein PORT=3001 karo |
| `JWT_SECRET not defined` | .env file check karo |
