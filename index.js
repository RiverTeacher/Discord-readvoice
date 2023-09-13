const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource } = require('@discordjs/voice');
const axios = require('axios');

const TOKEN = 'YOUR_BOT_TOKEN';
const PREFIX = '!';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.guild) return;

    if (message.content === `${PREFIX}join`) {
        const member = message.member;
        const channel = member?.voice.channel;

        if (channel) {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            // チャンネルを保存
            const savedChannel = message.channel;

            // メッセージ受信時の処理
            connection.subscribe(savedChannel);

            connection.on('stateChange', (oldState, newState) => {
                if (newState.status === 'disconnected') {
                    connection.destroy();
                }
            });

            // チャンネルで発言された内容をAPIに送信して音声を取得
            const text = encodeURIComponent(message.content);
            const apiURL = `https://api.tts.quest/v3/voicevox/synthesis?key=o62-h82-7091700&speaker=3&text=${text}`;

            try {
                const response = await axios.get(apiURL);
                const mp3DownloadUrl = response.data.mp3DownloadUrl;

                // 音声をダウンロードして再生
                if (mp3DownloadUrl) {
                    const audioPlayer = createAudioPlayer({
                        behaviors: {
                            noSubscriber: NoSubscriberBehavior.Play,
                        },
                    });

                    const audioResource = createAudioResource(mp3DownloadUrl);
                    audioPlayer.play(audioResource);

                    // VCに再生
                    connection.subscribe(audioPlayer);

                    audioPlayer.on('error', (error) => {
                        console.error('Audio Player Error:', error);
                    });
                }
            } catch (error) {
                console.error('APIリクエストエラー:', error);
            }
        } else {
            message.reply('VCに参加している必要があります。');
        }
    }
});

client.login(TOKEN);
