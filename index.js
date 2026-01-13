const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  SlashCommandBuilder,
  Routes,
  EmbedBuilder
} = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1460601983097635050';
const POPCAT_ID = '1460612078472794239';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== SLASH COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustaw kanał do testu aktywności')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Kanał')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij wiadomość jako embed')
    .addStringOption(option =>
      option.setName('wiadomosc')
        .setDescription('Treść embeda')
        .setRequired(true)
    )
].map(c => c.toJSON());

// ===== REGISTER =====
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('Rejestruję komendy...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Komendy gotowe!');
  } catch (e) {
    console.error(e);
  }
})();

// ===== READY =====
client.once('ready', () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
  client.user.setActivity('Aktywność Serwera');
});

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko administrator.', ephemeral: true });
  }

  // /setup
  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: channel.id }));
    return interaction.reply({ content: '✅ Kanał zapisany.', ephemeral: true });
  }

  // /aktywnosc
  if (interaction.commandName === 'aktywnosc') {
    await interaction.deferReply({ ephemeral: true });

    const config = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(config.channelId);

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`💜 **WITAJCIE, Elicatowo!** 💜
👑 Sprawdzamy kto jest najaktywniejszy!
💬 Pisz, reaguj, bądź widoczny!
**AKTYWNOŚĆ = RESPEKT**`)
      .setColor(0x9b59b6)
      .setFooter({ text: `Test wygenerowany przez ${interaction.user.tag}` })
      .setTimestamp();

    const msg = await channel.send({ content: '@everyone', embeds: [embed] });
    await msg.react(`<:popcat:${POPCAT_ID}>`);

    return interaction.editReply('✅ Gotowe!');
  }

  // /embed
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('wiadomosc');

    const embed = new EmbedBuilder()
      .setTitle('📢 Wiadomość')
      .setDescription(text)
      .setColor(0x9b59b6)
      .setFooter({ text: `Wysłane przez ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Embed wysłany.', ephemeral: true });
  }
});

client.login(TOKEN);
