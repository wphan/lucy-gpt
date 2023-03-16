const { App } = require('@slack/bolt');
const { LogLevel } = require('@slack/logger');

/* 
This sample slack application uses SocketMode
For the companion getting started setup guide, 
see: https://slack.dev/bolt-js/tutorial/getting-started 
*/

// Initializes your app with your bot token and app token
const app = new App({
  appToken: process.env.SLACK_APP_TOKEN,
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  scopes: ['chat:write', 'commands'],
  logLevel: LogLevel.DEBUG,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

app.event('app_mention', async ({ event, client, logger }) => {
  console.log(event);
  try {
    // Call chat.postMessage with the built-in client
    const result = await client.chat.postMessage({
      channel: event.channel,
      text: ` <@${event.user}> :smirk:`
    });
    logger.info(result);
  }
  catch (error) {
    logger.error(error);
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