import { useSingleFileAuthState, makeWASocket, DisconnectReason } from '@adiwajshing/baileys';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// الحصول على مسار المجلد الحالي (بدائل __dirname في ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد مسار الجلسة
const sessionFolder = path.join(__dirname, 'MysticSession');
const credsPath = path.join(sessionFolder, 'creds.json');

async function connectToWhatsApp() {
    // إنشاء مجلد الجلسة إذا لم يكن موجوداً
    if (!fs.existsSync(sessionFolder)) {
        fs.mkdirSync(sessionFolder);
    }

    const { state, saveCreds } = useSingleFileAuthState(credsPath);

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: { level: 'warn' }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) console.log('🔍 امسح رمز الـ QR:');
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`انقطع الاتصال، إعادة الاتصال: ${shouldReconnect}`);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('✅ تم الاتصال!');
        }
    });

    sock.ev.on('messages.upsert', ({ messages }) => {
        const message = messages[0];
        if (!message.key.fromMe && message.message?.conversation) {
            const text = message.message.conversation.toLowerCase();
            if (text === 'مرحبا') {
                sock.sendMessage(message.key.remoteJid, { text: 'أهلاً! 👋' });
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp().catch(console.error);
