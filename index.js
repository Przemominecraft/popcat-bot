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

/* ================= KOMENDY ================= */
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustawienia bota')
    .addSubcommand(sub =>
      sub
        .setName('aktywnosc')
        .setDescription('Ustaw kanał aktywności')
        .addChannelOption(opt =>
          opt.setName('kanal').setDescription('Kanał').setRequired(true)
        )
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
      o.setName('title').setDescription('Tytuł').setRequired(false)
    )
    .addStringOption(o =>
      o.setName('color').setDescription('Kolor HEX np. #9b59b6').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Usuń wiadomości')
    .addIntegerOption(o =>
      o.setName('ilosc').setDescription('Ile').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('System warnów')
    .addSubcommand(s =>
      s.setName('add')
        .setDescription('Dodaj warna')
        .addUserOption(o => o.setName('osoba').setRequired(true))
        .addStringOption(o => o.setName('powod').setRequired(true))
        .addStringOption(o => o.setName('mija').setRequired(false))
    )
    .addSubcommand(s =>
      s.setName('remove')
        .setDescription('Usuń warny')
        .addUserOption(o => o.setName('osoba').setRequired(true))
        .addIntegerOption(o => o.setName('ilosc').setRequired(true))
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

/* ================= READY ================= */
client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'ELicatowo 🐾' }],
    status: 'online'
  });
});

/* ================= INTERAKCJE ================= */
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko administracja', ephemeral: true });
  }

  /* ===== SETUP ===== */
  if (interaction.commandName === 'setup') {
    const kanal = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ aktywnosc: kanal.id }));
    return interaction.reply({ content: '✅ Kanał zapisany', ephemeral: true });
  }

  /* ===== AKTYWNOŚĆ ===== */
  if (interaction.commandName === 'aktywnosc') {
    const config = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(config.aktywnosc);

    await channel.send('@everyone');

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(
`💜 **WITAJCIE, Elicatowo!** 💜

🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥
💬 pisz
💜 reaguj
👀 bądź aktywny

**AKTYWNOŚĆ = RESPEKT**`
      )
      .setColor(0x9b59b6)
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(POPCAT_EMOJI_ID);

    return interaction.reply({ content: 'GOTOWE ✅', ephemeral: true });
  }

  /* ===== EMBED ===== */
  if (interaction.commandName === 'embed') {
    const embed = new EmbedBuilder()
      .setDescription(interaction.options.getString('text'))
      .setColor(interaction.options.getString('color') || '#9b59b6');

    if (interaction.options.getString('title')) {
      embed.setTitle(interaction.options.getString('title'));
    }

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Wysłano', ephemeral: true });
  }

  /* ===== CLEAR ===== */
  if (interaction.commandName === 'clear') {
    const ilosc = interaction.options.getInteger('ilosc');
    await interaction.channel.bulkDelete(ilosc, true);
    return interaction.reply({ content: '🧹 Wyczyszczono', ephemeral: true });
  }

  /* ===== WARNS ===== */
  let warns = fs.existsSync('warns.json') ? JSON.parse(fs.readFileSync('warns.json')) : {};

  if (interaction.commandName === 'warn') {
    const user = interaction.options.getUser('osoba');
    warns[user.id] ??= 0;

    if (interaction.options.getSubcommand() === 'add') {
      warns[user.id]++;
    } else {
      warns[user.id] = Math.max(0, warns[user.id] - interaction.options.getInteger('ilosc'));
    }

    fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Ostrzeżenie')
      .addFields(
        { name: 'Osoba', value: user.tag },
        { name: 'Warny', value: String(warns[user.id]) }
      )
      .setColor('Orange');

    return interaction.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
