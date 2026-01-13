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
const TOKEN = process.env.TOKEN; // bez cudzysłowów
const CLIENT_ID = '1460601983097635050'; // ID twojej aplikacji

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
    .setDescription('Wyślij test aktywności członków')
].map(cmd => cmd.toJSON());

// === REJESTRACJA KOMEND ===
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('⏳ Rejestruję komendy...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Komendy zarejestrowane');
  } catch (err) {
    console.error('❌ Błąd rejestracji komend:', err);
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
    return interaction.reply({ content: '❌ Tylko administrator może użyć tej komendy.', ephemeral: true });
  }

  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: channel.id }, null, 2));
    return interaction.reply({ content: `✅ Kanał ustawiony na ${channel}`, ephemeral: true });
  }

  if (interaction.commandName === 'aktywnosc') {
    if (!fs.existsSync('config.json')) {
      return interaction.reply({ content: '❌ Najpierw użyj /setup', ephemeral: true });
    }

    const config = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(config.channelId);

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`
💜 **WITAJCIE, Elicatowo!** 💜  
👑 **Czas sprawdzić, kto jest NAJAKTYWNIEJSZY**  
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

    // najpierw ping
    await channel.send('@everyone');
    // potem embed
    await channel.send({ embeds: [embed] });

    return interaction.reply({ content: '✅ Test aktywności wysłany!', ephemeral: true });
  }
});

// === LOGIN ===
client.login(TOKEN);
