import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import chalk from 'chalk';
import { useSingleFileAuthState, makeWASocket } from '@whiskeysockets/baileys';

// تهيئة المسارات
const __dirname = dirname(fileURLToPath(import.meta.url));
const sessionFolder = join(__dirname, 'MysticSession');
const credsPath = join(sessionFolder, 'creds.json');

// إنشاء مجلد الجلسة إذا لم يكن موجودًا
if (!fs.existsSync(sessionFolder)) {
  fs.mkdirSync(sessionFolder, { recursive: true });
}

// نظام تسجيل الأحداث مع التلوين
const log = (message, type = 'info') => {
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    event: chalk.magenta
  };
  const logType = type.toLowerCase();
  console.log(colors[logType]?.(`[${logType.toUpperCase()}] ${message}`) || message);
};

// نظام الأوامر المخصصة
const commands = {
  'الوقت': () => new Date().toLocaleTimeString(),
  'التاريخ': () => new Date().toLocaleDateString(),
  'مساعدة': () => 'الأوامر المتاحة: ' + Object.keys(commands).join(', ')
};

// الاتصال بواتساب
async function connectToWhatsApp() {
  const { state, saveCreds } = useSingleFileAuthState(credsPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: { level: 'warn' }
  });

  // معالجة أحداث الاتصال
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      log('مسح رمز QR للاتصال', 'event');
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
      log(`انقطع الاتصال، جاري إعادة الاتصال: ${shouldReconnect}`, 'warning');
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 5000);
      }
    } else if (connection === 'open') {
      log('تم الاتصال بنجاح مع واتساب', 'success');
    }
  });

  // معالجة الرسائل الواردة
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.key.fromMe && msg.message?.conversation) {
      const text = msg.message.conversation.toLowerCase();
      log(`رسالة واردة من ${msg.key.remoteJid}: ${text}`, 'info');

      // معالجة الأوامر
      if (commands[text]) {
        const response = commands[text]();
        await sock.sendMessage(msg.key.remoteJid, { text: response });
      } else if (text === 'مرحبا') {
        await sock.sendMessage(msg.key.remoteJid, { text: 'مرحبًا بك! 👋' });
      }
    }
  });

  // حفظ بيانات الجلسة
  sock.ev.on('creds.update', saveCreds);

  return sock;
}

// بدء التشغيل
(async () => {
  try {
    log('جاري بدء تشغيل البوت...', 'info');
    await connectToWhatsApp();
  } catch (error) {
    log(`حدث خطأ: ${error}`, 'error');
    process.exit(1);
  }
})();
