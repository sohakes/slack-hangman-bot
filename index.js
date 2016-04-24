var Botkit = require('botkit');
var os = require('os');
var controller = Botkit.slackbot();

var forcaWordTemp = null
var forcaWord = null
var forcaWordHidden = null
var forcaErrorCount = 0
var correctLetters = []
var wrongLetters = []
var ideas = []

String.prototype.replaceAt=function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}

var bot = controller.spawn({
  token: process.env.slackBotKey
})
bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.hears(['store (.*) = (.*)'], ['direct_message,direct_mention,mention', 'ambient'], function(bot, message) {
  var matches = message.text.match(/store (.*) = (.*)/i)
  controller.hears(matches[1], ['direct_message,direct_mention,mention','ambient'], function(bot, message) {
    console.log("ouviu")
    bot.reply(message,matches[2])
  });
});


controller.hears(['hangman (.*)'], ['direct_message'], function(bot, message) {
  var matches = message.text.match(/hangman (.*)/i);
  forcaWordTemp = matches[1]
  bot.reply(message, "Now write `@" + bot.identity.name + ": start hangman` in a channel")
});

controller.hears(['rules hangman'], ['direct_message,direct_mention,mention','ambient'], function(bot, message) {
  bot.reply(message, "Commands: ")
  bot.reply(message, "Select a world (only by private message): `hangman *word*`")
  bot.reply(message, "Start hangman: `start hangman`")
  bot.reply(message, "End hangman: `end hangman`")
  bot.reply(message, "Try a word (only one try!): `word *word*`")
  bot.reply(message, "Try a letter: `letter *letter*`")
})

controller.hears(['start hangman'], ['direct_message,direct_mention,mention','ambient'], function(bot, message) {
  if (forcaWordTemp === null) {
    return
  }
  forcaWord = forcaWordTemp
  forcaWordTemp = null
  forcaWordHidden = '-'.repeat(forcaWord.length)
  bot.reply(message, "The hangman word is: " + forcafy(forcaWordHidden))
  bot.reply(message, "Read the rules typing `rules hangman`")
  forcaErrorCount = 0
  correctLetters = []
  wrongLetters = []
});

controller.hears(['end hangman'], ['direct_message,direct_mention,mention','ambient'], function(bot, message) {
  if(forcaWord != null || forcaWordTemp != null) {
    bot.reply(message, "Ok!")
  }
  forcaWord = null
  forcaWordTemp = null

});

function forcafy (word) {
  return word.split('').join(' ')
}

function wrongLetterMessageForca () {
  var messages = ["Head", "Body", "Right arm", "Left arm",
    "Right leg", "Left leg", "You died :(. Better luck next time."]
  return messages[forcaErrorCount - 1]
}

controller.hears(['word (.*)'], ['direct_message,direct_mention,mention','ambient'], function(bot, message) {
  if (forcaWord === null) {
    return
  }
  var word = message.text.match(/word (.*)/i)[1];

  if (forcaWord == word) {
    bot.reply(message, "You won! The word is " + forcaWord)
  } else {
    bot.reply(message, "You died :(. Better luck next time.")
    bot.reply(message, "The word was " + forcaWord)
  }

  forcaWord = null
  return
})

controller.hears(['letter (.)'], ['direct_message,direct_mention,mention','ambient'], function(bot, message) {
  if (forcaWord === null) {
    return
  }
  var letter = message.text.match(/letter (.)/i)[1];

  if (correctLetters.indexOf(letter) != -1 || wrongLetters.indexOf(letter) != -1) {
    bot.reply(message, "Letter already used, try another")
    return
  }

  var gotItRight = false

  for (var i = 0; i < forcaWord.length; i++) {
    if (letter === forcaWord[i]) {
      gotItRight = true
      forcaWordHidden = forcaWordHidden.replaceAt(i, letter)
    }
  }

  if (forcaWordHidden == forcaWord) {
    bot.reply(message, "You won! The word is " + forcaWord)
    forcaWord = null
    return
  } else {
    if (gotItRight) {
      correctLetters.push(letter)
      bot.reply(message, forcafy(forcaWordHidden))
    } else {
      forcaErrorCount++
      wrongLetters.push(letter)
      bot.reply(message, wrongLetterMessageForca())
      if (forcaErrorCount == 7) {
        bot.reply(message, "The word was " + forcaWord)
        forcaWord = null
        return
      }
    }
  }

  bot.reply(message, "Correct letters: " + correctLetters)
  bot.reply(message, "Incorrect letters: " + wrongLetters)
});

controller.hears(['Save text'], ['direct_message,direct_mention'], function(bot, message) {
  bot.startConversation(message, function(err,convo) {
    var a = new Object()
    convo.ask('What is the text title?', function(response,convo) {
      a.ideaTitle = response.text
      convo.next();
    });
    convo.ask("Great! Now what's the text?", function(response,convo) {
      a.ideaText = response.text
      convo.next();
    });

    convo.say('Cool! Text saved')
    ideas.push(a)
   })
})

controller.hears(['List texts'], ['direct_message,direct_mention'], function(bot, message) {
  bot.startConversation(message, function(err,convo) {
    convo.say('The texts are:')
    for (var i = 0; i < ideas.length; i++) {
      convo.say(i + 1 + ' - ' + ideas[i].ideaTitle)
    }
    var num = 0
    convo.ask("Type the number of the text you want to see", function(response,convo) {
      num = parseInt(response.text)

      num--;

      if (num >= ideas.length || num < 0) {
        convo.say('Invalid number')
        return
      }

      convo.say('The text is:')
      convo.say(ideas[num].ideaText)

      convo.next();
    });
  })
})

