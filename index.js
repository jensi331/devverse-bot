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
        VERIFIED: '✅ Verificado',
        STAFF: '1502440224326684672'
    },
    CHANNELS: {
        WELCOME: '👋・welcome',
        RULES: '📜・rules',
        ROLES: '🎭・roles',
        GENERAL: '💬・general',
        LOGS: '📋・mod-logs',
        REPORTS: '🚨・reports',
        STATS: '📊・server-stats',
        TICKETS: '🎫・create-ticket'
    },
    CATEGORY_TICKETS: '🆘 AYUDA'
};

// READY
client.once('ready', () => {
    console.log(`✅ Bot listo como ${client.user.tag}`);
});


// =========================
// 🎉 BIENVENIDA
// =========================
client.on('guildMemberAdd', async (member) => {

    const role = member.guild.roles.cache.find(r => r.name === CONFIG.ROLES.NEW);
    if (role) member.roles.add(role);

    const welcomeChannel = member.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.WELCOME);
    const rulesChannel = member.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.RULES);
    const rolesChannel = member.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.ROLES);
    const generalChannel = member.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.GENERAL);

    const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🌌 ¡Bienvenido a DevVerse Studios! 🚀')
    .setThumbnail(member.user.displayAvatarURL())
    .setDescription(`
👋 Hola ${member}

📜 Lee las reglas → ${rulesChannel}
🎭 Escoge roles → ${rolesChannel}
💬 Preséntate → ${generalChannel}

🔥 ¡Crea juegos, aprende y crece!
`)
    .setFooter({ text: `Miembro #${member.guild.memberCount}` });

    welcomeChannel.send({ embeds: [embed] });
});


// =========================
// 🛡️ VERIFICACIÓN
// =========================
client.on('messageCreate', async (message) => {

    if (message.content === '!verify') {
        const embed = new EmbedBuilder()
        .setTitle('✅ Verificación')
        .setDescription('Haz click para acceder al servidor');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId('verify')
            .setLabel('Verificarme')
            .setStyle(ButtonStyle.Success)
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
});


// =========================
// 🎭 ROLES PANEL
// =========================
client.on('messageCreate', async (message) => {

    if (message.content === '!roles') {
        const embed = new EmbedBuilder()
        .setTitle('🎭 Selecciona tus roles')
        .setDescription(`
🎮 Desarrollador
🎨 Diseñador UI
🧠 Scripter
🎥 Creador
📱 TikTok
🔔 Notificaciones
`);

        const msg = await message.channel.send({ embeds: [embed] });

        await msg.react('🎮');
        await msg.react('🎨');
        await msg.react('🧠');
        await msg.react('🎥');
        await msg.react('📱');
        await msg.react('🔔');
    }
});


// =========================
// 🎫 SETUP TICKETS
// =========================
client.on('messageCreate', async (message) => {

    if (message.content === '!tickets') {
        const embed = new EmbedBuilder()
        .setTitle('🎫 Soporte DevVerse')
        .setDescription('Selecciona una opción');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_support').setLabel('Soporte').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('ticket_bug').setLabel('Bug').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('ticket_buy').setLabel('Compras').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('ticket_report').setLabel('Reporte').setStyle(ButtonStyle.Secondary)
        );

        message.channel.send({ embeds: [embed], components: [row] });
    }
});


// =========================
// 🎯 INTERACCIONES
// =========================
client.on('interactionCreate', async (interaction) => {

    if (!interaction.isButton()) return;

    // VERIFICACIÓN
    if (interaction.customId === 'verify') {
        const role = interaction.guild.roles.cache.find(r => r.name === CONFIG.ROLES.VERIFIED);
        if (role) interaction.member.roles.add(role);

        return interaction.reply({ content: '✅ Verificado!', ephemeral: true });
    }

    // TICKETS
    if (interaction.customId.startsWith('ticket_')) {

        let type = interaction.customId.split('_')[1];

        const category = interaction.guild.channels.cache.find(c => c.name === CONFIG.CATEGORY_TICKETS);

        const channel = await interaction.guild.channels.create({
            name: `${type}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: category?.id,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: CONFIG.ROLES.STAFF, allow: [PermissionFlagsBits.ViewChannel] }
            ]
        });

        const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket ${type}`)
        .setDescription('Describe tu problema');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Cerrar')
            .setStyle(ButtonStyle.Danger)
        );

        channel.send({ content: `${interaction.user}`, embeds: [embed], components: [row] });

        interaction.reply({ content: `Ticket creado: ${channel}`, ephemeral: true });
    }

    // CERRAR
    if (interaction.customId === 'close_ticket') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: 'Solo staff', ephemeral: true });
        }

        interaction.reply('Cerrando...');
        setTimeout(() => interaction.channel.delete(), 3000);
    }
});


// =========================
// 🚨 REPORTES
// =========================
client.on('messageCreate', (message) => {

    if (message.content.startsWith('!report')) {

        const user = message.mentions.users.first();
        const reason = message.content.split(' ').slice(2).join(' ');

        const channel = message.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.REPORTS);

        const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🚨 Reporte')
        .addFields(
            { name: 'Usuario', value: `${user}` },
            { name: 'Razón', value: reason }
        );

        channel.send({ embeds: [embed] });
    }
});


// =========================
// 🔨 MODERACIÓN
// =========================
client.on('messageCreate', async (message) => {

    if (!message.content.startsWith('!')) return;

    const args = message.content.split(' ');

    if (args[0] === '!ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;

        const user = message.mentions.members.first();
        await user.ban();

        message.reply('Usuario baneado');
    }

    if (args[0] === '!kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return;

        const user = message.mentions.members.first();
        await user.kick();

        message.reply('Usuario expulsado');
    }
});


// =========================
// 📊 STATS AUTOMÁTICOS
// =========================
setInterval(() => {
    const guild = client.guilds.cache.first();
    const channel = guild.channels.cache.find(c => c.name.includes('Miembros'));

    if (channel) {
        channel.setName(`👥 Miembros: ${guild.memberCount}`);
    }
}, 600000);


// =========================
// 🎭 ROLES REACCIÓN
// =========================
client.on('messageReactionAdd', async (reaction, user) => {

    if (user.bot) return;

    const member = reaction.message.guild.members.cache.get(user.id);
    const emoji = reaction.emoji.name;

    const roles = {
        '🎮': '🎮 Desarrollador',
        '🎨': '🎨 Diseñador UI',
        '🧠': '🧠 Scripter',
        '🎥': '🎥 Creador de Contenido',
        '📱': '📱 TikTok Team',
        '🔔': '🔔 Notificaciones'
    };

    const roleName = roles[emoji];
    if (!roleName) return;

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (role) member.roles.add(role);
});


// =========================
// 🚨 LOGS MENSAJES BORRADOS
// =========================
client.on('messageDelete', (message) => {

    const channel = message.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.LOGS);

    const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Mensaje eliminado')
    .setDescription(message.content || 'Sin texto');

    channel.send({ embeds: [embed] });
});


client.login(process.env.TOKEN);
