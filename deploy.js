const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { token, clientId, guildId } = require('./config.json');

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
        .setDescription('Dodaj warna')
        .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
        .addStringOption(o => o.setName('powod').setDescription('Powód').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Usuń warny')
        .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
        .addIntegerOption(o => o.setName('ilosc').setDescription('Ilość').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('clear')
        .setDescription('Wyczyść warny')
        .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))),

  new SlashCommandBuilder()
    .setName('warny')
    .setDescription('Sprawdź ilość warnów')
    .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true)),

  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Usuń wiadomości')
    .addIntegerOption(o => o.setName('ilosc').setDescription('Ilość').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Rejestruję komendy...');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('Gotowe!');
  } catch (error) {
    console.error(error);
  }
})();
