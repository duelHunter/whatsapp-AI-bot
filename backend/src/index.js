const express = require('express');
const dotenv = require('dotenv');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

dotenv.config();

const app = express();
app.use(express.json());

// --- WhatsApp client setup ---
const waClient = new Client({
    authStrategy: new LocalAuth(), // saves session so you don't scan every time
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

waClient.on('qr', (qr) => {
    console.log('📲 Scan this QR code with your WhatsApp:');
    qrcode.generate(qr, { small: true });
});

waClient.on('ready', () => {
    console.log('✅ WhatsApp client is ready');
});

waClient.on('authenticated', () => {
    console.log('🔐 WhatsApp authenticated');
});

waClient.on('auth_failure', (msg) => {
    console.error('❌ Auth failure:', msg);
});

waClient.on('disconnected', (reason) => {
    console.log('⚠️ WhatsApp client disconnected:', reason);
});

// Simple echo / test bot
waClient.on('message', async (msg) => {
    console.log(`💬 From ${msg.from}: ${msg.body}`);

    // Test command
    if (msg.body.toLowerCase() === 'ping') {
        await msg.reply('pong 🏓');
        return;
    }

    // Default echo
    await msg.reply(`You said: ${msg.body}`);
});

// Initialize WhatsApp
waClient.initialize();

// --- Express server ---
app.get('/', (req, res) => {
    res.send('WhatsApp AI Bot Backend (JS version) is running ✅');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
