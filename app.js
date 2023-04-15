const { App: SlackApp } = require('@slack/bolt');
const { LogLevel } = require('@slack/logger');
const { Configuration, OpenAIApi } = require("openai");


// Initializes your app with your bot token and app token
const slackApp = new SlackApp({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  scopes: ['chat:write', 'commands'],
  // logLevel: LogLevel.DEBUG,
  logLevel: LogLevel.INFO,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const systemPrompt = "You are an AI language model named Lucy and will now generate a kuudere response to the user's question or statement.";

// userContexts is keyed by UserKey, and stores the 20 most recent messages from that user on that platform
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
  if (userContexts[userKey].length > 20) {
    userContexts[userKey].shift();
  }
}

function recordAssistantResponse(userKey, response) {
  if (userContexts[userKey] === undefined) {
    userContexts[userKey] = [];
  }
  userContexts[userKey].push({ role: "assistant", content: response })
  if (userContexts[userKey].length > 20) {
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


slackApp.event('app_mention', async ({ event, client, logger }) => {
  let reply = undefined;
  try {
    const regex = /^<@\w+>\s*/;
    const prompt = event.text.replace(regex, "");
    logger.info(`Prompt: ${prompt}`);

    // openai.listModels().then((data) => {
    //   logger.info(JSON.stringify(data.data));
    // });

    const userKey = getUserKey("slack", event.user);
    const chatMsg = buildUserContextMessages(userKey, prompt);

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
      logger.info(JSON.stringify(response.data));
    } catch (e) {
      logger.info(response.data);
    }

    reply = response.data.choices[0]['message']['content'];
  }
  catch (error) {
    logger.error(error);

    await client.chat.postMessage({
      channel: event.channel,
      text: ` <@${event.user}> got an error :disappointed:`
    });
  }

  // respond
  if (reply) {
    recordUserPrompt(userKey, prompt);
    recordAssistantResponse(userKey, reply);
    try {
      await client.chat.postMessage({
        channel: event.channel,
        text: ` <@${event.user}> ${reply}`
      });
    } catch (error) {
      logger.error(error);
    }
  }
});

(async () => {
  // Start your app
  await slackApp.start();

  console.log('⚡️ Bolt app is running!');
})();