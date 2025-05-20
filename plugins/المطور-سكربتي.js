import axios from "axios";
import { generateWAMessageFromContent } from "baileys";

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply('أدخل اسم الأغنية للبحث\nمثال: *.spotify twice*');
  
  try {
    const apiUrl = `https://delirius-apiofc.vercel.app/search/spotify?q=${encodeURIComponent(text)}&limit=10`;
    const { data } = await axios.get(apiUrl);
    
    if (!data.status || !data.data.length) {
      return m.reply('⚠️ لم أجد أي نتائج!');
    }

    // إنشاء قائمة تفاعلية مع صور
    const listItems = data.data.map((song, index) => ({
      title: `${index + 1}. ${song.title}`,
      description: `🎤 الفنان: ${song.artist}\n⏳ المدة: ${song.duration}\n📀 الألبوم: ${song.album}`,
      image: song.image,
      buttonText: "تحميل 🎧",
      buttonId: `${usedPrefix}spotifydl ${song.url}`
    }));

    const message = {
      text: `🎵 *نتائج بحث Spotify* 🎵\n${text}\n\nإجمالي النتائج: ${data.data.length}`,
      footer: "اختر رقم الأغنية للتحميل",
      title: "𓆩 Spotify Search 𓆪",
      buttonText: "عرض النتائج",
      sections: [{
        title: "الأغاني المتاحة",
        rows: listItems.map((item, index) => ({
          title: item.title,
          description: item.description,
          rowId: item.buttonId,
          image: item.image
        }))
      }]
    };

    await conn.sendMessage(m.chat, message);
    
  } catch (error) {
    console.error(error);
    m.reply('حدث خطأ أثناء البحث!');
  }
};

handler.help = ['spotify <بحث>'];
handler.tags = ['music'];
handler.command = /^(سبوتيفاي|spotify)$/i;
export default handler;
