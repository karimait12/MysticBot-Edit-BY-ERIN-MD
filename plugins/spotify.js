import axios from 'axios';

const handler = async (m, { conn, args, command }) => {
  const text = args[0];

  if (!text) {
    return m.reply(
      `🧞 طريقة الاستخدام:\n` +
      `أرسل الأمر *.${command}* متبوعًا برابط أو ID المسار من سبوتيفاي.\n` +
      `مثال:\n.spotify https://open.spotify.com/track/xxxxxxxxxxxxxxxxxxxxxx\n\n` +
      `🅜🅘🅝🅐🅣🅞 🅑🅞🅣🧞`
    );
  }

  await conn.sendMessage(m.chat, {
    react: {
      text: "🧞",
      key: m.key
    }
  });

  const result = await spotiDown(text);

  if (!result.status) {
    return m.reply(`🧞 ${result.result.error}\n\n🅜🅘🅝🅐🅣🅞 🅑🅞🅣🧞`);
  }

  const { title, artist, album, duration, image, download, trackId } = result.result;
  const caption =
    `🧞 *تم التحميل من Spotify:*\n\n` +
    `🎵 *العنوان:* ${title}\n` +
    `🧑‍🎤 *الفنان:* ${artist}\n` +
    `💿 *الألبوم:* ${album}\n` +
    `⏱️ *المدة:* ${duration}\n\n` +
    `🅜🅘🅝🅐🅣🅞 🅑🅞🅣🧞`;

  try {
    const audioRes = await axios.get(download, { responseType: 'arraybuffer' });

    await conn.sendMessage(m.chat, {
      text: caption,
      contextInfo: {
        externalAdReply: {
          title: title,
          body: 'Spotify 🧞',
          thumbnailUrl: image,
          sourceUrl: `https://open.spotify.com/track/${trackId}`,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

    await conn.sendMessage(m.chat, {
      audio: Buffer.from(audioRes.data),
      mimetype: 'audio/mp4',
      fileName: `${artist} - ${title}.mp3`,
      ptt: false
    }, { quoted: m });

  } catch (err) {
    console.error(err);
    m.reply('🧞 حدث خطأ أثناء إرسال الملف الصوتي. حاول مرة أخرى لاحقًا.\n\n🅜🅘🅝🅐🅣🅞 🅑🅞🅣🧞');
  }
};

handler.command = ['spotify1', 'spot', 'سبوتيفاي'];
handler.help = ['spotify1 <link/id>', 'سبوتيفاي <رابط/معرف>'];
handler.tags = ['downloader'];
handler.limit = true;

export default handler;

async function spotiDown(url) {
  const extractId = (input) => {
    const patterns = [
      /spotify\.com\/track\/([a-zA-Z0-9]{22})/,
      /spotify:track:([a-zA-Z0-9]{22})/,
      /^([a-zA-Z0-9]{22})$/
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const trackId = extractId(url);
  if (!trackId) {
    return {
      status: false,
      code: 400,
      result: {
        error: !url
          ? "🧞 أين الرابط؟ الحقل فاضي يا زعيم 🗿"
          : "🧞 رابط غير صالح! تأكد من الشكل الصحيح 😑"
      }
    };
  }

  const fullUrl = `https://open.spotify.com/track/${trackId}`;

  try {
    const response = await axios.post(
      'https://parsevideoapi.videosolo.com/spotify-api/',
      { format: 'web', url: fullUrl },
      {
        headers: {
          'authority': 'parsevideoapi.videosolo.com',
          'user-agent': 'Postify/1.0.0',
          'referer': 'https://spotidown.online/',
          'origin': 'https://spotidown.online'
        }
      }
    );

    const { status, data } = response.data;

    if (status === "-4") {
      return {
        status: false,
        code: 400,
        result: {
          error: "🧞 الرابط غير مدعوم. فقط مسارات (Tracks) مسموحة 😂"
        }
      };
    }

    const meta = data?.metadata;
    if (!meta || Object.keys(meta).length === 0) {
      return {
        status: false,
        code: 404,
        result: {
          error: "🧞 لم يتم العثور على معلومات عن المسار. جرب رابطًا آخر!"
        }
      };
    }

    return {
      status: true,
      code: 200,
      result: {
        title: meta.name,
        artist: meta.artist,
        album: meta.album,
        duration: meta.duration,
        image: meta.image,
        download: meta.download,
        trackId
      }
    };
  } catch (error) {
    return {
      status: false,
      code: error.response?.status || 500,
      result: {
        error: "🧞 فشل في جلب بيانات المسار من سبوتيفاي 🙈"
      }
    };
  }
}
