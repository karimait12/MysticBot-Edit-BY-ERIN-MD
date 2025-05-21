const axios = require('axios');
const fs = require('fs');
const path = require('path');

let handler = async (m, { conn, args }) => {
    try {
        const url = args[0];
        
        if (!url) throw '❗ يرجى إدخال رابط فيديو الفيسبوك\nمثال: .fb https://www.facebook.com/...';

        // تحقق من رابط الفيسبوك
        if (!/(facebook\.com|fb\.watch)/i.test(url)) {
            throw '⚠️ هذا ليس رابط فيديو فيسبوك صحيح';
        }

        // إرسال رد فعل انتظار
        await m.react('⏳');

        // جلب بيانات الفيديو من API
        const apiUrl = `https://api.dreaded.site/api/facebook?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data?.facebook?.hdVideo && !data?.facebook?.sdVideo) {
            throw '❌ تعذر العثور على الفيديو، يرجى التأكد من الرابط';
        }

        const videoUrl = data.facebook.hdVideo || data.facebook.sdVideo;
        const videoTitle = data.facebook.title || "فيديو فيسبوك";

        // إنشاء مجلد مؤقت
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // مسار الملف المؤقت
        const tempFile = path.join(tmpDir, `fb_${Date.now()}.mp4`);

        // تنزيل الفيديو
        const videoResponse = await axios({
            method: 'GET',
            url: videoUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.facebook.com/'
            }
        });

        const writer = fs.createWriteStream(tempFile);
        videoResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // إرسال الفيديو
        await conn.sendMessage(m.chat, {
            video: fs.readFileSync(tempFile),
            mimetype: "video/mp4",
            caption: `🎬 ${videoTitle}\nتم التنزيل بواسطة البوت`
        }, { quoted: m });

        // حذف الملف المؤقت
        fs.unlinkSync(tempFile);
        
        await m.react('✅');

    } catch (error) {
        await m.react('❌');
        throw `❌ حدث خطأ: ${error.message || error}`;
    }
};

handler.help = ['fb <رابط>'];
handler.tags = ['downloader'];
handler.command = /^(fb|فيسبوك|فيس)$/i;

export default handler;
