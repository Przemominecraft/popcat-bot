const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Ustawienia')
    .addSubcommand(sub =>
      sub.setName('aktywnosc')
        .setDescription('Ustaw kanał testu aktywności')
        .addChannelOption(opt =>
          opt.setName('kanal').setDescription('Kanał').setRequired(true))),

  new SlashCommandBuilder()
    .setName('aktywnosc')
    .setDescription('Wyświetl test aktywności'),

  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('System warnów')
    .addSubcommand(sub =>
      sub.setName('add')
        .addUserOption(o => o.setName('osoba').setRequired(true))
        .addStringOption(o => o.setName('powod').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .addUserOption(o => o.setName('osoba').setRequired(true))
        .addIntegerOption(o => o.setName('ilosc').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('clear')
        .addUserOption(o => o.setName('osoba').setRequired(true))),

  new SlashCommandBuilder()
    .setName('warny')
    .addUserOption(o => o.setName('osoba').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .addIntegerOption(o => o.setName('ilosc').setRequired(true))
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
  console.log('Komendy zarejestrowane!');
})();
