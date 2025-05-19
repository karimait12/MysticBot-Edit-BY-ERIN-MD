const { makeWASocket, useMultiFileAuthState } = require('@adiwajshing/baileys');
const fs = require('fs');

async function startWhatsAppBot() {
    // تحميل ملف الاعتماد
    const credsPath = './MysticSession/creds.json';
    let creds = {};
    if (fs.existsSync(credsPath)) {
        creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
    }

    // إعداد الحالة باستخدام Baileys
    const { state, saveCreds } = await useMultiFileAuthState(creds);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    // حفظ الاعتماد عند تغييره
    sock.ev.on('creds.update', saveCreds);

    // استقبال الرسائل
    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const msg = messageUpdate.messages[0];
        if (!msg.key.fromMe && msg.message) {
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;
            console.log(`رسالة جديدة من ${msg.key.remoteJid}: ${messageContent}`);

            // رد تلقائي
            await sock.sendMessage(msg.key.remoteJid, {
                text: 'مرحبًا! كيف يمكنني مساعدتك؟',
            });
        }
    });

    console.log('بوت واتساب يعمل الآن...');
}

startWhatsAppBot().catch((err) => {
    console.error('فشل تشغيل البوت:', err);
});
