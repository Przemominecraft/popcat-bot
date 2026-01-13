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

const TOKEN = process.env.TOKEN; // token z hostingu (ENV)
const CLIENT_ID = '1460601983097635050'; // ID aplikacji bota
const POPCAT_EMOJI_ID = '1460612078472794239'; // ID emoji :popcat:

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== KOMENDY =====
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustaw kanał do wiadomości aktywności')
    .addChannelOption(option =>
      option.setName('kanal').setDescription('Kanał').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności')
].map(cmd => cmd.toJSON());

// ===== REJESTRACJA =====
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('✅ Komendy zarejestrowane');
})();

// ===== READY =====
client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
  client.user.setActivity('Aktywność Serwera');
});

// ===== INTERAKCJE =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko admin.', ephemeral: true });
  }

  // /setup
  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: channel.id }));
    return interaction.reply({ content: '✅ Kanał ustawiony.', ephemeral: true });
  }

  // /aktywnosc
  if (interaction.commandName === 'aktywnosc') {
    await interaction.reply({ content: 'GOTOWE.', ephemeral: true });

    const config = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(config.channelId);

    // 1️⃣ @everyone osobno
    await channel.send('@everyone');

    // 2️⃣ Embed
    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`
💜 **WITAJCIE, Elicatowo!** 💜  
👑 Czas sprawdzić, kto jest **NAJAKTYWNIEJSZY**  
🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥  
💬 pisz  
💜 reaguj  
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

    // 3️⃣ Reakcja emoji :popcat:
    await msg.react(POPCAT_EMOJI_ID);
  }
});

// ===== LOGIN =====
client.login(TOKEN);
