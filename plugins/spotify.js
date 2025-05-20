import axios from 'axios';

async function spotifydl(spotifyUrl) {
    try {
        const apiUrl = `https://api.fabdl.com/spotify/get?url=${encodeURIComponent(spotifyUrl)}`;
        const response = await axios.get(apiUrl);
        const trackData = response.data.result;

        if (!trackData) {
            throw new Error('Failed to retrieve track information from Spotify.');
        }

        const { id, name, image, artists, duration_ms } = trackData;
        const convertUrl = `https://api.fabdl.com/spotify/mp3-convert-task/${trackData.gid}/${id}`;
        const conversionResponse = await axios.get(convertUrl);
        const conversionData = conversionResponse.data.result;

        if (!conversionData || !conversionData.download_url) {
            throw new Error('Failed to retrieve MP3 download URL from the conversion task.');
        }

        const downloadUrl = `https://api.fabdl.com${conversionData.download_url}`;

        return {
            artist: artists,
            title: name,
            duration: Math.ceil(duration_ms / 1000),
            thumbnail: image,
            audioUrl: downloadUrl
        };
    } catch (error) {
        console.error('Error retrieving Spotify data:', error);
        return { error: 'Failed to fetch Spotify data', status: 1 };
    }
}

let handler = async (m, { conn, args }) => {
    const [url] = args;

    if (!url) {
        return conn.reply(m.chat, 'Please provide a Spotify track URL. \n.spotify https://open.spotify.com/track/2Tp8vm7MZIb1nnx1qEGYv5', m);
    }

    try {
        const trackInfo = await spotifydl(url);

        if (trackInfo.error) {
            return conn.reply(m.chat, `❌ Error: ${trackInfo.error}`, m);
        }

        const caption = `🎵 *Spotify Downloader*\n\n🔹 *Title:* ${trackInfo.title}\n🔹 *Artist:* ${trackInfo.artist}\n🔹 *Duration:* ${trackInfo.duration} sec`;

        await conn.sendMessage(m.chat, {
            image: { url: trackInfo.thumbnail },
            caption
        }, { quoted: m });

        await conn.sendMessage(m.chat, {
            document: { url: trackInfo.audioUrl },
            mimetype: 'audio/mp3',
            fileName: `${trackInfo.title}.mp3`,
            caption: '🎧 Your Spotify track is ready!'
        }, { quoted: m });

    } catch (error) {
        conn.reply(m.chat, `❌ Error: ${error.message}`, m);
    }
};

handler.help = ['spotify1'];
handler.tags = ['downloader'];
handler.command = ['spotify1'];
//handler.limit = true
export default handler;
