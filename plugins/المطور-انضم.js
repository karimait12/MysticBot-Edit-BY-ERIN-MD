let handler = async (m, { conn, text, usedPrefix, command, args, participants, isOwner }) => {

    if (!isOwner) return conn.sendButton(
        m.chat, 
        `*دعوة البوت إلى مجموعة*\n\nيا @${m.sender.split('@')[0]}\nلو عاوز تضيف البوت لمجموعة، كلم الأونر عشان يظبطلك الموضوع.`, 
        '© Waleed Bot', 
        null, 
        [['اتصل بالأونر', `${usedPrefix}buyprem`]], 
        m, 
        { mentions: [m.sender] }
    )

    let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i
    let delay = time => new Promise(res => setTimeout(res, time))

    let [_, code] = text.match(linkRegex) || []
    if (!args[0]) throw `✠ ابعت رابط الجروب يا زعيم\n\n📌 مثال:\n*${usedPrefix + command}* <الرابط>`
    if (!code) throw `✠ الرابط ده مش مظبوط يا فندم!`

    await m.reply('😎 استنى عليا ثواني، هدخل الجروب حالاً')
    await delay(3000)
    
    try {
        let res = await conn.groupAcceptInvite(code)
        let b = await conn.groupMetadata(res)
        let d = b.participants.map(v => v.id)
        let groupName = await conn.getName(res)

        await m.reply(`✅ البوت دخل الجروب بنجاح!\n\n✠ معلومات الجروب:\n*الاسم:* ${groupName}\n`)
        
        await conn.reply(
            res, 
            `🏮 أهلاً بالجميع!\n\n@${m.sender.split('@')[0]} هو اللي دعاني`, 
            m, 
            { mentions: d }
        )
        
        await delay(7000)
        await conn.reply(res, 'فليهدأ الجميع! 🤭', null)
        
    } catch (e) {
        await conn.reply(global.owner[1] + '@s.whatsapp.net', e.toString())
        throw 'في مشكلة في دعوة البوت للجروب.'
    }
}

handler.help = ['join <chat.whatsapp.com>']
handler.tags = ['owner']
handler.command = ['join', 'انضم']
handler.owner = true

export default handler
