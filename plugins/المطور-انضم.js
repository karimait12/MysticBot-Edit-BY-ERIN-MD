import axios from "axios";

let handler = async (m, { text }) => {
  if (!text) return m.reply("Please enter text to get a response from AI.");

  try {
    let { data } = await axios.get(
      `https://innova.shawrma.store/api/v1/gpt3?text=${encodeURIComponent(text)}&prompt=انت+مساعد+في+شركتي+اسمك+مساعد+كريم`
    );

    if (data.status && data.response) {
      m.reply(data.response);
    } else {
      m.reply("Failed to get response from AI.");
    }
  } catch (error) {
    m.reply("An error occurred while contacting the AI server.");
  }
};

handler.help = ["ai"];
handler.command = ["ai"];
handler.tags = ["ai"];
export default handler;
