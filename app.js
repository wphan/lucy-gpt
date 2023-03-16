const { App } = require('@slack/bolt');
const { LogLevel } = require('@slack/logger');
const { Configuration, OpenAIApi } = require("openai");


// Initializes your app with your bot token and app token
const app = new App({
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


app.event('app_mention', async ({ event, client, logger }) => {
  let reply = undefined;
  try {
    const regex = /^<@\w+>\s*/;
    const prompt = event.text.replace(regex, "");
    logger.info(`Prompt: ${prompt}`);

    // openai.listModels().then((data) => {
    //   logger.info(JSON.stringify(data.data));
    // });

    response = await openai.createCompletion({
      // model: "gpt-3.5-turbo",
      model: "text-davinci-002",
      prompt: prompt,
      max_tokens: 150,
      n: 1,
      // stop: null,
      temperature: 0.5,
    });

    logger.info(response);

    reply = response.choices[0].text.trim();
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

/*
app.message(/^(.*)/, async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log(message);
  console.log("match:");
  console.log()
  try {
    await say({
      blocks: [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `Hey there <@${message.user}>!`
          },
          "accessory": {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "Click Me"
            },
            "action_id": "button_click"
          }
        }
      ],
      text: `Hey there <@${message.user}>!`
    });
  } catch (e) {
    console.error(e);
  }
});

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  await say(`<@${body.user.id}> clicked the button`);
});
*/

(async () => {
  // Start your app
  await app.start();

  console.log('⚡️ Bolt app is running!');
})();