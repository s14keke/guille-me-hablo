import {
    Client,
    GatewayIntentBits,
    Events,
    SlashCommandBuilder,
    REST,
    Routes,
    Interaction,
    EmbedBuilder
  } from 'discord.js';
  import dotenv from 'dotenv';
  import { saveLastTime, loadLastTime, getAllTimes} from './src/storage';
  
  dotenv.config();
  
  const TOKEN = process.env.DISCORD_TOKEN!;
  const CLIENT_ID = process.env.CLIENT_ID!;
  const GUILD_ID = process.env.GUILD_ID!;
  
// initialize the bot client with necessary intents  
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  });
  
  // define the commands available for the bot
  const commands = [
    new SlashCommandBuilder()
      .setName('guille_me_hablo')
      .setDescription('Resetea tu contador porque Guille te habló'),
    new SlashCommandBuilder()
      .setName('set_guille_time')
      .setDescription('Setea manualmente la última vez que Guille te habló')
      .addStringOption(option =>
        option.setName('fecha')
          .setDescription('Fecha en formato YYYY-MM-DD HH:mm')
          .setRequired(true)),
    new SlashCommandBuilder()
      .setName('guille_status')
      .setDescription('Muestra cuánto tiempo pasó desde que Guille habló con vos o con otro')
      .addUserOption(option =>
        option.setName('usuario')
          .setDescription('Usuario a consultar (opcional)')),
    new SlashCommandBuilder()
      .setName('guille_ranking')
      .setDescription('Muestra el ranking de usuarios según hace cuánto Guille no les habla'),
  ].map(command => command.toJSON());
  

  // initialize the REST client to interact with Discord's API
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  
  // register the bot commands with Discord
  (async () => {
    try {
      console.log('Registrando comandos');
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log('Comandos registrados.');
    } catch (err) {
      console.error(err);
    }
  })();
  
  // helper function to format the elapsed time in a readable format
  function getElapsedTimeString(since: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - since.getTime()) / 1000);
  
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
  
    return `${days} días, ${hours} horas, ${minutes} minutos, ${seconds} segundos`;
  }
  
  // event listener when the bot is ready
  client.once(Events.ClientReady, () => {
    console.log(`Bot iniciado como ${client.user?.tag}`);
  });
  
  // event listener for interactions (slash commands)
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
  
    const userId = interaction.user.id;
  
    if (interaction.commandName === 'guille_me_hablo') {
      const now = new Date();
      saveLastTime(userId, now);
    const embed = new EmbedBuilder()
        .setDescription('⏱️ Contador reiniciado. Han pasado 0 días desde que Guille te habló.')
        .setImage('https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExODRscXg0cm54MDdoOTg1b3I3ZHNocmg2eWQwZm8zZWwzNzMyaWx5eiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BiiX0BDQlI6URrqIu3/giphy.gif');

    await interaction.reply({ embeds: [embed] });
    }
  
    if (interaction.commandName === 'set_guille_time') {
      const fechaStr = interaction.options.getString('fecha', true);
      const parsed = new Date(fechaStr);
  
      if (isNaN(parsed.getTime())) {
        await interaction.reply('❌ Fecha inválida. Usá el formato `YYYY-MM-DD HH:mm`.');
        return;
      }
  
      saveLastTime(userId, parsed);
      await interaction.reply(`✅ Fecha actualizada. Nuevo tiempo: ${getElapsedTimeString(parsed)}`);
    }
  
    if (interaction.commandName === 'guille_status') {
      const targetUser = interaction.options.getUser('usuario') ?? interaction.user;
      const last = loadLastTime(targetUser.id);
  
      const texto = targetUser.id === interaction.user.id
        ? `🕰️ Desde que Guille te habló han pasado: **${getElapsedTimeString(last)}**`
        : `🕰️ Desde que Guille le habló a **${targetUser.username}** han pasado: **${getElapsedTimeString(last)}**`;
  
      await interaction.reply(texto);
    }

    if (interaction.commandName === 'guille_ranking') {
      const allTimes = getAllTimes();
  
      if (allTimes.length === 0) {
        await interaction.reply('❌ No hay usuarios registrados todavía.');
        return;
      }
  
      const now = new Date();
  
      const ranking = allTimes
        .map(entry => ({
          userId: entry.userId,
          diff: Math.floor((now.getTime() - entry.date.getTime()) / 1000),
        }))
        .sort((a, b) => b.diff - a.diff) 
        .slice(0, 10); 
  
      const description = ranking.map((entry, index) => {
        const days = Math.floor(entry.diff / 86400);
        const hours = Math.floor((entry.diff % 86400) / 3600);
        const minutes = Math.floor((entry.diff % 3600) / 60);
        const seconds = entry.diff % 60;
  
        return `**${index + 1}.** <@${entry.userId}> → ${days} días, ${hours} horas, ${minutes} minutos, ${seconds} segundos`;
      }).join('\n');
  
      const embed = new EmbedBuilder()
        .setTitle('🏆 TOP 10 ignorados por Guille of all time.')
        .setDescription(description)
        .setColor(0x00AE86);
  
      await interaction.reply({ embeds: [embed] });
    }
  });
  
  // event listener for mentions in messages
  client.on(Events.MessageCreate, async message => {
    if (message.mentions.has(client.user!) && !message.author.bot) {
      const userId = message.author.id;
      const last = loadLastTime(userId);
      await message.reply(
        `👋 ¡Hola <@${userId}>! Para reiniciar tu contador, usá el comando **/guille_me_hablo**.\n` +
        `🕰️ Tiempo desde que Guille te habló: **${getElapsedTimeString(last)}**\n` +
        `📅 También podés setear una fecha con **/set_guille_time** (formato: \`YYYY-MM-DD HH:mm\`).`
      );
    }
  });
  
  // log the bot in
  client.login(TOKEN);