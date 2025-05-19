import { makeWASocket, useMultiFileAuthState } from '@adiwajshing/baileys';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

async function startWhatsAppBot() {
  // للحصول على المسار الحقيقي للملف في وضع ESM
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // تحديد المسار الجديد لملف الاعتماد
  const credsPath = join(__dirname, 'MysticSession', 'creds.json');

  // تحميل ملف الاعتماد إذا وجد
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
      const text = msg.message.conversation
        || msg.message.extendedTextMessage?.text
        || '';
      console.log(`رسالة واردة من ${msg.key.remoteJid}: ${text}`);

      // إرسال رد
      await sock.sendMessage(msg.key.remoteJid, { text: 'مرحبًا! كيف يمكنني مساعدتك؟' });
    }
  });

  console.log('بوت واتساب يعمل الآن...');
}

startWhatsAppBot().catch(err => {
  console.error('فشل تشغيل البوت:', err);
});
