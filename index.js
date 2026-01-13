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
const TOKEN = process.env.TOKEN; // token z hostingu
const CLIENT_ID = '1460601983097635050';

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

  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: channel.id }));
    return interaction.reply({ content: `✅ Kanał ustawiony na ${channel}`, ephemeral: true });
  }

  if (interaction.commandName === 'aktywnosc') {
    if (!fs.existsSync('config.json')) {
      return interaction.reply({ content: '❌ Najpierw użyj /setup', ephemeral: true });
    }

    const { channelId } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(channelId);

    // 1️⃣ Ping
    await channel.send('@everyone');

    // 2️⃣ Embed
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

    const msg = await channel.send({ embeds: [embed] });

    // 3️⃣ Reakcja serwerowa
    await msg.react('popcat'); // nazwa dokładnie jak emoji na serwerze

    return interaction.reply({ content: '✅ Test wysłany!', ephemeral: true });
  }
});

// === LOGIN ===
client.login(TOKEN);
