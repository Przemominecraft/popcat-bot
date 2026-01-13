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
    .setDescription('Ustawienia bota')
    .addSubcommand(sub =>
      sub.setName('aktywnosc')
        .setDescription('Ustaw kanał testu aktywności')
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
    .addStringOption(o => o.setName('text').setDescription('Treść').setRequired(true))
    .addStringOption(o => o.setName('title').setDescription('Tytuł').setRequired(false))
    .addStringOption(o => o.setName('color').setDescription('Kolor hex').setRequired(false)),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Nadaj lub usuń warna')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Dodaj ostrzeżenie')
        .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
        .addStringOption(o => o.setName('powod').setDescription('Powód').setRequired(true))
        .addStringOption(o => o.setName('termin').setDescription('Data lub Nigdy').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Usuń warny')
        .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
        .addIntegerOption(o => o.setName('ilosc').setDescription('Ile usunąć').setRequired(true))
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('Komendy zarejestrowane');
})();

client.once('ready', () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
  client.user.setActivity('ELicatowo 🐱');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return interaction.reply({ content: 'Brak uprawnień', ephemeral: true });

  // SETUP
  if (interaction.commandName === 'setup') {
    const kanal = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ aktywnosc: kanal.id }));
    return interaction.reply({ content: 'Kanał aktywności zapisany', ephemeral: true });
  }

  // AKTYWNOSC
  if (interaction.commandName === 'aktywnosc') {
    const config = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(config.aktywnosc);

    const msg = await channel.send('@everyone');

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI')
      .setDescription('Pokaż że jesteś aktywny!')
      .setFooter({ text: `Wygenerował: ${interaction.user.tag}` })
      .setColor(0x9b59b6);

    const sent = await channel.send({ embeds: [embed] });
    await sent.react(POPCAT_EMOJI_ID);

    return interaction.reply({ content: 'GOTOWE', ephemeral: true });
  }

  // EMBED
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('text');
    const title = interaction.options.getString('title') || 'Wiadomość';
    const color = interaction.options.getString('color') || '9b59b6';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(text)
      .setColor(`#${color}`);

    return interaction.reply({ embeds: [embed] });
  }

  // WARN
  if (interaction.commandName === 'warn') {
    if (!fs.existsSync('warns.json')) fs.writeFileSync('warns.json', '{}');
    const warns = JSON.parse(fs.readFileSync('warns.json'));

    if (interaction.options.getSubcommand() === 'add') {
      const user = interaction.options.getUser('osoba');
      const powod = interaction.options.getString('powod');
      const termin = interaction.options.getString('termin');

      if (!warns[user.id]) warns[user.id] = 0;
      warns[user.id]++;

      fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Ostrzeżenie')
        .addFields(
          { name: 'Osoba', value: user.toString() },
          { name: 'Powód', value: powod },
          { name: 'Mija', value: termin },
          { name: 'Warny', value: warns[user.id].toString() }
        )
        .setColor(0xe74c3c)
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.options.getSubcommand() === 'remove') {
      const user = interaction.options.getUser('osoba');
      const ilosc = interaction.options.getInteger('ilosc');

      if (!warns[user.id]) warns[user.id] = 0;
      warns[user.id] = Math.max(0, warns[user.id] - ilosc);

      fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));

      return interaction.reply(`Usunięto warny. Aktualnie: ${warns[user.id]}`);
    }
  }
});

client.login(TOKEN);
