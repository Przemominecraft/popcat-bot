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
    )
    .addSubcommand(sub =>
      sub.setName('bump')
        .setDescription('Ustaw kanał do przypomnień bump')
        .addChannelOption(opt =>
          opt.setName('kanal').setDescription('Kanał').setRequired(true)
        )
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności'),

  new SlashCommandBuilder()
    .setName('bump')
    .setDescription('Zarządzanie bump reminderem')
    .addStringOption(opt =>
      opt.setName('toggle')
        .setDescription('on/off')
        .setRequired(true)
        .addChoices(
          { name: 'on', value: 'on' },
          { name: 'off', value: 'off' }
        )
    ),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Wyślij embed')
    .addStringOption(o =>
      o.setName('tekst').setDescription('Treść').setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
  console.log('✅ Komendy zarejestrowane');
})();

let bumpInterval = null;

client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return interaction.reply({ content: '❌ Tylko administracja.', ephemeral: true });

  // SETUP
  if (interaction.commandName === 'setup') {
    if (interaction.options.getSubcommand() === 'aktywnosc') {
      const kanal = interaction.options.getChannel('kanal');
      const data = fs.existsSync('config.json') ? JSON.parse(fs.readFileSync('config.json')) : {};
      data.aktywnosc = kanal.id;
      fs.writeFileSync('config.json', JSON.stringify(data, null, 2));
      return interaction.reply({ content: '✅ Kanał aktywności zapisany.', ephemeral: true });
    }

    if (interaction.options.getSubcommand() === 'bump') {
      const kanal = interaction.options.getChannel('kanal');
      const data = fs.existsSync('config.json') ? JSON.parse(fs.readFileSync('config.json')) : {};
      data.bumpChannel = kanal.id;
      fs.writeFileSync('config.json', JSON.stringify(data, null, 2));
      return interaction.reply({ content: '✅ Kanał bump zapisany.', ephemeral: true });
    }
  }

  // AKTYWNOŚĆ
  if (interaction.commandName === 'aktywnosc') {
    const { aktywnosc } = JSON.parse(fs.readFileSync('config.json'));
    const channel = await client.channels.fetch(aktywnosc);

    await channel.send('@everyone');
    const embed = new EmbedBuilder()
      .setTitle('📈 TEST AKTYWNOŚCI')
      .setDescription('💜 **WITAJCIE, Elicatowo!** 💜')
      .setColor(0x9b59b6);

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(POPCAT);
    return interaction.reply({ content: '✅ Wysłano.', ephemeral: true });
  }

  // BUMP TOGGLE
  if (interaction.commandName === 'bump') {
    const toggle = interaction.options.getString('toggle');
    const data = JSON.parse(fs.readFileSync('config.json'));

    if (toggle === 'on') {
      if (bumpInterval) clearInterval(bumpInterval);

      bumpInterval = setInterval(async () => {
        const ch = await client.channels.fetch(data.bumpChannel);
        ch.send('🚀 Czas na **/bump** na DISBOARD!');
      }, 2 * 60 * 60 * 1000);

      return interaction.reply({ content: '🔔 Bump reminder WŁĄCZONY.', ephemeral: true });
    }

    if (toggle === 'off') {
      if (bumpInterval) clearInterval(bumpInterval);
      bumpInterval = null;
      return interaction.reply({ content: '🔕 Bump reminder WYŁĄCZONY.', ephemeral: true });
    }
  }
});

client.login(TOKEN);
