const { Client, GatewayIntentBits, PermissionsBitField, SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const fs = require('fs');

const TOKEN = 'process.env.TOKEN;';
const CLIENT_ID = '1460584718021034129';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// ----- KOMENDY -----
const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustaw kanał do wiadomości aktywności')
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Kanał do wysyłania aktywności')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyślij test aktywności członków')
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('⏳ Rejestruję komendy...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Komendy zarejestrowane');
  } catch (err) {
    console.error(err);
  }
})();

// ----- BOT -----
client.once('ready', () => {
  console.log(`🤖 Zalogowano jako ${client.user.tag}`);
  client.user.setActivity('Aktywność Serwera');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // tylko administrator
  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return interaction.reply({ content: '❌ Tylko administrator może użyć tej komendy.', ephemeral: true });
  }

  if (interaction.commandName === 'setup') {
    const channel = interaction.options.getChannel('kanal');

    const config = { channelId: channel.id };
    fs.writeFileSync('config.json', JSON.stringify(config, null, 2));

    return interaction.reply(`✅ Kanał ustawiony na ${channel}`);
  }

  if (interaction.commandName === 'aktywnosc') {
    const config = JSON.parse(fs.readFileSync('config.json'));

    if (!config.channelId) {
      return interaction.reply({ content: '❌ Najpierw użyj /setup', ephemeral: true });
    }

    const channel = await client.channels.fetch(config.channelId);

    const message = `
📈 **TEST AKTYWNOŚCI CZŁONKÓW**

@everyone

💜 **WITAJCIE, Elicatowo!** 💜

👑 **Czas sprawdzić,**
kto jest **NAJAKTYWNIEJSZY** na serwerze

🔥 **POKAŻ, ŻE TU JESTEŚ** 🔥
💬 pisz na czatach
💜 reaguj emotkami
👀 bądź widoczny

**AKTYWNOŚĆ = RESPEKT**

👑 **NAJAKTYWNIEJSI ZGARNIAJĄ:**
🐱 prestiż
🐱 uznanie
🐱 respekt

💜 **NIE ZNIKAJ — DZIAŁAJ** 💜
`;

    await channel.send(message);
    await interaction.reply({ content: '✅ Wiadomość wysłana!', ephemeral: true });
  }
});

client.login(TOKEN);
