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
const TOKEN = process.env.TOKEN; // token w zmiennej środowiskowej
const CLIENT_ID = '1460601983097635050'; // ID aplikacji
const POPCAT = '460235965317648514'; // ID emotki popcat
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});
/* ===== REJESTRACJA KOMEND ===== */
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
/* ===== OBSŁUGA KOMEND ===== */
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko administracja.', ephemeral: true });
  }
  // SETUP AKTYWNOŚCI
  if (interaction.commandName === 'setup') {
    const kanal = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ aktywnosc: kanal.id }, null, 2));
    return interaction.reply({ content: '✅ Kanał aktywności zapisany.', ephemeral: true });
  }
  // TEST AKTYWNOŚCI (OPCJA B: @everyone osobno na górze)
  if (interaction.commandName === 'aktywnosc') {
    await interaction.deferReply({ ephemeral: true });
    if (!fs.existsSync('config.json')) {
      return interaction.editReply('❌ Najpierw użyj /setup aktywnosc');
    }
    const { aktywnosc } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(aktywnosc);
    // @everyone jako osobna wiadomość na samej górze
    await channel.send('@everyone');
    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI')
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
      .setTimestamp();
    const msg = await channel.send({ embeds: [embed] });
    await msg.react(POPCAT);
    return interaction.editReply('✅ Test aktywności wysłany.');
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
