# Slack hangman bot
A simple bot to play hangman on slack.

It uses botkit (https://github.com/howdyai/botkit) and the code is terribly ugly. You can connect it and send `rules hangman` to the bot to see the rules. It also has a feature to save texts, but it doesn't persist it.

To use it, first export your slack bot api key like this `export slackBotKey=theKeyHere`, then do a `npm install` and `node index.js`.
