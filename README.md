# LLM Chat Bot With multi App Support

This is a chat bot that uses the OpenAI API for an LLM, with frontend connections to Slack and Discord.

## Features
* OpenAI (`gpt-3.5-turbo` model by default) API integration for LLM
* Supports multiple apps (Slack and Discord)
* Maintains context for each user on each app (last 20 messages)
* Easily deploy on Heroku

## Setup

Discord app setup: https://discord.com/developers, create new application, and get the bot token

Slack app setup: https://slack.dev/bolt-js/tutorial/getting-started

OpenAI API key: https://platform.openai.com/


1. Clone this repo
2. Create Heroku App
    a. create an app on heroku
    b. Add environment variables to the heroku app
        a. `OPENAI_API_KEY`
        b. `SLACK_APP_TOKEN`
        c. `SLACK_BOT_TOKEN`
        d. `SLACK_SIGNING_SECRET`
        e. `DISCORD_BOT_TOKEN`
3. Deploy Heroku App
    a. install `make` and `heroku` cli
    b. `make login` (login to heroku cli)
    c. `make deploy` (deploy to heroku)


Modify `systemPrompt` in `app.js` to change the prompt for the LLM.