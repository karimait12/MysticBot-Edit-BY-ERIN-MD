import { WAMessageStubType } from "baileys";
import PhoneNumber from 'awesome-phonenumber';
import chalk from 'chalk';
import { watchFile } from 'fs';
import moment from 'moment-timezone'; // استيراد مكتبة moment-timezone

const terminalImage = global.opts['img'] ? require('terminal-image') : '';
const urlRegex = (await import('url-regex-safe')).default({ strict: false });

// تعيين الحد الأقصى لطول الرسالة
const MAX_MESSAGE_LENGTH = 400; // يمكنك تعديل هذا حسب الحاجة

// دالة لتنسيق حجم الملف
const formatFileSize = (filesize) => {
  return filesize === 0 ? '0B' : (filesize / 1009 ** Math.floor(Math.log(filesize) / Math.log(1000))).toFixed(1) + ['', 'ك', 'م', 'ج', 'ت', 'ب'][Math.floor(Math.log(filesize) / Math.log(1000))] + 'ب';
};

// دالة لتحميل الصورة إذا كان الخيار مفعلًا
const downloadImageIfNeeded = async (m) => {
  try {
    if (global.opts['img'] && /sticker|image/gi.test(m.mtype)) {
      return await terminalImage.buffer(await m.download());
    }
  } catch (e) {
    console.error(e);
  }
  return false;
};

// دالة لتحديد نوع المحتوى
const getMessageType = (m) => {
  if (/image/i.test(m.mtype)) return 'صورة';
  if (/video/i.test(m.mtype)) return 'فيديو';
  if (/audio/i.test(m.mtype)) return 'صوت';
  if (/document/i.test(m.mtype)) return 'مستند';
  if (/sticker/i.test(m.mtype)) return 'ملصق';
  if (/contact/i.test(m.mtype)) return 'جهة اتصال';
  if (/text/i.test(m.mtype)) return 'نص';
  return 'غير معروف';
};

// دالة للحصول على الوقت بتوقيت مصر
const getEgyptTime = (timestamp) => {
  const date = new Date(1000 * (timestamp?.low || timestamp));
  return moment(date).tz('Africa/Cairo').format('HH:mm:ss'); // تحويل الوقت إلى توقيت مصر
};

// دالة للحصول على تاريخ الإرسال
const getMessageDate = (timestamp) => {
  const date = new Date(1000 * (timestamp?.low || timestamp));
  return moment(date).tz('Africa/Cairo').format('YYYY-MM-DD'); // تحويل التاريخ إلى توقيت مصر
};

export default async function(m, conn = { user: {} }) {
  const _name = await conn.getName(m.sender);
  const sender = PhoneNumber('+' + m.sender.replace('@s.whatsapp.net', '')).getNumber('international') + (_name ? ' ~' + _name : '');
  const chat = await conn.getName(m.chat);

  // محاولة تحميل الصورة إذا لزم الأمر
  let img = await downloadImageIfNeeded(m);

  // حساب حجم الملف بناءً على محتوى الرسالة
  const filesize = (m.msg ?
    m.msg.vcard?.length ||
    m.msg.fileLength?.low || m.msg.fileLength ||
    m.msg.axolotlSenderKeyDistributionMessage?.length ||
    m.text?.length :
    m.text?.length) || 0;

  const user = global.db.data.users[m.sender];
  const me = PhoneNumber('+' + (conn.user?.jid).replace('@s.whatsapp.net', '')).getNumber('international');
  const messageType = getMessageType(m);
  const messageId = m.id; // معرف الرسالة
  const messageDate = getMessageDate(m.messageTimestamp); // تاريخ الرسالة
  const viewsCount = m.msg?.viewOnce ? 'تم عرضها مرة واحدة' : 'عدد المشاهدات غير متاح'; // عدد المشاهدات

  // طباعة المعلومات في الطرفية مع تنسيق وتحسين الرسالة
  console.log(chalk.cyan(`▣─────────────────────────▣`));
  console.log(chalk.cyan(`│👤  المرسل: ${chalk.green(sender)} (${m.sender})`));
  console.log(chalk.cyan(`│📨  محتوى الرسالة: ${chalk.yellow(messageType)}`));
  console.log(chalk.cyan(`│🕓  التوقيت: ${chalk.magenta(getEgyptTime(m.messageTimestamp))}`));
  console.log(chalk.cyan(`│📅  تاريخ الإرسال: ${chalk.green(messageDate)}`));
  console.log(chalk.cyan(`│🔖  معرف الرسالة: ${chalk.blue(messageId)}`));
  console.log(chalk.cyan(`│👁️  عدد المشاهدات: ${chalk.gray(viewsCount)}`));
  console.log(chalk.cyan(`│💾  حجم الملف: ${chalk.blue(formatFileSize(filesize))}`));
  console.log(chalk.cyan(`│💬  الرسالة: ${chalk.gray(m.text ? (m.text.length > MAX_MESSAGE_LENGTH ? m.text.slice(0, MAX_MESSAGE_LENGTH) + '...' : m.text) : 'لا توجد رسالة نصية')}`));
  console.log(chalk.cyan(`│🗣️  المجموعة/الدردشة: ${chalk.yellow(chat)} (${m.chat})`));
  console.log(chalk.cyan(`▣─────────────────────────▣`));

  // عرض الصورة إذا كانت موجودة
  if (img) console.log(img.trimEnd());

  // معالجة وتنسيق الرسائل النصية
  if (typeof m.text === 'string' && m.text) {
    let log = m.text.replace(/\u200e+/g, '');

    // تنسيق النصوص باستخدام Markdown
    const mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~`])(?!`)(.+?)\1|```((?:.|[\n\r])+?)```|`([^`]+?)`)(?=\S?(?:[\s\n]|$))/g;
    const mdFormat = (depth = 4) => (_, type, text, monospace) => {
      const types = { '_': 'italic', '*': 'bold', '~': 'strikethrough', '`': 'bgGray' };
      text = text || monospace;
      return !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(/`/g, '').replace(mdRegex, mdFormat(depth - 1)));
    };

    log = log.replace(mdRegex, mdFormat(4));

    // قص الرسالة إذا تجاوزت الحد المسموح به
    if (log.length > MAX_MESSAGE_LENGTH) {
      log = log.substring(0, MAX_MESSAGE_LENGTH) + '\n' + chalk.blue('تم تجاوز الحد الأقصى للحروف...');
    }

    // تنسيق عناصر محددة مثل القوائم والروابط وذكر المستخدمين
    log = log.split('\n').map(line => {
      if (line.trim().startsWith('>')) return chalk.bgGray.dim(line.replace(/^>/, '┃'));
      if (/^([1-9]|[1-9][0-9])\./.test(line.trim())) return line.replace(/^(\d+)\./, (_, number) => ' '.repeat(number.length === 1 ? 2 : 1) + number + '.');
      if (/^[-*]\s/.test(line.trim())) return line.replace(/^[*-]/, '  •');
      return line;
    }).join('\n');

    // تمييز الروابط
    log = log.replace(urlRegex, chalk.blueBright);

    // تمييز المستخدمين المذكورين
    if (m.mentionedJid) {
      for (const user of m.mentionedJid) {
        const userName = await conn.getName(user);
        log = log.replace('@' + user.split`@`[0], chalk.blueBright('@' + userName));
      }
    }

    console.log(m.error ? chalk.red(log) : m.isCommand ? chalk.yellow(log) : log);
  }

  // تسجيل المعلمات الخاصة بالرسائل
  if (m.messageStubParameters) {
    console.log(m.messageStubParameters.map(jid => {
      jid = conn.decodeJid(jid);
      const name = conn.getName(jid);
      return chalk.gray(PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international') + (name ? ' ~' + name : ''));
    }).join(', '));
  }

  // تسجيل أنواع معينة من الرسائل
  if (/document/i.test(m.mtype)) console.log(`🗂️ ${m.msg.fileName || m.msg.displayName || 'مستند'}`);
  else if (/ContactsArray/i.test(m.mtype)) console.log('👨‍👩‍👧‍👦 مجموعة جهات اتصال');
  else if (/contact/i.test(m.mtype)) console.log(`👨 جهة اتصال: ${m.msg.displayName || ''}`);
  else if (/audio/i.test(m.mtype)) {
    const duration = m.msg.seconds;
    console.log(`${m.msg.ptt ? '🎤 (رسالة صوتية ' : '🎵 (صوت) '} ${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`);
  }
}

// مراقبة التغييرات في ملف الكود
const file = global.__filename(import.meta.url);
watchFile(file, () => {
  console.log(chalk.redBright('Update \'settings/print.js\''));
});
