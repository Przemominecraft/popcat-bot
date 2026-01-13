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
const POPCAT = '460235965317648514';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* ===== KOMENDY ===== */
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
    .setDescription('Wyślij embed')
    .addStringOption(o =>
      o.setName('tekst').setDescription('Treść').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('tytul').setDescription('Tytuł').setRequired(false)
    )
    .addStringOption(o =>
      o.setName('kolor').setDescription('Kolor HEX np. #9b59b6').setRequired(false)
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('✅ Komendy zarejestrowane');
})();

/* ===== READY ===== */
client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'ELicatowo 🐾' }],
    status: 'online'
  });
});

/* ===== INTERAKCJE ===== */
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko administracja.', ephemeral: true });
  }

  // SETUP
  if (interaction.commandName === 'setup') {
    const kanal = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ aktywnosc: kanal.id }, null, 2));
    return interaction.reply({ content: '✅ Kanał aktywności zapisany.', ephemeral: true });
  }

  // AKTYWNOŚĆ
  if (interaction.commandName === 'aktywnosc') {
    await interaction.deferReply({ ephemeral: true });

    const { aktywnosc } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(aktywnosc);

    await channel.send('@everyone');

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW ELicatowa')
      .setDescription(`
💜 **WITAJCIE, Elicatowo!** 💜  
To oficjalny test aktywności serwera zarządzanego przez CEO: **Elizę & Popcata** 🐾  

🔥 **POKAŻ, ŻE TU JESTEŚ!** 🔥  
➡️ Napisz coś na czacie  
➡️ Zareaguj na tę wiadomość  
➡️ Bądź widoczny i aktywny  

📊 Aktywność = rangi, respekt i kocia duma  
😼 Kto się nie odezwie, ten śpi jak leniwy kot  

**MRRR… CZEKAMY NA WAS!** 🐱
      `)
      .setColor(0x9b59b6)
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(POPCAT);

    return interaction.editReply('GOTOWE ✅ Test aktywności wysłany.');
  }

  // EMBED
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('tekst');
    const title = interaction.options.getString('tytul');
    const color = interaction.options.getString('kolor') || '#9b59b6';

    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor(color);

    if (title) embed.setTitle(title);

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: '✅ Embed wysłany.', ephemeral: true });
  }
});

client.login(TOKEN);
