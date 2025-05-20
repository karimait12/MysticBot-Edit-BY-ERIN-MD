import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// الحصول على مسار المجلد الحالي (بديل لـ __dirname في ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let handler = async (m) => {
  // الرابط الثابت للملف
  const fileUrl = "https://github.com/user-attachments/files/20343011/WhatsappBOT-main.zip";

  try {
    // تأكد من وجود مجلد downloads (باستخدام مسار مطلق)
    const downloadsDir = path.join(__dirname, 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // تنظيف الرابط من أي query parameters
    const cleanUrl = new URL(fileUrl).pathname;
    const fileName = path.basename(cleanUrl) || "downloaded_file.zip"; // اسم افتراضي إذا فشل الاستخلاص
    const filePath = path.join(downloadsDir, fileName);

    // تحميل الملف مع السماح بإعادة التوجيه
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
      maxRedirects: 5,
    });

    const writer = fs.createWriteStream(filePath);

    // ربط تيار التحميل بتيار الكتابة
    response.data.pipe(writer);

    // التعامل مع الأحداث
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // إرسال الملف
    await m.sendFile(m.chat, filePath, fileName, "ها هو ملفك:");

    // حذف الملف بعد الإرسال (اختياري)
    fs.unlinkSync(filePath);

  } catch (err) {
    console.error("Error:", err);
    m.reply(`❌ حدث خطأ: ${err.message}`);
  }
};

handler.help = ["sendfile"];
handler.command = ["sendfile"];
handler.tags = ["utility"];
export default handler;
