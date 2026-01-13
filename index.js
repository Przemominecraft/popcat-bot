const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const WARN_FILE = './warns.json';
if (!fs.existsSync(WARN_FILE)) fs.writeFileSync(WARN_FILE, JSON.stringify({}));

let warns = JSON.parse(fs.readFileSync(WARN_FILE));

client.once('ready', async () => {
  console.log(`Zalogowano jako ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Ustawienia')
      .addSubcommand(sc =>
        sc.setName('aktywnosc')
          .setDescription('Ustaw kanał na test aktywności')
          .addChannelOption(o => o.setName('kanal').setDescription('Kanał').setRequired(true))
      ),

    new SlashCommandBuilder()
      .setName('aktywnosc')
      .setDescription('Wyślij test aktywności'),

    new SlashCommandBuilder()
      .setName('warn')
      .setDescription('System warnów')
      .addSubcommand(sc =>
        sc.setName('add')
          .setDescription('Dodaj warna')
          .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
          .addStringOption(o => o.setName('powod').setDescription('Powód').setRequired(true))
      )
      .addSubcommand(sc =>
        sc.setName('remove')
          .setDescription('Usuń warny')
          .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
          .addIntegerOption(o => o.setName('ilosc').setDescription('Ilość').setRequired(true))
      )
      .addSubcommand(sc =>
        sc.setName('clear')
          .setDescription('Wyczyść wszystkie warny')
          .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
      ),

    new SlashCommandBuilder()
      .setName('warny')
      .setDescription('Sprawdź ilość warnów')
      .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true)),

    new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Usuń wiadomości')
      .addIntegerOption(o => o.setName('ilosc').setDescription('Ilość').setRequired(true))
  ];

  await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');
    fs.writeFileSync('./aktywnosc.json', JSON.stringify({ channel: channel.id }));
    return interaction.reply({ content: `Kanał aktywności ustawiony na ${channel}`, ephemeral: true });
  }

  if (interaction.commandName === 'aktywnosc') {
    const embed = new EmbedBuilder()
      .setColor('#ff66cc')
      .setTitle('💜 WITAJCIE, Elicatowo! 💜')
      .setDescription(
`👑 Czas sprawdzić, kto jest **NAJAKTYWNIEJSZY**
🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥

💬 pisz  
💜 reaguj  
👀 bądź widoczny  

**AKTYWNOŚĆ = RESPEKT**

👑 **NAJAKTYWNIEJSI ZGARNIAJĄ:**  
🐱 prestiż  
🐱 uznanie  
🐱 respekt  

💜 **NIE ZNIKAJ — DZIAŁAJ** 💜`
      );

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'warn') {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('osoba');

    if (!warns[user.id]) warns[user.id] = 0;

    if (sub === 'add') {
      warns[user.id]++;
      fs.writeFileSync(WARN_FILE, JSON.stringify(warns, null, 2));
      return interaction.reply(`${user} dostał warna. Ma teraz **${warns[user.id]}** warnów.`);
    }

    if (sub === 'remove') {
      const amount = interaction.options.getInteger('ilosc');
      warns[user.id] = Math.max(0, warns[user.id] - amount);
      fs.writeFileSync(WARN_FILE, JSON.stringify(warns, null, 2));
      return interaction.reply(`${user} ma teraz **${warns[user.id]}** warnów.`);
    }

    if (sub === 'clear') {
      warns[user.id] = 0;
      fs.writeFileSync(WARN_FILE, JSON.stringify(warns, null, 2));
      return interaction.reply(`${user} ma wyczyszczone warny.`);
    }
  }

  if (interaction.commandName === 'warny') {
    const user = interaction.options.getUser('osoba');
    const count = warns[user.id] || 0;
    return interaction.reply(`${user} ma **${count}** warnów.`);
  }

  if (interaction.commandName === 'clear') {
    const amount = interaction.options.getInteger('ilosc');
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
      return interaction.reply({ content: 'Brak uprawnień!', ephemeral: true });

    await interaction.channel.bulkDelete(amount, true);
    return interaction.reply({ content: `Usunięto ${amount} wiadomości.`, ephemeral: true });
  }
});

client.login('TWÓJ_TOKEN_BOTA');
