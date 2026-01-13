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
const POPCAT_EMOJI_ID = '460235965317648514';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ===== KOMENDY =====
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
    .setDescription('Wyślij wiadomość w embedzie (admin)')
    .addStringOption(o =>
      o.setName('text').setDescription('Treść').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('title').setDescription('Tytuł (opcjonalny)').setRequired(false)
    )
    .addStringOption(o =>
      o.setName('color').setDescription('Kolor hex np. #ff00ff (opcjonalny)').setRequired(false)
    )
].map(cmd => cmd.toJSON());

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

  // /setup
  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: channel.id }, null, 2));
    return interaction.reply({ content: `✅ Kanał ustawiony: ${channel}`, ephemeral: true });
  }

  // /aktywnosc
  if (interaction.commandName === 'aktywnosc') {
    if (!fs.existsSync('config.json')) {
      return interaction.reply({ content: '❌ Najpierw użyj /setup', ephemeral: true });
    }

    const { channelId } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(channelId);

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`
💜 **WITAJCIE, Elicatowo!** 💜  
👑 **Czas sprawdzić,**
kto jest **NAJAKTYWNIEJSZY** na serwerze  
🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥  
💬 pisz  
💜 reaguj  
👀 bądź widoczny  

**AKTYWNOŚĆ = RESPEKT**

👑 **NAJAKTYWNIEJSI ZGARNIAJĄ:**  
🐱 prestiż  
🐱 uznanie  
🐱 respekt  
`)
      .setColor(0x9b59b6)
      .setFooter({ text: `Test wygenerowany przez ${interaction.user.tag}` })
      .setTimestamp();

    const msg = await channel.send({
      content: '@everyone',
      embeds: [embed]
    });

    await msg.react(POPCAT_EMOJI_ID);

    return interaction.reply({ content: '✅ GOTOWE', ephemeral: true });
  }

  // /embed
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('text');
    const title = interaction.options.getString('title');
    const color = interaction.options.getString('color');

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setTimestamp();

    if (title) embed.setTitle(title);
    if (color) embed.setColor(color);

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Wysłano embed.', ephemeral: true });
  }
});

client.login(TOKEN);
