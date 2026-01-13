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
const POPCAT_EMOJI_ID = '1460612078472794239';

// === CLIENT ===
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// === KOMENDY ===
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustaw kanał do testu aktywności')
    .addChannelOption(option =>
      option.setName('kanal').setDescription('Kanał').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij wiadomość jako embed (admin)')
    .addStringOption(option =>
      option.setName('wiadomosc').setDescription('Treść embeda').setRequired(true)
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
    return interaction.reply({ content: `✅ Kanał ustawiony: ${channel}`, ephemeral: true });
  }

  // /aktywnosc
  if (interaction.commandName === 'aktywnosc') {
    await interaction.deferReply({ ephemeral: true });

    if (!fs.existsSync('config.json')) {
      return interaction.editReply('❌ Najpierw użyj /setup');
    }

    const { channelId } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(channelId);

    // @everyone osobno
    const pingMsg = await channel.send('@everyone');

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`
💜 **WITAJCIE, Elicatowo!** 💜  
👑 **Czas sprawdzić,**
kto jest **NAJAKTYWNIEJSZY** na serwerze  
🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥  
💬 pisz na czatach  
💜 reaguj emotkami  
👀 bądź widoczny  

**AKTYWNOŚĆ = RESPEKT**

👑 **NAJAKTYWNIEJSI ZGARNIAJĄ:**  
🐱 prestiż  
🐱 uznanie  
🐱 respekt  

💜 **NIE ZNIKAJ — DZIAŁAJ** 💜
`)
      .setColor(0x9b59b6)
      .setFooter({ text: `Test wygenerowany przez ${interaction.user.tag}` })
      .setTimestamp();

    const embedMsg = await channel.send({ embeds: [embed] });

    // reakcja :popcat:
    await embedMsg.react(`<:popcat:${POPCAT_EMOJI_ID}>`);

    return interaction.editReply('✅ GOTOWE');
  }

  // /embed
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('wiadomosc');

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor(0x5865F2)
      .setFooter({ text: `Wysłane przez ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Embed wysłany', ephemeral: true });
  }
});

// === LOGIN ===
client.login(TOKEN);
