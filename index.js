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
const CLIENT_ID = '1460601983097635050'; // ID aplikacji
const POPCAT = '460235965317648514'; // ID emotki popcat

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ================= KOMENDY ================= */
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustawienia bota')
    .addSubcommand(sub =>
      sub.setName('aktywnosc')
        .setDescription('Ustaw kanał do testu aktywności')
        .addChannelOption(opt =>
          opt.setName('kanal')
            .setDescription('Kanał')
            .setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij embed (admin)')
    .addStringOption(o =>
      o.setName('tekst').setDescription('Treść').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('tytul').setDescription('Tytuł').setRequired(false)
    )
    .addStringOption(o =>
      o.setName('kolor').setDescription('Kolor HEX np. #9b59b6').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Usuń wiadomości')
    .addIntegerOption(o =>
      o.setName('ilosc').setDescription('Ile usunąć').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('System ostrzeżeń')
    .addSubcommand(s =>
      s.setName('add')
        .setDescription('Dodaj warna')
        .addUserOption(o =>
          o.setName('osoba').setDescription('Osoba').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('powod').setDescription('Powód').setRequired(true)
        )
        .addStringOption(o =>
          o.setName('mija').setDescription('Kiedy mija (lub Nigdy)').setRequired(false)
        )
    )
    .addSubcommand(s =>
      s.setName('remove')
        .setDescription('Usuń warny')
        .addUserOption(o =>
          o.setName('osoba').setDescription('Osoba').setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('ilosc').setDescription('Ile zabrać').setRequired(true)
        )
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('✅ Komendy zarejestrowane');
})();

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
    return interaction.reply({ content: '❌ Tylko administracja.', ephemeral: true });
  }

  /* ===== SETUP ===== */
  if (interaction.commandName === 'setup') {
    const kanal = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ aktywnosc: kanal.id }, null, 2));
    return interaction.reply({ content: '✅ Kanał aktywności zapisany.', ephemeral: true });
  }

  /* ===== AKTYWNOŚĆ ===== */
  if (interaction.commandName === 'aktywnosc') {
    if (!fs.existsSync('config.json')) {
      return interaction.reply({ content: '❌ Najpierw użyj /setup aktywnosc', ephemeral: true });
    }

    const { aktywnosc } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(aktywnosc);

    await channel.send('@everyone');

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`
💜 **WITAJCIE, Elicatowo!** 💜

🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥
💬 pisz
💜 reaguj
👀 bądź aktywny

**AKTYWNOŚĆ = RESPEKT**
      `)
      .setColor(0x9b59b6)
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(POPCAT);

    return interaction.reply({ content: 'GOTOWE ✅', ephemeral: true });
  }

  /* ===== EMBED ===== */
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('tekst');
    const title = interaction.options.getString('tytul');
    const color = interaction.options.getString('kolor') || '#9b59b6';

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor(color);

    if (title) embed.setTitle(title);

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Wysłano embed.', ephemeral: true });
  }

  /* ===== CLEAR ===== */
  if (interaction.commandName === 'clear') {
    const ilosc = interaction.options.getInteger('ilosc');
    await interaction.channel.bulkDelete(ilosc, true);
    return interaction.reply({ content: '🧹 Wyczyszczono.', ephemeral: true });
  }

  /* ===== WARNS ===== */
  let warns = fs.existsSync('warns.json')
    ? JSON.parse(fs.readFileSync('warns.json'))
    : {};

  if (interaction.commandName === 'warn') {
    const user = interaction.options.getUser('osoba');
    warns[user.id] ??= 0;

    if (interaction.options.getSubcommand() === 'add') {
      const powod = interaction.options.getString('powod');
      const mija = interaction.options.getString('mija') || 'Nigdy';
      warns[user.id]++;

      fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Ostrzeżenie')
        .addFields(
          { name: '👤 Osoba', value: `<@${user.id}>`, inline: false },
          { name: '📊 Warny', value: String(warns[user.id]), inline: false },
          { name: '📄 Powód', value: powod, inline: false },
          { name: '⏰ Godzina', value: new Date().toLocaleString(), inline: false },
          { name: '⌛ Mija', value: mija, inline: false }
        )
        .setColor('Orange')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() === 'remove') {
      const ilosc = interaction.options.getInteger('ilosc');
      warns[user.id] = Math.max(0, warns[user.id] - ilosc);

      fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));

      return interaction.reply({
        content: `➖ Usunięto ${ilosc} warnów. Teraz: ${warns[user.id]}`,
        ephemeral: true
      });
    }
  }
});

client.login(TOKEN);
