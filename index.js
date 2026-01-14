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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] 
});

if (!fs.existsSync('warns.json')) fs.writeFileSync('warns.json', '{}');
if (!fs.existsSync('config.json')) fs.writeFileSync('config.json', '{}');

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustawienia bota')
    .addSubcommand(s =>
      s.setName('aktywnosc')
        .setDescription('Ustaw kanał testu aktywności')
        .addChannelOption(o => o.setName('kanal').setDescription('Kanał').setRequired(true))
    )
    .addSubcommand(s =>
      s.setName('bump')
        .setDescription('Ustaw kanał bump reminder')
        .addChannelOption(o => o.setName('kanal').setDescription('Kanał').setRequired(true))
    ),

  new SlashCommandBuilder().setName('aktywnosc').setDescription('Wyślij test aktywności'),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij embed')
    .addStringOption(o => o.setName('tekst').setDescription('Treść').setRequired(true))
    .addStringOption(o => o.setName('tytul').setDescription('Tytuł'))
    .addStringOption(o => o.setName('kolor').setDescription('Kolor HEX')),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Daj warna')
    .addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true))
    .addStringOption(o => o.setName('powod').setDescription('Powód').setRequired(true)),

  new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Zdejmij warna')
    .addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)),

  new SlashCommandBuilder()
    .setName('warny')
    .setDescription('Pokaż warny')
    .addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Usuń wiadomości')
    .addIntegerOption(o => o.setName('ilosc').setDescription('Ilość').setRequired(true)),

  new SlashCommandBuilder()
    .setName('bump')
    .setDescription('Ustawienia bump')
    .addStringOption(o =>
      o.setName('toggle')
        .setDescription('on/off')
        .setRequired(true)
        .addChoices(
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' }
        )
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('✅ Komendy zarejestrowane');
})();

client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
});

function getConfig() {
  return JSON.parse(fs.readFileSync('config.json'));
}
function saveConfig(data) {
  fs.writeFileSync('config.json', JSON.stringify(data, null, 2));
}

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return interaction.reply({ content: '❌ Tylko administracja.', ephemeral: true });

  const cfg = getConfig();

  if (interaction.commandName === 'setup') {
    if (interaction.options.getSubcommand() === 'aktywnosc') {
      cfg.aktywnosc = interaction.options.getChannel('kanal').id;
      saveConfig(cfg);
      return interaction.reply({ content: '✅ Kanał aktywności zapisany.', ephemeral: true });
    }
    if (interaction.options.getSubcommand() === 'bump') {
      cfg.bumpChannel = interaction.options.getChannel('kanal').id;
      saveConfig(cfg);
      return interaction.reply({ content: '✅ Kanał bump zapisany.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'aktywnosc') {
    const channel = await client.channels.fetch(cfg.aktywnosc);
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

  if (interaction.commandName === 'warn') {
    const user = interaction.options.getUser('user');
    const powod = interaction.options.getString('powod');
    const warns = JSON.parse(fs.readFileSync('warns.json'));
    if (!warns[user.id]) warns[user.id] = [];
    warns[user.id].push(powod);
    fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));
    return interaction.reply(`⚠️ ${user.tag} dostał warna: ${powod}`);
  }

  if (interaction.commandName === 'unwarn') {
    const user = interaction.options.getUser('user');
    const warns = JSON.parse(fs.readFileSync('warns.json'));
    if (warns[user.id]) warns[user.id].pop();
    fs.writeFileSync('warns.json', JSON.stringify(warns, null, 2));
    return interaction.reply(`🗑️ Zdjęto jednego warna z ${user.tag}`);
  }

  if (interaction.commandName === 'warny') {
    const user = interaction.options.getUser('user');
    const warns = JSON.parse(fs.readFileSync('warns.json'));
    const lista = warns[user.id]?.join('\n') || 'Brak warnów';
    return interaction.reply(`📄 Warny ${user.tag}:\n${lista}`);
  }

  if (interaction.commandName === 'clear') {
    const ilosc = interaction.options.getInteger('ilosc');
    await interaction.channel.bulkDelete(ilosc, true);
    const msg = await interaction.reply({ content: `🧹 Usunięto ${ilosc} wiadomości.`, fetchReply: true });
    setTimeout(() => msg.delete(), 3000);
  }

  if (interaction.commandName === 'bump') {
    const toggle = interaction.options.getString('toggle');
    cfg.bumpOn = toggle === 'on';
    saveConfig(cfg);
    return interaction.reply(`🔔 Bump reminder: ${toggle.toUpperCase()}`);
  }
});

client.login(TOKEN);
