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
const POPCAT_EMOJI_ID = '460235965317648514'; // twoje ID emotki

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== KOMENDY =====
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Konfiguracja bota')
    .addSubcommand(sub =>
      sub.setName('aktywnosc')
        .setDescription('Ustaw kanał aktywności')
        .addChannelOption(opt =>
          opt.setName('kanal')
            .setDescription('Kanał na test aktywności')
            .setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij wiadomość w embedzie')
    .addStringOption(opt =>
      opt.setName('tekst')
        .setDescription('Treść embeda')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('tytul')
        .setDescription('Tytuł embeda (opcjonalny)')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('kolor')
        .setDescription('Kolor hex np. #9b59b6 (opcjonalny)')
        .setRequired(false)
    )
].map(c => c.toJSON());

// ===== REJESTRACJA =====
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

// ===== READY =====
client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
  client.user.setActivity('Aktywność Serwera');
});

// ===== INTERAKCJE =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko administrator.', ephemeral: true });
  }

  // /setup aktywnosc
  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: channel.id }, null, 2));
    return interaction.reply({ content: `✅ Kanał aktywności ustawiony: ${channel}`, ephemeral: true });
  }

  // /aktywnosc
  if (interaction.commandName === 'aktywnosc') {
    if (!fs.existsSync('config.json')) {
      return interaction.reply({ content: '❌ Najpierw /setup aktywnosc', ephemeral: true });
    }

    const { channelId } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(channelId);

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`
💜 **WITAJCIE, Elicatowo!** 💜  
👑 Czas sprawdzić kto jest NAJAKTYWNIEJSZY  
🔥 POKAŻ, ŻE TU JESTEŚ 🔥  
💬 pisz  
💜 reaguj  
👀 bądź widoczny  

**AKTYWNOŚĆ = RESPEKT**
`)
      .setColor(0x9b59b6)
      .setTimestamp();

    await channel.send('@everyone');
    const msg = await channel.send({ embeds: [embed] });
    await msg.react(POPCAT_EMOJI_ID);

    return interaction.reply({ content: '✅ GOTOWE', ephemeral: true });
  }

  // /embed
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('tekst');
    const title = interaction.options.getString('tytul');
    const color = interaction.options.getString('kolor') || '#9b59b6';

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor(color);

    if (title) embed.setTitle(title);

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Embed wysłany', ephemeral: true });
  }
});

client.login(TOKEN);
