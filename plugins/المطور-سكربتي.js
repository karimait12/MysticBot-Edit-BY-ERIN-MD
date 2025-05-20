import { generateWAMessageFromContent } from "baileys";
import axios from "axios";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply('أدخل اسم الأغنية للبحث\nمثال: *.spotify twice*');
  
  try {
    const apiUrl = `https://delirius-apiofc.vercel.app/search/spotify?q=${encodeURIComponent(text)}&limit=10`;
    const { data } = await axios.get(apiUrl);
    
    if (!data.status || !data.data.length) {
      return m.reply('⚠️ لم أجد أي نتائج!');
    }

    // إنشاء Grid أنيق
    const sections = [{
      title: `نتائج البحث: ${text}`,
      rows: data.data.map((song, index) => ({
        title: `${index + 1}. ${song.title}`,
        description: `🎤 ${song.artist} | ⏳ ${song.duration}\n📀 ${song.album}`,
        rowId: `${usedPrefix}spotifydl ${song.url}`,
        image: song.image
      }))
    }];

    const listMessage = {
      text: `🎵 *نتائج بحث Spotify* 🎵\n\nاختر الأغنية من القائمة:`,
      footer: `المطور: darlingg`,
      title: "𓆩 𝙎𝙋𝙊𝙏𝙄𝙁𝙔 𝙎𝙀𝘼𝙍𝘾𝙃 𓆪",
      buttonText: "النتائج 🔎",
      sections
    };

    await conn.sendMessage(m.chat, listMessage);
    
  } catch (error) {
    console.error(error);
    m.reply('حدث خطأ أثناء البحث!');
  }
};

handler.help = ['spotify <بحث>'];
handler.tags = ['music'];
handler.command = /^(سبوتيفاي|spotify)$/i;
export default handler;
