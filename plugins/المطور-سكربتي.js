import axios from "axios";

// تخزين مؤقت للنتائج
const spotifyCache = new Map();

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // معالجة الأوامر الفرعية (الاختيار بالرقم)
  if (/^spotify\s+\d+$/i.test(m.text)) {
    const index = parseInt(m.text.match(/\d+/)[0]) - 1;
    const cacheKey = m.chat + '_' + m.sender;
    
    if (!spotifyCache.has(cacheKey)) {
      return m.reply('انتهت صلاحية النتائج، ابحث مرة أخرى!');
    }
    
    const results = spotifyCache.get(cacheKey);
    if (index >= results.length) {
      return m.reply('رقم غير صالح!');
    }
    
    const song = results[index];
    await m.reply(`⬇️ جاري تحميل: *${song.title}*...`);
    // أضف هنا كود التحميل الفعلي
    return conn.sendMessage(m.chat, { 
      audio: { url: song.preview_url }, 
      mimetype: 'audio/mpeg', 
      contextInfo: { externalAdReply: {
        title: song.title,
        body: `🎤 ${song.artist}`,
        thumbnail: await (await conn.getFile(song.image)).data
      }}
    });
  }

  // البحث العادي
  if (!text) return m.reply(`⚡ مثال الاستخدام:\n${usedPrefix}spotify twice`);
  
  try {
    const { data } = await axios.get(`https://delirius-apiofc.vercel.app/search/spotify?q=${encodeURIComponent(text)}&limit=10`);
    
    if (!data?.data?.length) {
      return m.reply('⚠️ لا توجد نتائج!');
    }

    // حفظ النتائج في الذاكرة المؤقتة
    const cacheKey = m.chat + '_' + m.sender;
    spotifyCache.set(cacheKey, data.data);
    setTimeout(() => spotifyCache.delete(cacheKey), 60000); // انتهاء بعد دقيقة

    // إنشاء قائمة مرقمة
    const songsList = data.data.map((song, i) => 
      `*${i + 1}.* [${song.duration}] ─ 🎧 *${song.title}*\n` +
      `   👤 ${song.artist}\n` +
      `   📀 ${song.album}\n` +
      `   📆 ${song.publish}\n` +
      `   ⭐ ${song.popularity}\n━━━━━━━━━━━━━`
    ).join('\n');

    await conn.sendMessage(m.chat, {
      text: `🎵 *نتائج بحث Spotify عن "${text}"*\n\n${songsList}\n\n` +
            `_رد برقم الأغنية للتحميل (مثال: ${usedPrefix}spotify 2)_\n` +
            `_النتائج صالحة لمدة 60 ثانية_`,
      contextInfo: {
        externalAdReply: {
          title: '🔍 Spotify Search',
          body: 'اختر أغنية للتحميل',
          thumbnail: await (await conn.getFile(data.data[0].image)).data,
          mediaType: 1
        }
      }
    });

  } catch (error) {
    console.error(error);
    m.reply('❌ حدث خطأ في البحث!');
  }
};

handler.help = ['spotify <بحث>'];
handler.tags = ['music'];
handler.command = /^(سبوتيفاي|spotify)$/i;
export default handler;
