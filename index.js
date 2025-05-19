const { useSingleFileAuthState, makeWASocket, DisconnectReason } = require('@adiwajshing/baileys');
const path = require('path');
const fs = require('fs');

// المسار إلى مجلد الجلسة
const sessionFolder = path.join(__dirname, 'MysticSession');
const credsPath = path.join(sessionFolder, 'creds.json');

// إنشاء مجلد الجلسة إذا لم يكن موجودًا
if (!fs.existsSync(sessionFolder)) {
    fs.mkdirSync(sessionFolder);
}

async function connectToWhatsApp() {
    // تحميل/حفظ بيانات الجلسة من ملف واحد (creds.json داخل مجلد session)
    const { state, saveCreds } = useSingleFileAuthState(credsPath);

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger: { level: 'warn' }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('🔍 امسح رمز الـ QR:');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`❌ انقطع الاتصال (${lastDisconnect.error}), إعادة الاتصال: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ تم الاتصال!');
        }
    });

    sock.ev.on('messages.upsert', ({ messages }) => {
        const message = messages[0];
        if (!message.key.fromMe && message.message?.conversation) {
            const text = message.message.conversation.toLowerCase();
            
            if (text === 'مرحبا') {
                sock.sendMessage(message.key.remoteJid, { text: 'أهلاً وسهلاً! 👋' });
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

connectToWhatsApp().catch(err => console.error('❌ خطأ:', err));
