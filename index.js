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
const POPCAT_EMOJI_ID = '1460612078472794239';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustaw kanał do wiadomości aktywności')
    .addChannelOption(o =>
      o.setName('kanal').setDescription('Kanał').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij embed')
    .addStringOption(o =>
      o.setName('text').setDescription('Treść').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('title').setDescription('Tytuł (opcjonalne)')
    )
    .addStringOption(o =>
      o.setName('color').setDescription('Kolor HEX np. #9b59b6 (opcjonalne)')
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('Komendy zarejestrowane');
})();

client.once('ready', () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko administracja.', ephemeral: true });
  }

  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: channel.id }));
    return interaction.reply({ content: '✅ Ustawiono kanał.', ephemeral: true });
  }

  if (interaction.commandName === 'aktywnosc') {
    await interaction.deferReply({ ephemeral: true });

    const { channelId } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(channelId);

    await channel.send('@everyone');

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI')
      .setDescription(`🔥 Pokaż, że jesteś aktywny!\n💬 Pisz • 💜 Reaguj • 👀 Bądź widoczny`)
      .setFooter({ text: `Wygenerował: ${interaction.user.tag}` })
      .setColor(0x9b59b6)
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(POPCAT_EMOJI_ID);

    return interaction.editReply('✅ GOTOWE');
  }

  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('text');
    const title = interaction.options.getString('title') || null;
    const color = interaction.options.getString('color') || '#9b59b6';

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor(color);

    if (title) embed.setTitle(title);

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Wysłano embed.', ephemeral: true });
  }
});

client.login(TOKEN);
