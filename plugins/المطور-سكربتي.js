import axios from "axios";

// ذاكرة مؤقتة لتخزين نتائج البحث
const appleMusicCache = new Map();

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // معالجة اختيار الأغنية بالرقم
  if (/^spotify\s+\d+$/i.test(m.text)) {
    const index = parseInt(m.text.match(/\d+/)[0]) - 1;
    const cacheKey = m.chat + '_' + m.sender;
    
    if (!appleMusicCache.has(cacheKey)) {
      return m.reply('⚠️ انتهت صلاحية النتائج، ابحث مرة أخرى!');
    }
    
    const results = appleMusicCache.get(cacheKey);
    if (index >= results.length || index < 0) {
      return m.reply('❌ رقم غير صالح!');
    }
    
    const selectedTrack = results[index];
    try {
      // جلب رابط التحميل
      const dlUrl = `https://delirius-apiofc.vercel.app/download/applemusicdl?url=${encodeURIComponent(selectedTrack.url)}`;
      const { data } = await axios.get(dlUrl);
      
      if (!data.status || !data.data.download) {
        throw new Error('فشل في الحصول على رابط التحميل');
      }

      // إرسال الأغنية
      await conn.sendMessage(m.chat, { 
        audio: { url: data.data.download }, 
        mimetype: 'audio/mpeg',
        contextInfo: {
          externalAdReply: {
            title: selectedTrack.title,
            body: `🎤 ${selectedTrack.artist}`,
            thumbnail: await (await conn.getFile(selectedTrack.image)).data,
            mediaType: 1
          }
        }
      }, { quoted: m });

    } catch (error) {
      console.error(error);
      m.reply('❌ فشل في تحميل الأغنية!');
    }
    return;
  }

  // عملية البحث الأساسية
  if (!text) return m.reply(`⚡ مثال الاستخدام:\n${usedPrefix}spotify twice`);
  
  try {
    const { data } = await axios.get(`https://delirius-apiofc.vercel.app/search/applemusicv2?query=${encodeURIComponent(text)}`);
    
    if (!data?.data?.length) {
      return m.reply('⚠️ لا توجد نتائج!');
    }

    // حفظ النتائج في الذاكرة المؤقتة
    const cacheKey = m.chat + '_' + m.sender;
    appleMusicCache.set(cacheKey, data.data);
    setTimeout(() => appleMusicCache.delete(cacheKey), 120000); // انتهاء بعد دقيقتين

    // إنشاء قائمة النتائج
    const songsList = data.data.map((song, i) => 
      `*${i + 1}.* 🎧 *${song.title}*\n` +
      `   👤 ${song.artist}\n` +
      `   📀 ${song.url.split('/').pop()}\n` +
      `━━━━━━━━━━━━━`
    ).join('\n');

    await conn.sendMessage(m.chat, {
      text: `🎵 *نتائج بحث Apple Music عن "${text}"*\n\n${songsList}\n\n` +
            `_رد برقم الأغنية للتحميل (مثال: ${usedPrefix}spotify 2)_\n` +
            `_النتائج صالحة لمدة 120 ثانية_`,
      contextInfo: {
        externalAdReply: {
          title: '🔍 Apple Music Search',
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
