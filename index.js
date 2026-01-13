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

// ===== KOMENDY =====
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustaw kanał do testów aktywności')
    .addChannelOption(o =>
      o.setName('kanal').setDescription('Kanał').setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij wiadomość w embedzie')
    .addStringOption(o =>
      o.setName('tekst').setDescription('Treść').setRequired(true)
    )
    .addStringOption(o =>
      o.setName('tytul').setDescription('Opcjonalny tytuł')
    )
    .addStringOption(o =>
      o.setName('kolor').setDescription('Opcjonalny kolor hex, np. #ff00ff')
    ),

  new SlashCommandBuilder()
    .setName('embed_regulamin')
    .setDescription('Wyślij regulamin w embedzie')
].map(c => c.toJSON());

// ===== REJESTRACJA =====
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('Komendy zarejestrowane');
})();

// ===== READY =====
client.once('ready', () => {
  console.log(`Zalogowano jako ${client.user.tag}`);
  client.user.setActivity('ELicatowo 🐾');
});

// ===== INTERAKCJE =====
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: 'Tylko administracja.', ephemeral: true });
  }

  // /setup
  if (interaction.commandName === 'setup') {
    const ch = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ channelId: ch.id }));
    return interaction.reply({ content: 'Kanał ustawiony.', ephemeral: true });
  }

  // /aktywnosc
  if (interaction.commandName === 'aktywnosc') {
    const config = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(config.channelId);

    await channel.send('@everyone');

    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI CZŁONKÓW')
      .setDescription(`
💜 **WITAJCIE, Elicatowo!** 💜  
👑 Czas sprawdzić, kto jest **NAJAKTYWNIEJSZY**  
🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥  

💬 pisz na czatach  
💜 reaguj emotkami  
👀 bądź widoczny  

**AKTYWNOŚĆ = RESPEKT**  
`)
      .setFooter({ text: `Test wygenerowany przez ${interaction.user.tag}` })
      .setColor(0x9b59b6)
      .setTimestamp();

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(`<:popcat:${POPCAT_EMOJI_ID}>`);

    return interaction.reply({ content: 'GOTOWE', ephemeral: true });
  }

  // /embed
  if (interaction.commandName === 'embed') {
    const text = interaction.options.getString('tekst');
    const title = interaction.options.getString('tytul');
    const color = interaction.options.getString('kolor');

    const embed = new EmbedBuilder().setDescription(text);
    if (title) embed.setTitle(title);
    if (color) embed.setColor(color.replace('#', '0x'));

    await interaction.channel.send({ embeds: [embed] });
    return interaction.reply({ content: 'Wysłano embed.', ephemeral: true });
  }

  // /embed_regulamin
  if (interaction.commandName === 'embed_regulamin') {
    const regulamin = new EmbedBuilder()
      .setTitle('👑 Regulamin Serwera ELicatowo 👑')
      .setDescription(`
Witaj na ELicatowie – oficjalnym serwerze zarządzanym przez duet CEO: Elizę oraz Popcata!

🐾 **I. Zarząd i Władza**
Dwoje CEO: Eliza i Popcat  
Szacunek dla ekipy

🐱 **II. Kodeks Kociarza**
Kult kotów  
Zakaz hejtu  
Kultura wypowiedzi

💼 **III. Porządek**
Bez spamu  
Odpowiednie kanały  
Zakaz NSFW  
Zakaz podrywania osób zajętych

🚫 **IV. Sankcje**
Mute  
Kick  
Ban  

Podpisano: **Eliza & Popcat** 🐾
`)
      .setColor(0xf1c40f);

    await interaction.channel.send({ embeds: [regulamin] });
    return interaction.reply({ content: 'Regulamin wysłany.', ephemeral: true });
  }
});

client.login(TOKEN);
