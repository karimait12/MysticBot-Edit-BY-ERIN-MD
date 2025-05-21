let handler = async (m, { conn, args, participants }) => {
  if (!m.mentionedJid[0] && !m.quoted) throw '*منشن الشخص اللي عايز تطرده أو قم بالرد على رسالته*'
  
  let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender
  let isAdmin = participants.find(p => p.id === m.sender)?.admin === 'admin'
  
  if (!isAdmin) throw '*عذراً، هذا الأمر للمشرفين فقط!*'
  
  await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
  await m.reply(`*تم طرد العضو بنجاح* 🚷\n*مع السلامة يا @${user.split('@')[0]}*`, null, { mentions: [user] })
}

handler.command = /^(طرد|kick)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true
export default handler
