import axios from "axios";
import fs from "fs";
import path from "path";

let handler = async (m) => {
  // الرابط الثابت للملف
  const fileUrl = "https://github.com/RadouaneElarfaoui/Anime-Seven-Releases/releases/download/v4.1.0/Anime-Seven.v1.4.0.zip";

  try {
    // تأكد من وجود مجلد downloads
    const downloadsDir = "./downloads";
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // تحميل الملف مع السماح بإعادة التوجيه
    const response = await axios({
      url: fileUrl,
      method: "GET",
      responseType: "stream",
      maxRedirects: 5,
    });

    // تحديد اسم الملف
    const fileName = path.basename(fileUrl);
    const filePath = path.join(downloadsDir, fileName);
    const writer = fs.createWriteStream(filePath);

    // ربط تيار التحميل بتيار الكتابة
    response.data.pipe(writer);

    writer.on("finish", async () => {
      try {
        // إرسال الملف
        await m.sendFile(m.chat, filePath, fileName, "ها هو ملفك:");
      } catch (sendErr) {
        console.error("Send file error:", sendErr);
        m.reply("❌ فشل في إرسال الملف: " + sendErr.message);
      }
    });

    writer.on("error", (writeErr) => {
      console.error("File save error:", writeErr);
      m.reply("❌ فشل في حفظ الملف: " + writeErr.message);
    });

  } catch (err) {
    console.error("Download error:", err);
    m.reply("❌ حدث خطأ أثناء تنزيل الملف: " + err.message);
  }
};

handler.help = ["sendfile"];
handler.command = ["sendfile"];
handler.tags = ["utility"];
export default handler;
