const { App: SlackApp } = require('@slack/bolt');
const { LogLevel } = require('@slack/logger');
// const Discord = require('discord.js');
// const { Events } = require('discord.js');
const { Client: DiscordClient, Collection, GatewayIntentBits, Events } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");

const slackApp = new SlackApp({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  scopes: ['chat:write', 'commands'],
  // logLevel: LogLevel.DEBUG,
  logLevel: LogLevel.INFO,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const discordClient = new DiscordClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ]
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const systemPrompt = "You are an AI language model named Lucy and will now generate a tsundere response to the user's question or statement.";
const maxContextLengthPerUser = 20;

// userContexts is keyed by UserKey, and stores the maxContextLengthPerUser most recent messages from that user on that platform
const userContexts = {};

// getUserKey returns the platform the user is from, and that user's ID on the platform
function getUserKey(platform, userId) {
  return `${platform}:${userId}`;
}

function recordUserPrompt(userKey, prompt) {
  if (userContexts[userKey] === undefined) {
    userContexts[userKey] = [];
  }
  userContexts[userKey].push({ role: "user", content: prompt })
  if (userContexts[userKey].length > maxContextLengthPerUser) {
    userContexts[userKey].shift();
  }
}

function recordAssistantResponse(userKey, response) {
  if (userContexts[userKey] === undefined) {
    userContexts[userKey] = [];
  }
  userContexts[userKey].push({ role: "assistant", content: response })
  if (userContexts[userKey].length > maxContextLengthPerUser) {
    userContexts[userKey].shift();
  }
}

function buildUserContextMessages(userKey, newPrompt) {
  // build the message to send to openAI, start with the system prompt, then all previous messages from the user, then the new prompt
  let messages = [{ role: "system", content: systemPrompt }];
  if (userContexts[userKey] !== undefined) {
    messages = messages.concat(userContexts[userKey]);
  }
  messages.push({ role: "user", content: newPrompt });
  return messages;
}

async function doPrompt(chatMsg) {
  response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: chatMsg,
    // messages: [
    //   { role: "system", content: systemPrompt },
    //   { role: "user", content: prompt },
    // ],
    // max_tokens: 150,
    // n: 1,
    // stop: null,
    temperature: 0.3,
  });

  try {
    console.log(JSON.stringify(response.data));
  } catch (e) {
    console.log(response.data);
  }

  return response.data.choices[0]['message']['content'];
}


slackApp.event('app_mention', async ({ event, client }) => {
  let reply = undefined;
  const userKey = getUserKey("slack", event.user);
  const regex = /^<@\w+>\s*/;
  const prompt = event.text.replace(regex, "");
  console.log(`User: ${userKey}, Prompt: ${prompt}`);
  try {

    // openai.listModels().then((data) => {
    //   console.log(JSON.stringify(data.data));
    // });

    const chatMsg = buildUserContextMessages(userKey, prompt);
    reply = await doPrompt(chatMsg);
  }
  catch (error) {
    console.error(error);

    await client.chat.postMessage({
      channel: event.channel,
      text: ` <@${event.user}> got an error :disappointed:`
    });
  }

  if (reply) {
    recordUserPrompt(userKey, prompt);
    recordAssistantResponse(userKey, reply);
    try {
      await client.chat.postMessage({
        channel: event.channel,
        text: ` <@${event.user}> ${reply}`
      });
    } catch (error) {
      console.error(error);
    }
  }
});

discordClient.on(Events.Error, console.error);

discordClient.on(Events.MessageCreate, async (message) => {
  if (!message.mentions.has(discordClient.user)) {
    return;
  }

  const userKey = getUserKey("discord", message.author.id);
  const regex = /^<@\w+>\s*/;
  const prompt = message.content.replace(regex, "");
  console.log(`User: ${userKey}, Prompt: ${prompt}`);

  try {
    const chatMsg = buildUserContextMessages(userKey, prompt);
    reply = await doPrompt(chatMsg);
  } catch (error) {
    console.error(error);
    await message.channel.send(`<@${message.author.id}> got an error :disappointed:`);
  }

  if (reply) {
    recordUserPrompt(userKey, prompt);
    recordAssistantResponse(userKey, reply);
    try {
      await message.channel.send(`<@${message.author.id}> ${reply}`);
    } catch (error) {
      console.error(error);
    }
  }
});


(async () => {
  await slackApp.start();
  await discordClient.login(process.env.DISCORD_TOKEN);
  console.log(`Logged in to Discord as ${discordClient.user}!`)

  console.log('⚡️ Bolt app is running!');
})();