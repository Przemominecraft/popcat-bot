const { Client, GatewayIntentBits, PermissionsBitField, SlashCommandBuilder, Routes, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1460601983097635050';
const POPCAT = '460235965317648514';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

if (!fs.existsSync('warns.json')) fs.writeFileSync('warns.json', JSON.stringify({}));
if (!fs.existsSync('config.json')) fs.writeFileSync('config.json', JSON.stringify({}));

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustawienia bota')
    .addSubcommand(sub =>
      sub.setName('aktywnosc')
        .setDescription('Ustaw kanał do testu aktywności')
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
    .addStringOption(o => o.setName('tekst').setDescription('Treść').setRequired(true))
    .addStringOption(o => o.setName('tytul').setDescription('Tytuł'))
    .addStringOption(o => o.setName('kolor').setDescription('Kolor HEX')),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('System warnów')
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Dodaj warna')
        .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
        .addStringOption(o => o.setName('powod').setDescription('Powód').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Usuń warny')
        .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
        .addIntegerOption(o => o.setName('ilosc').setDescription('Ilość').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Wyczyść wszystkie warny')
        .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
    ),

  new SlashCommandBuilder()
    .setName('warny')
    .setDescription('Sprawdź ilość warnów')
    .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Usuń wiadomości z kanału')
    .addIntegerOption(o => o.setName('ilosc').setDescription('Ilość').setRequired(true))
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
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return interaction.reply({ content: '❌ Tylko administracja.', ephemeral: true });

  const warns = JSON.parse(fs.readFileSync('warns.json'));

  if (interaction.commandName === 'setup') {
    const kanal = interaction.options.getChannel('kanal');
    fs.writeFileSync('config.json', JSON.stringify({ aktywnosc: kanal.id }, null, 2));
    return interaction.reply({ content: '✅ Kanał aktywności zapisany.', ephemeral: true });
  }

  if (interaction.commandName === 'aktywnosc') {
    const { aktywnosc } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(aktywnosc);

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
    return interaction.reply({ content: '✅ Test aktywności wysłany.', ephemeral: true });
  }

  if (interaction.commandName === 'warn' && interaction.options.getSubcommand() === 'add') {
    const user = interaction.options.getUser('osoba');
    const powod = interaction.options.getString('powod');
    if (!warns[user.id]) warns[user.id] = [];
    warns[user.id].push(powod);
    fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));
    return interaction.reply(`⚠️ ${user.tag} dostał warna: ${powod}`);
  }

  if (interaction.commandName === 'warn' && interaction.options.getSubcommand() === 'remove') {
    const user = interaction.options.getUser('osoba');
    const ilosc = interaction.options.getInteger('ilosc');
    if (!warns[user.id]) return interaction.reply('Brak warnów.');
    warns[user.id].splice(0, ilosc);
    fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));
    return interaction.reply(`🗑️ Usunięto ${ilosc} warnów.`);
  }

  if (interaction.commandName === 'warn' && interaction.options.getSubcommand() === 'clear') {
    const user = interaction.options.getUser('osoba');
    delete warns[user.id];
    fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));
    return interaction.reply(`❌ Wyczyściłem warny ${user.tag}`);
  }

  if (interaction.commandName === 'warny') {
    const user = interaction.options.getUser('osoba');
    const count = warns[user.id] ? warns[user.id].length : 0;
    return interaction.reply(`📊 ${user.tag} ma ${count} warnów.`);
  }

  if (interaction.commandName === 'clear') {
    const ilosc = interaction.options.getInteger('ilosc');
    await interaction.channel.bulkDelete(ilosc);
    return interaction.reply({ content: `🧹 Usunięto ${ilosc} wiadomości.`, ephemeral: true });
  }
});

client.login(TOKEN);
