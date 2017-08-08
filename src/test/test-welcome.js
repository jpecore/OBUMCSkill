const
conversation = require('alexa-conversation');
// your Alexa skill main file. app.handle needs to exist
// https://www.npmjs.com/package/alexa-conversation
// asserts that response and reprompt are equal to the given text
// .shouldEqual('Welcome to the Stamp Collector skill', 'I did not understand.
// What did you say')
// assert not Equals
// .shouldNotEqual('Wrong answer', 'Wrong reprompt')
// fuzzy match, not recommended for production use. See readme.md for more
// details
// .shouldApproximate('This is an approximate match')
const
app = require('../index.js');
const
opts = {
    name : 'Welcome to OBUMC Skill',
    app : app,
    appId : 'amzn1.ask.skill.898dda13-5ac4-4283-b8f5-24dde9fcb08a'
};

conversation(opts)
 


//
// Test
//
.userSays('ReadWelcome') //  
.ssmlResponse //  
.shouldContain('We try to make you feel comfortable')
.shouldNotContain('<break time=\'1s\'/>   <break')

//
// Test
//
.userSays('Services') //  
.ssmlResponse //  
.shouldContain('services')
 

 //
// Test
//
.userSays('Blog') //  
.ssmlResponse //  
.shouldContain('Good morning')
 




//
// END Test
.end(); // this will actually
