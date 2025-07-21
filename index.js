require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  getVoiceConnection 
} = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const player = createAudioPlayer();

client.on('ready', () => {
  console.log(`🤖 Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  if (command === '!play') {
    const query = args.join(' ');
    if (!query) return message.reply('🎧 Escribe el nombre o link de la canción.');
    const canalVoz = message.member.voice.channel;
    if (!canalVoz) return message.reply('🔊 Debes estar en un canal de voz.');

    // Verifica permisos
    const permisos = canalVoz.permissionsFor(message.guild.members.me);
    if (!permisos.has('Connect') || !permisos.has('Speak')) {
      return message.reply('❌ No tengo permisos para unirme o hablar en el canal de voz.');
    }

    try {
      const resultado = await play.search(query, { limit: 1 });
      if (!resultado.length) return message.reply('❌ No encontré resultados.');

      const stream = await play.stream(resultado[0].url);
      const recurso = createAudioResource(stream.stream, { inputType: stream.type });

      const conexion = joinVoiceChannel({
        channelId: canalVoz.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });

      player.play(recurso);
      conexion.subscribe(player);

      message.reply(`🎶 Reproduciendo: **${resultado[0].title}**`);
    } catch (error) {
      console.error(error);
      message.reply('⚠️ Ocurrió un error al intentar reproducir la canción.');
    }
  }

  if (command === '!skip') {
    player.stop();
    message.reply('⏩ Canción saltada.');
  }

  if (command === '!stop') {
    player.stop();
    message.reply('⏹️ Música detenida.');
  }

  if (command === '!leave') {
    const connection = getVoiceConnection(message.guild.id);
    if (connection) {
      connection.destroy();
      message.reply('👋 Salí del canal de voz.');
    } else {
      message.reply('❌ No estoy en un canal de voz.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN);