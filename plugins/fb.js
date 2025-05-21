import axios from 'axios';

const handler = async (m, { conn, args, command }) => {
  const url = args[0];

  if (!url) {
    return m.reply(
      `🧞 طريقة الاستخدام:\n` +
      `أرسل الأمر *.${command}* متبوعًا برابط فيديو الفيسبوك.\n` +
      `مثال:\n.fb https://www.facebook.com/... \n\n` +
      `🅜🅘🅝🅐🅣🅞 🅑🅞🅣🧞`
    );
  }

  await conn.sendMessage(m.chat, {
    react: {
      text: "⏳",
      key: m.key
    }
  });

  const result = await fbDownloader(url);

  if (!result.status) {
    return m.reply(`🧞 ${result.result.error}\n\n🅜🅘🅝🅐🅣🅞 🅑🅞🅣🧞`);
  }

  const { title, download, image } = result.result;
  const caption =
    `🧞 *تم التحميل من Facebook:*\n\n` +
    `🎥 *العنوان:* ${title}\n\n` +
    `🅜🅘🅝🅐🅣🅞 🅑🅞🅣🧞`;

  try {
    const videoRes = await axios.get(download, { responseType: 'arraybuffer' });

    await conn.sendMessage(m.chat, {
      text: caption,
      contextInfo: {
        externalAdReply: {
          title: title,
          body: 'Facebook 🧞',
          thumbnailUrl: image,
          sourceUrl: url,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

    await conn.sendMessage(m.chat, {
      video: Buffer.from(videoRes.data),
      mimetype: 'video/mp4',
      fileName: `${title}.mp4`
    }, { quoted: m });

    await conn.sendMessage(m.chat, {
      react: {
        text: "✅",
        key: m.key
      }
    });
  } catch (err) {
    console.error(err);
    await conn.sendMessage(m.chat, {
      react: {
        text: "❌",
        key: m.key
      }
    });
    m.reply('🧞 حدث خطأ أثناء إرسال الفيديو. حاول مرة أخرى لاحقًا.\n\n🅜🅘🅝🅐🅣🅞 🅑🅞🅣🧞');
  }
};

handler.command = ['fb', 'facebook', 'فيسبوك'];
handler.help = ['fb <link>', 'فيسبوك <رابط>'];
handler.tags = ['downloader'];
handler.limit = true;

export default handler;

async function fbDownloader(url) {
  if (!/(facebook\.com|fb\.watch)/i.test(url)) {
    return {
      status: false,
      code: 400,
      result: {
        error: "🧞 هذا ليس رابط فيديو فيسبوك صحيح"
      }
    };
  }

  try {
    const apiUrl = `https://delirius-apiofc.vercel.app/download/facebook?url=${encodeURIComponent(url)}`;
    const { data } = await axios.get(apiUrl);

    if (!data?.urls?.length) {
      return {
        status: false,
        code: 404,
        result: {
          error: "🧞 لم يتم العثور على الفيديو. تأكد من الرابط!"
        }
      };
    }

    return {
      status: true,
      code: 200,
      result: {
        title: data.title,
        image: data.image || '',
        download: data.urls[0].hd || data.urls[0].sd
      }
    };
  } catch (error) {
    return {
      status: false,
      code: error.response?.status || 500,
      result: {
        error: "🧞 فشل في جلب بيانات الفيديو من فيسبوك 🙈"
      }
    };
  }
}
