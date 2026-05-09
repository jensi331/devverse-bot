const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    PermissionFlagsBits,
    Partials
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const CONFIG = {
    ROLES: {
        NEW: '👋 Nuevo Miembro',
        MEMBER: '✅ Miembro',
        STAFF: '1502440224326684672'
    },
    CHANNELS: {
        WELCOME: '👋・welcome',
        RULES: '📜・rules',
        ROLES: '🎭・roles'
    }
};

client.once('ready', () => {
    console.log(`🔥 Bot PRO activo como ${client.user.tag}`);
});


// =========================
// 👋 ENTRADA + VERIFICACIÓN
// =========================
client.on('guildMemberAdd', async (member) => {

    const newRole = member.guild.roles.cache.find(r => r.name === CONFIG.ROLES.NEW);
    if (newRole) await member.roles.add(newRole);

    const welcomeChannel = member.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.WELCOME);

    const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('👋 Bienvenido a DevVerse')
    .setDescription(`
👋 Hola ${member}

🚫 No tienes acceso aún

📜 Lee las reglas
✅ Luego verifica tu cuenta

👇 Presiona el botón para entrar
`);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId('verify_user')
        .setLabel('Verificarme')
        .setStyle(ButtonStyle.Success)
    );

    welcomeChannel.send({ embeds: [embed], components: [row] });
});


// =========================
// ✅ BOTÓN VERIFICACIÓN
// =========================
client.on('interactionCreate', async (interaction) => {

    if (!interaction.isButton()) return;

    if (interaction.customId === 'verify_user') {

        const newRole = interaction.guild.roles.cache.find(r => r.name === CONFIG.ROLES.NEW);
        const memberRole = interaction.guild.roles.cache.find(r => r.name === CONFIG.ROLES.MEMBER);

        if (newRole) await interaction.member.roles.remove(newRole);
        if (memberRole) await interaction.member.roles.add(memberRole);

        await interaction.reply({ content: '✅ Ya estás verificado. Bienvenido!', ephemeral: true });

        // BORRAR MENSAJE DE VERIFICACIÓN (opcional)
        setTimeout(() => {
            interaction.message.delete().catch(() => {});
        }, 3000);
    }
});


// =========================
// 🎭 PANEL DE ROLES AUTOMÁTICO
// =========================
client.on('ready', async () => {

    const guild = client.guilds.cache.first();
    const channel = guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.ROLES);

    const embed = new EmbedBuilder()
    .setTitle('🎭 Selecciona tus roles')
    .setDescription(`
Reacciona para obtener roles:

🎮 → Desarrollador  
🎨 → Diseñador UI  
🧠 → Scripter  
🎥 → Creador  
📱 → TikTok Team  
🔔 → Notificaciones  
`);

    const msg = await channel.send({ embeds: [embed] });

    await msg.react('🎮');
    await msg.react('🎨');
    await msg.react('🧠');
    await msg.react('🎥');
    await msg.react('📱');
    await msg.react('🔔');
});


// =========================
// 🎭 ROLES POR REACCIÓN (ARREGLADO)
// =========================
client.on('messageReactionAdd', async (reaction, user) => {

    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();

    const member = reaction.message.guild.members.cache.get(user.id);

    const rolesMap = {
        '🎮': '🎮 Desarrollador',
        '🎨': '🎨 Diseñador UI',
        '🧠': '🧠 Scripter',
        '🎥': '🎥 Creador de Contenido',
        '📱': '📱 TikTok Team',
        '🔔': '🔔 Notificaciones'
    };

    const roleName = rolesMap[reaction.emoji.name];
    if (!roleName) return;

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (role) await member.roles.add(role);
});


// =========================
// ❌ QUITAR ROL AL DESREACCIONAR
// =========================
client.on('messageReactionRemove', async (reaction, user) => {

    if (user.bot) return;

    if (reaction.partial) await reaction.fetch();

    const member = reaction.message.guild.members.cache.get(user.id);

    const rolesMap = {
        '🎮': '🎮 Desarrollador',
        '🎨': '🎨 Diseñador UI',
        '🧠': '🧠 Scripter',
        '🎥': '🎥 Creador de Contenido',
        '📱': '📱 TikTok Team',
        '🔔': '🔔 Notificaciones'
    };

    const roleName = rolesMap[reaction.emoji.name];
    if (!roleName) return;

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (role) await member.roles.remove(role);
});


client.login(process.env.TOKEN);
