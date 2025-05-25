import { fileURLToPath } from 'url';
import path, { join } from 'path';
import fs from 'fs';
import axios from "axios";

let handler = async (m) => {
  // إضافة تفاعل (React) قبل بدء التحميل
  await m.react('⏳').catch(e => console.error('Failed to react:', e));
  
  const fileUrl = "https://apkhihe.org/?download_link=WnJVdTJKSTZrSkt3OUp0Qjc1aTFNand3VEszbVFUM2VjR3k3Z2RZV3RUaGk0aGFXSHRyWm1nTTh5ZVRGV1BwcVZSUmFxNmdqcjF0ZmoxOWFTaGNIaFJhaE9SWUp5V0Q2WVBMZW5LTWhJbzRqQm11dWZDdW1rRkt4KyttKzQ0di9ZNGhGSnpFZk0rNWNXWTlTOVFWZlhNdjVmVWp1QnpiZTUvY01wUFhxdnpnczNvMkJLQlBaVjk3Y2Zkb0Y0bmpMYVRzS3RXK0w3ZG9XTVA1WVNQenBxdz09";

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

    // تغيير التفاعل إلى ✅ عند نجاح التحميل
    await m.react('✅').catch(e => console.error('Failed to react:', e));

    // إرسال الملف باستخدام Baileys
    await conn.sendMessage(m.chat, {
      document: fs.readFileSync(filePath),
      fileName: fileName,
      mimetype: 'application/zip',
      caption: 'Anime-Seven.v1.4.0.zip 🍀'
    }, { quoted: m });

    // تنظيف الملف المؤقت
    try {
      fs.unlinkSync(filePath);
    } catch (cleanError) {
      console.error('Failed to delete temp file:', cleanError);
    }

  } catch (err) {
    console.error('Error:', err);
    // تغيير التفاعل إلى ❌ عند حدوث خطأ
    await m.react('❌').catch(e => console.error('Failed to react:', e));
    
    if (typeof m.reply === 'function') {
      if (err.response?.status === 404) {
        await m.reply('❌ الرابط غير صحيح أو الملف غير موجود (404)');
      } else {
        await m.reply(`❌ حدث خطأ: ${err.message}`);
      }
    }
  }
};

handler.help = ["a7"];
handler.command = ["a7"];
handler.tags = ["utility"];
export default handler;
