import axios from "axios";
import fs from "fs";

let handler = async (m, { text }) => {
  if (!text) return m.reply("Please enter a valid download link.");

  try {
    // تحميل الملف من الرابط
    let response = await axios({
      url: text,
      method: "GET",
      responseType: "stream",
    });

    // تحديد اسم الملف
    let fileName = text.split("/").pop();

    // تخزين الملف محليًا (اختياري)
    let path = `./downloads/${fileName}`;
    let writer = fs.createWriteStream(path);

    response.data.pipe(writer);

    writer.on("finish", async () => {
      // إرسال الملف للمرسل
      await m.reply("File downloaded successfully. Sending the file...");
      await m.sendFile(m.chat, path, fileName, "Here is your file.");
    });

    writer.on("error", () => {
      m.reply("Failed to save the file.");
    });
  } catch (error) {
    m.reply("An error occurred while downloading or sending the file.");
  }
};

handler.help = ["sendfile"];
handler.command = ["sendfile"];
handler.tags = ["utility"];
export default handler;
