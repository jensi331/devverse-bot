const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', () => {
    console.log(`🤖 Bot encendido como ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
    const channel = member.guild.channels.cache.find(
        c => c.name === '👋・welcome'
    );
    if (!channel) return;
    channel.send(
        `🌌 ¡Bienvenido a DevVerse Studios, ${member}! 🎮🚀\n\n` +
        `Nos alegra mucho tenerte aquí.\n\n` +
        `📜 Lee las reglas en <#1502432622305869965>\n` +
        `🎭 Elige tus roles en <#1502432549509664838>\n` +
        `🎫 Si necesitas ayuda, abre un ticket en <#1502442612127436960>\n\n` +
        `¡Disfruta la comunidad y crea algo increíble! 🌟`
    );
});

client.login(process.env.TOKEN);
