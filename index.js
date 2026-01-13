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

// === ENV ===
const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1460601983097635050'; // ID aplikacji
const POPCAT_EMOJI_ID = '1460612078472794239'; // ID emotki

// === CLIENT ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// === KOMENDY ===
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustaw kanał do wiadomości aktywności')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Kanał do wysyłania aktywności')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności członków'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij wiadomość w embedzie')
    .addStringOption(option =>
      option.setName('wiadomosc')
        .setDescription('Treść embeda')
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

// === REJESTRACJA KOMEND ===
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('⏳ Rejestruję komendy...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Komendy zarejestrowane');
  } catch (err) {
    console.error(err);
  }
})();

// === READY ===
client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
  client.user.setActivity('Aktywność Serwera');
});

// === INTERAKCJE ===
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
      .setDescription(`
💜 **WITAJCIE!** 💜  
🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥  
💬 pisz  
💜 reaguj  
👀 bądź aktywny  
**AKTYWNOŚĆ = RESPEKT**
`)
      .setColor(0x9b59b6)
      .setFooter({ text: `Test wygenerowany przez ${interaction.user.tag}` })
      .setTimestamp();

    await channel.send('@everyone');
    const msg = await channel.send({ embeds: [embed] });
    await msg.react(POPCAT_EMOJI_ID);

    return interaction.editReply('✅ GOTOWE.');
  }

  // /embed
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('wiadomosc');

    const embed = new EmbedBuilder()
      .setTitle('📢 Wiadomość')
      .setDescription(text)
      .setColor(0x3498db)
      .setFooter({ text: `Wysłane przez ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Wysłano embed.', ephemeral: true });
  }
});

// === LOGIN ===
client.login(TOKEN);
