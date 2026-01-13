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
const CLIENT_ID = '1460601983097635050'; // twoje application ID
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
    .setDescription('Wyślij embed (admin)')
    .addStringOption(o => o.setName('text').setDescription('Treść').setRequired(true))
    .addStringOption(o => o.setName('title').setDescription('Tytuł').setRequired(false))
    .addStringOption(o => o.setName('color').setDescription('Kolor HEX np. #ff00ff').setRequired(false)),

  new SlashCommandBuilder()
    .setName('embed_regulamin')
    .setDescription('Wyślij regulamin w embedzie (admin)')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('✅ Komendy zarejestrowane');
})();

client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko administrator.', ephemeral: true });
  }

  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: channel.id }));
    return interaction.reply({ content: '✅ Kanał zapisany.', ephemeral: true });
  }

  if (interaction.commandName === 'aktywnosc') {
    const config = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(config.channelId);

    await channel.send('@everyone');

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`🔥 Pokaż, że tu jesteś!\n\n💜 Test wygenerowany przez ${interaction.user.tag}`)
      .setColor(0x9b59b6)
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(`<:popcat:${POPCAT_EMOJI_ID}>`);

    return interaction.reply({ content: 'GOTOWE ✅', ephemeral: true });
  }

  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('text');
    const title = interaction.options.getString('title');
    const color = interaction.options.getString('color') || '#9b59b6';

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor(color);

    if (title) embed.setTitle(title);

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Embed wysłany.', ephemeral: true });
  }

  if (interaction.commandName === 'embed_regulamin') {
    const embed = new EmbedBuilder()
      .setTitle('👑 Regulamin Serwera ELicatowo 👑')
      .setDescription(`
🐾 **I. Zarząd i Władza**
Eliza i Popcat – decyzje ostateczne.

🐱 **II. Kodeks Kociarza**
Kochamy koty, zero hejtu, kultura.

💼 **III. Porządek**
Bez spamu, bez NSFW, odpowiednie kanały.

🚫 **IV. Sankcje**
Mute • Kick • Ban

Podpisano: **Eliza & Popcat** 🐾
`)
      .setColor(0x9b59b6)
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Regulamin wysłany.', ephemeral: true });
  }
});

client.login(TOKEN);
