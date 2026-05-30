require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', true);

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

function loadServiceAccount() {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        } catch (e) {
            console.error('[!] FIREBASE_SERVICE_ACCOUNT env var is not valid JSON.');
        }
    }
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');
    if (fs.existsSync(keyPath)) return require(keyPath);
    // Fallback: auto-detect a Firebase-downloaded key (e.g. *-firebase-adminsdk-*.json).
    const match = fs.readdirSync(__dirname).find((f) => /firebase-adminsdk.*\.json$/i.test(f));
    if (match) return require(path.join(__dirname, match));
    return null;
}

let db = null;
const serviceAccount = loadServiceAccount();
if (serviceAccount && process.env.FIREBASE_DB_URL) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DB_URL,
    });
    db = admin.database();
    console.log('[+] Firebase RTD logging ENABLED');
} else {
    console.warn('[!] Firebase NOT configured — IPs will be returned but NOT logged.');
    console.warn('    Set FIREBASE_DB_URL and provide a service-account key to enable logging.');
}

function resolveClientIp(req) {
    const forwarded = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    let ip = forwarded || req.headers['x-real-ip'] || req.ip || req.socket.remoteAddress;
    if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
    return ip;
}

// Health check for PM2 / uptime monitoring.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// The endpoint the Vercel page fetches. Catches the IP, logs it, returns it.
app.get('/api/ip', async (req, res) => {
    const ip = resolveClientIp(req);
    const recordedAt = Date.now();

    if (db) {
        try {
            await db.ref('visits').push({
                ip,
                userAgent: req.headers['user-agent'] || null,
                recordedAt: admin.database.ServerValue.TIMESTAMP,
            });
        } catch (e) {
            console.error('[!] Firebase write failed:', e.message);
        }
    }

    res.json({ ip, recordedAt });
});

app.listen(PORT, () => {
    console.log(`[+] IP Analyzer engine active on port ${PORT}`);
});
