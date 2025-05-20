import { fileURLToPath } from 'url';
import path, { join } from 'path';
import fs from 'fs';
import axios from "axios";

let handler = async (m) => {
  const fileUrl = "https://dl.pramgplus.com/uploads/Zarchiver-v1.0.8_PramgPlus.Com.apk";

  try {
    // إنشاء مجلد التحميلات إذا لم يكن موجوداً
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // استخلاص اسم الملف
    const urlObj = new URL(fileUrl);
    const fileName = path.basename(urlObj.pathname) || `file_${Date.now()}.zip`;
    const filePath = path.join(downloadsDir, fileName);

    // التحميل مع تتبع التقدم
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // إرسال الملف باستخدام Baileys
    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(filePath),
      fileName: fileName,
      mimetype: 'application/zip',
      caption: 'ها هو ملفك المطلوب 📁'
    }, { quoted: m });

    // تنظيف الملف المؤقت
    try {
      fs.unlinkSync(filePath);
    } catch (cleanError) {
      console.error('Failed to delete temp file:', cleanError);
    }

  } catch (err) {
    console.error('Error:', err);
    if (typeof m.reply === 'function') {
      if (err.response?.status === 404) {
        await m.reply('❌ الرابط غير صحيح أو الملف غير موجود (404)');
      } else {
        await m.reply(`❌ حدث خطأ: ${err.message}`);
      }
    }
  }
};

handler.help = ["sendfile"];
handler.command = ["sendfile"];
handler.tags = ["utility"];
export default handler;
