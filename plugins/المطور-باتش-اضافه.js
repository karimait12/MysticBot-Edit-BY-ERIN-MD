import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let handler = async (m) => {
  // رابط بديل للاختبار (إذا كان الرابط الأصلي يعطي 404)
  const fileUrl = "https://dl.pramgplus.com/uploads/Zarchiver-v1.0.8_PramgPlus.Com.apk" || 
                 "https://github.com/user-attachments/files/20343011/WhatsappBOT-main.zip";

  try {
    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // استخلاص اسم الملف بطريقة أكثر قوة
    let fileName;
    try {
      const urlObj = new URL(fileUrl);
      fileName = path.basename(urlObj.pathname) || `file_${Date.now()}.zip`;
    } catch {
      fileName = `file_${Date.now()}.zip`;
    }

    const filePath = path.join(downloadsDir, fileName);

    // إضافة headers لزيادة فرص النجاح
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      }
    });

    const writer = fs.createWriteStream(filePath);

    // عرض تقدم التحميل
    let downloadedBytes = 0;
    const totalBytes = parseInt(response.headers['content-length'], 10);
    
    response.data.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const percent = totalBytes ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
      console.log(`Downloaded: ${percent}%`);
    });

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      response.data.pipe(writer);
    });

    await m.sendFile(m.chat, filePath, fileName, "تم تحميل الملف بنجاح 🎉");
    
    // تنظيف الملف المؤقت
    try {
      fs.unlinkSync(filePath);
    } catch (cleanError) {
      console.error("Warning: Could not delete temp file:", cleanError);
    }

  } catch (err) {
    console.error("Full Error:", err);
    
    if (err.response?.status === 404) {
      m.reply("⚠️ الرابط غير موجود أو انتهت صلاحيته (404)");
    } else {
      m.reply(`❌ حدث خطأ غير متوقع: ${err.message}`);
    }
  }
};

handler.help = ["sendfile"];
handler.command = ["sendfile"];
handler.tags = ["utility"];
export default handler;
