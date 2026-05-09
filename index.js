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

// --- CONFIGURACIÓN DE IDs ---
// Jensi, rellena estos IDs de tu servidor para que todo funcione perfecto
const CONFIG = {
    CHANNELS: {
        WELCOME: '👋・welcome',
        RULES: '📜・rules',
        MOD_LOGS: '📋・mod-logs',
        TICKET_CREATE: '🎫・create-ticket',
        TICKET_LOGS: 'ticket-logs', // ID del canal de logs de tickets
        ROLES_SELECT: '🎭・roles'
    },
    ROLES: {
        NEW_MEMBER: '👋 Nuevo Miembro',
        STAFF_ROLE_ID: '1234567890', // Pon el ID del rol Moderador o Administrador aquí
        NOTIFICATIONS: '🔔 Notificaciones'
    },
    CATEGORY_TICKETS: 'SOPORTE' // Nombre de la categoría donde se abrirán
};

client.once('ready', () => {
    console.log(`✅ DevVerse Bot encendido y patrullando como ${client.user.tag}`);
});

// 1. BIENVENIDA DESARROLLADA Y AUTO-ROLE
client.on('guildMemberAdd', async (member) => {
    // Asignar rol inicial
    const initialRole = member.guild.roles.cache.find(r => r.name === CONFIG.ROLES.NEW_MEMBER);
    if (initialRole) member.roles.add(initialRole);

    const welcomeChannel = member.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.WELCOME);
    if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🌌 ¡Bienvenido a DevVerse Studios! 🎮🚀')
            .setThumbnail(member.user.displayAvatarURL())
            .setDescription(`¡Hola ${member}! Bienvenido al centro de creación más grande.\n\n` +
                `🔹 **Paso 1:** Lee las <#${member.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.RULES)?.id}>\n` +
                `🔹 **Paso 2:** Elige tus intereses en <#${member.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.ROLES_SELECT)?.id}>\n` +
                `🔹 **Paso 3:** ¡Crea algo increíble con nosotros!`)
            .setImage('https://i.imgur.com/your-dev-banner.png') // Puedes poner un banner aquí
            .setFooter({ text: `Eres el miembro número ${member.guild.memberCount}` });

        welcomeChannel.send({ content: `¡Miren quién llegó! 👋`, embeds: [welcomeEmbed] });
    }
});

// 2. LOGS DE MENSAJES ELIMINADOS
client.on('messageDelete', async (message) => {
    if (message.author.bot) return;
    const logChannel = message.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.MOD_LOGS);
    if (logChannel) {
        const logEmbed = new EmbedBuilder()
            .setColor('#FF4D4D')
            .setTitle('🚨 Mensaje Eliminado')
            .addFields(
                { name: 'Autor:', value: `${message.author.tag}`, inline: true },
                { name: 'Canal:', value: `${message.channel}`, inline: true },
                { name: 'Contenido:', value: message.content || 'Sin texto (posible imagen)' }
            )
            .setTimestamp();
        logChannel.send({ embeds: [logEmbed] });
    }
});

// 3. COMANDOS DE MODERACIÓN (Ban y Kick)
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // BAN
    if (command === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;
        const target = message.mentions.members.first();
        if (!target) return message.reply('Menciona a alguien para banear.');
        await target.ban({ reason: args.slice(1).join(' ') || 'Sin razón especificada' });
        message.reply(`✅ ${target.user.tag} ha sido baneado.`);
    }

    // SETUP ROLES CON EMOJIS (Panel)
    if (command === 'setup-roles' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const roleChannel = message.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.ROLES_SELECT);
        const embed = new EmbedBuilder()
            .setTitle('🎭 Selección de Roles')
            .setDescription('Reacciona para obtener tu rol:\n\n🔔 - Notificaciones\n🎮 - Desarrollador\n🎥 - TikTok Team')
            .setColor('#5865F2');

        const msg = await roleChannel.send({ embeds: [embed] });
        await msg.react('🔔');
        await msg.react('🎮');
        await msg.react('🎥');
    }

    // SETUP TICKETS
    if (command === 'setup-tickets' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const ticketChan = message.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.TICKET_CREATE);
        const embed = new EmbedBuilder()
            .setTitle('🎫 Soporte Técnico DevVerse')
            .setDescription('Si tienes un problema, haz clic abajo.\n\n**Requisitos:**\n- Nombre de usuario\n- Captura del problema\n- Descripción detallada')
            .setColor('#2ECC71');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_ticket').setLabel('Abrir Ticket').setStyle(ButtonStyle.Success).setEmoji('📩')
        );

        await ticketChan.send({ embeds: [embed], components: [row] });
    }
});

// 4. SISTEMA DE TICKETS (Avanzado)
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'open_ticket') {
        const ticketName = `ticket-${interaction.user.username}`;
        const category = interaction.guild.channels.cache.find(c => c.name === CONFIG.CATEGORY_TICKETS && c.type === ChannelType.GuildCategory);

        const channel = await interaction.guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: category ? category.id : null,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                { id: CONFIG.ROLES.STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const closeRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
        );

        await channel.send({ 
            content: `👋 Hola ${interaction.user}, el Staff te atenderá pronto.`,
            embeds: [new EmbedBuilder().setTitle('Detalla tu problema').setDescription('Por favor, escribe tu nombre de usuario y lo que sucede.')],
            components: [closeRow]
        });

        await interaction.reply({ content: `✅ Ticket creado en ${channel}`, ephemeral: true });
    }

    if (interaction.customId === 'close_ticket') {
        // Solo staff puede cerrar
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: 'Solo el Staff puede cerrar el ticket.', ephemeral: true });
        }

        const logChannel = interaction.guild.channels.cache.find(c => c.name === CONFIG.CHANNELS.TICKET_LOGS);
        if (logChannel) {
            logChannel.send(`📁 Ticket **${interaction.channel.name}** cerrado por **${interaction.user.tag}**`);
        }

        await interaction.reply('Cerrando canal en 5 segundos...');
        setTimeout(() => interaction.channel.delete(), 5000);
    }
});

// 5. ASIGNACIÓN DE ROLES POR REACCIÓN
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    
    const { name } = reaction.emoji;
    const member = reaction.message.guild.members.cache.get(user.id);
    
    let roleName = '';
    if (name === '🔔') roleName = '🔔 Notificaciones';
    if (name === '🎮') roleName = '🎮 Desarrollador';
    if (name === '🎥') roleName = '🎥 TikTok Team';

    const role = reaction.message.guild.roles.cache.find(r => r.name === roleName);
    if (role) await member.roles.add(role);
});

client.login(process.env.TOKEN);
