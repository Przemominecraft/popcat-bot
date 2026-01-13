const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const warnsFile = './warns.json';
if (!fs.existsSync(warnsFile)) fs.writeFileSync(warnsFile, JSON.stringify({}));

let warns = JSON.parse(fs.readFileSync(warnsFile));

client.once('ready', async () => {
    console.log(`Zalogowano jako ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('setup')
            .setDescription('Ustawienia bota')
            .addSubcommand(sc =>
                sc.setName('aktywnosc')
                  .setDescription('Ustaw kanał testu aktywności')
                  .addChannelOption(o =>
                      o.setName('kanal')
                       .setDescription('Kanał na test aktywności')
                       .setRequired(true)
                  )
            ),

        new SlashCommandBuilder()
            .setName('aktywnosc')
            .setDescription('Wysyła test aktywności'),

        new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Nadaj warna')
            .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
            .addStringOption(o => o.setName('powod').setDescription('Powód').setRequired(true))
            .addStringOption(o => o.setName('mija').setDescription('Kiedy mija (lub Nigdy)').setRequired(true)),

        new SlashCommandBuilder()
            .setName('warn_remove')
            .setDescription('Usuń warny')
            .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true))
            .addIntegerOption(o => o.setName('ilosc').setDescription('Ilość').setRequired(true)),

        new SlashCommandBuilder()
            .setName('warn_clear')
            .setDescription('Wyczyść warny')
            .addUserOption(o => o.setName('osoba').setDescription('Użytkownik').setRequired(true)),

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
        fs.writeFileSync('aktywnosc.json', JSON.stringify({ channel: channel.id }));
        return interaction.reply(`✅ Kanał aktywności ustawiony na ${channel}`);
    }

    if (interaction.commandName === 'aktywnosc') {
        const data = JSON.parse(fs.readFileSync('aktywnosc.json'));
        const channel = await client.channels.fetch(data.channel);

        const embed = new EmbedBuilder()
            .setColor('#ff66cc')
            .setDescription(`💜 **WITAJCIE, Elicatowo!** 💜  
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
💜 **NIE ZNIKAJ — DZIAŁAJ** 💜`);

        channel.send({ embeds: [embed] });
        return interaction.reply({ content: '📢 Test aktywności wysłany!', ephemeral: true });
    }

    if (interaction.commandName === 'warn') {
        const user = interaction.options.getUser('osoba');
        const powod = interaction.options.getString('powod');
        const mija = interaction.options.getString('mija');

        if (!warns[user.id]) warns[user.id] = 0;
        warns[user.id]++;
        fs.writeFileSync(warnsFile, JSON.stringify(warns, null, 2));

        const embed = new EmbedBuilder()
            .setTitle('⚠️ Ostrzeżenie')
            .addFields(
                { name: 'Osoba', value: user.tag, inline: true },
                { name: 'Powód', value: powod, inline: true },
                { name: 'Godzina', value: new Date().toLocaleString(), inline: true },
                { name: 'Mija', value: mija, inline: true },
                { name: 'Warny', value: warns[user.id].toString(), inline: true }
            )
            .setColor('Red');

        return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === 'warn_remove') {
        const user = interaction.options.getUser('osoba');
        const ilosc = interaction.options.getInteger('ilosc');

        warns[user.id] = Math.max(0, (warns[user.id] || 0) - ilosc);
        fs.writeFileSync(warnsFile, JSON.stringify(warns, null, 2));

        return interaction.reply(`➖ Usunięto ${ilosc} warnów. Teraz: ${warns[user.id]}`);
    }

    if (interaction.commandName === 'warn_clear') {
        const user = interaction.options.getUser('osoba');
        warns[user.id] = 0;
        fs.writeFileSync(warnsFile, JSON.stringify(warns, null, 2));
        return interaction.reply(`🧹 Wyczyszczono warny użytkownika ${user.tag}`);
    }

    if (interaction.commandName === 'warny') {
        const user = interaction.options.getUser('osoba');
        const count = warns[user.id] || 0;
        return interaction.reply(`📊 ${user.tag} ma **${count}** warnów.`);
    }

    if (interaction.commandName === 'clear') {
        const ilosc = interaction.options.getInteger('ilosc');
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return interaction.reply({ content: '❌ Brak permisji', ephemeral: true });

        await interaction.channel.bulkDelete(ilosc, true);
        return interaction.reply({ content: `🗑 Usunięto ${ilosc} wiadomości`, ephemeral: true });
    }
});

client.login('TWOJ_TOKEN');
