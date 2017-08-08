'use strict';

var Alexa = require('alexa-sdk');
var audioData = require('./audioAssets');
var constants = require('./constants');
var https = require('https');
var http = require('http');

var stateHandlers = {
    startModeIntentHandlers : Alexa.CreateStateHandler(constants.states.START_MODE, {
        /*
	 * All Intent Handlers for state : START_MODE
	 */
        'LaunchRequest' : function () {
            // Initialize Attributes
            this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
            this.attributes['index'] = 0;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['loop'] = true;
            this.attributes['shuffle'] = false;
            this.attributes['playbackIndexChanged'] = true;
            // Change state to START_MODE
            this.handler.state = constants.states.START_MODE;

            var message = 'Welcome to the OBUMC. You can say, play latest sermon, hear the welcome messaage, find out when worship services are held, ask for contact information. How can I help you today?';
            var reprompt = 'You can say, play the sermon, to begin.';

            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'PlayAudio' : function () {
            if (!this.attributes['playOrder']) {
                // Initialize Attributes if undefined.
                this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['loop'] = true;
                this.attributes['shuffle'] = false;
                this.attributes['playbackIndexChanged'] = true;
                // Change state to START_MODE
                this.handler.state = constants.states.START_MODE;
            }
            controller.play.call(this);
        },
        'ReadWelcome' : function () {
            getHtmlOBUMCpage("http://www.oldbridgechurch.org/im-new-here/", (page) =>   {           
                 var welcomeTexts = ParseWelcomeMsg(page);
        	 this.attributes['welcomeText'] = welcomeTexts;
        	//  console.log ("welcomeText saving " + welcomeText)
                controller.ReadWelcome.call(this);
            });            
           
        },
        'Services' : function () {
            getHtmlOBUMCpage("http://www.oldbridgechurch.org/worship/sunday-services/", (page) => {
             
                 var Services = ParseServiceMsg(page);
        	 this.attributes['ServicesText'] = Services;
        	  console.log ("ServicesText saving " + Services)
                controller.Services.call(this);
            });
            
           
        },
        'Contact' : function () {
            getHtmlOBUMCpage("http://obumc.org/Contact-Us", (page) => {
                
                var Contact = ParseContactMsg(page);
       	 this.attributes['ContactText'] = Contact;
       	// console.log ("welcomeText saving " + welcomeText)
               controller.Contact.call(this);
           });
           
          
       },
       'Blog' : function () {
           getHtmlOBUMCpage("http://thebridge.oldbridgechurch.org/isaiah-3322new-living-translation-nlt/", (page) => {
               
         var Blog = ParseBlogMsg(page);
      	 this.attributes['Blog'] = Blog;
      	 console.log ("Blog saving " + Blog)
              controller.Blog.call(this);
          });
          
         
      },
        
        'AMAZON.HelpIntent' : function () {
            var message = 'Welcome to the OUBMC sermons . You can say, play latest sermon, hear the welcome messaage, find out when worship services are held, ask for contact information. How can I help you today?';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.StopIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.CancelIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, I could not understand. Please say help for more info.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    }),
    playModeIntentHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
	 * All Intent Handlers for state : PLAY_MODE
	 */
        'LaunchRequest' : function () {
            /*
	     * Session resumed in PLAY_MODE STATE. If playback had finished
	     * during last session : Give welcome message. Change state to
	     * START_STATE to restrict user inputs. Else : Ask user if he/she
	     * wants to resume from last position. Change state to
	     * RESUME_DECISION_MODE
	     */
            var message;
            var reprompt;
            if (this.attributes['playbackFinished']) {
                this.handler.state = constants.states.START_MODE;
                message = 'Welcome to the OUBMC skill. You can say, play latest sermon, hear the welcome messaage, find out when worship services are held, ask for contact information. How can I help you today?';
                reprompt = 'You can say, play the audio, to begin.';
            } else {
                this.handler.state = constants.states.RESUME_DECISION_MODE;
                message = 'You were listening to ' + audioData[this.attributes['playOrder'][this.attributes['index']]].title +
                    ' Would you like to resume?';
                reprompt = 'You can say yes to resume or no to play from the top.';
            }

            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
       
  'PlayAudio' : function () { controller.play.call(this) }, 
        'AMAZON.NextIntent' : function () { controller.playNext.call(this) },
        'AMAZON.PreviousIntent' : function () { controller.playPrevious.call(this) },
        'AMAZON.PauseIntent' : function () { controller.stop.call(this) },
        'AMAZON.StopIntent' : function () { controller.stop.call(this) },
        'AMAZON.CancelIntent' : function () { controller.stop.call(this) },
        'AMAZON.ResumeIntent' : function () { controller.play.call(this) },
        'AMAZON.LoopOnIntent' : function () { controller.loopOn.call(this) },
        'AMAZON.LoopOffIntent' : function () { controller.loopOff.call(this) },
        'AMAZON.ShuffleOnIntent' : function () { controller.shuffleOn.call(this) },
        'AMAZON.ShuffleOffIntent' : function () { controller.shuffleOff.call(this) },
        'AMAZON.StartOverIntent' : function () { controller.startOver.call(this) },
        'AMAZON.HelpIntent' : function () {
            // This will be called while audio is playing and a user says "ask
	    // <invocation_name> for help"
            var message = 'You are listening to the OUBMC sermons. You can say, Next or Previous to navigate through the playlist. ' +
                'At any time, you can say Pause to pause the audio and Resume to resume.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, I could not understand. You can say, Next or Previous to navigate through the playlist.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    }),
    remoteControllerHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
	 * All Requests are received using a Remote Control. Calling
	 * corresponding handlers for each of them.
	 */
        'PlayCommandIssued' : function () { controller.play.call(this) },
        'PauseCommandIssued' : function () { controller.stop.call(this) },
        'NextCommandIssued' : function () { controller.playNext.call(this) },
        'PreviousCommandIssued' : function () { controller.playPrevious.call(this) }
    }),
    resumeDecisionModeIntentHandlers : Alexa.CreateStateHandler(constants.states.RESUME_DECISION_MODE, {
        /*
	 * All Intent Handlers for state : RESUME_DECISION_MODE
	 */
        'LaunchRequest' : function () {
            var message = 'You were listening to ' + audioData[this.attributes['playOrder'][this.attributes['index']]].title +
                ' Would you like to resume?';
            var reprompt = 'You can say yes to resume or no to play from the top.';
            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.YesIntent' : function () { controller.play.call(this) },
        'AMAZON.NoIntent' : function () { controller.reset.call(this) },
        'AMAZON.HelpIntent' : function () {
            var message = 'You were listening to ' + audioData[this.attributes['index']].title +
                ' Would you like to resume?';
            var reprompt = 'You can say yes to resume or no to play from the top.';
            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.StopIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.CancelIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, this is not a valid command. Please say help to hear what you can say.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    }) 
};

module.exports = stateHandlers;

var controller = function () {
    return {
        ReadWelcome: function () {
            /*
	     * read welcome page
	     */
          
            var message =  this.attributes['welcomeText'] ;
            // console.log ("welcomeText = " + message);
            this.response.speak(message);
            this.emit(':responseReady');
        },
        Services: function () {
                    
            var message =  this.attributes['ServicesText'] ;
            
            this.response.speak(message);
            this.emit(':responseReady');
        },
        Contact: function () {
           
            var message =  this.attributes['ContactText'] ;           
            this.response.speak(message);
            this.emit(':responseReady');
        },
 
        Blog: function () {
           
            var message =  this.attributes['Blog'] ;           
            this.response.speak(message);
            this.emit(':responseReady');
        },
        play: function () {
            /*
	     * Using the function to begin playing audio when: Play Audio intent
	     * invoked. Resuming audio when stopped/paused. Next/Previous
	     * commands issued.
	     */
            this.handler.state = constants.states.PLAY_MODE;

            if (this.attributes['playbackFinished']) {
                // Reset to top of the playlist when reached end.
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['playbackIndexChanged'] = true;
                this.attributes['playbackFinished'] = false;
            }

            var token = String(this.attributes['playOrder'][this.attributes['index']]);
            var playBehavior = 'REPLACE_ALL';
            var podcast = audioData[this.attributes['playOrder'][this.attributes['index']]];
            var offsetInMilliseconds = this.attributes['offsetInMilliseconds'];
            // Since play behavior is REPLACE_ALL, enqueuedToken attribute need
	    // to be set to null.
            this.attributes['enqueuedToken'] = null;

            if (canThrowCard.call(this)) {
                var cardTitle = 'Playing ' + podcast.title;
                var cardContent = 'Playing ' + podcast.title;
                this.response.cardRenderer(cardTitle, cardContent, null);
            }

            this.response.audioPlayerPlay(playBehavior, podcast.url, token, null, offsetInMilliseconds);
            this.emit(':responseReady');
        },
        stop: function () {
            /*
	     * Issuing AudioPlayer.Stop directive to stop the audio. Attributes
	     * already stored when AudioPlayer.Stopped request received.
	     */
            this.response.audioPlayerStop();
            this.emit(':responseReady');
        },
        playNext: function () {
            /*
	     * Called when AMAZON.NextIntent or
	     * PlaybackController.NextCommandIssued is invoked. Index is
	     * computed using token stored when AudioPlayer.PlaybackStopped
	     * command is received. If reached at the end of the playlist,
	     * choose behavior based on "loop" flag.
	     */
            var index = this.attributes['index'];
            index += 1;
            // Check for last audio file.
            if (index === audioData.length) {
                if (this.attributes['loop']) {
                    index = 0;
                } else {
                    // Reached at the end. Thus reset state to start mode and
		    // stop playing.
                    this.handler.state = constants.states.START_MODE;

                    var message = 'You have reached at the end of the playlist.';
                    this.response.speak(message).audioPlayerStop();
                    return this.emit(':responseReady');
                }
            }
            // Set values to attributes.
            this.attributes['index'] = index;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;

            controller.play.call(this);
        },
        playPrevious: function () {
            /*
	     * Called when AMAZON.PreviousIntent or
	     * PlaybackController.PreviousCommandIssued is invoked. Index is
	     * computed using token stored when AudioPlayer.PlaybackStopped
	     * command is received. If reached at the end of the playlist,
	     * choose behavior based on "loop" flag.
	     */
            var index = this.attributes['index'];
            index -= 1;
            // Check for last audio file.
            if (index === -1) {
                if (this.attributes['loop']) {
                    index = audioData.length - 1;
                } else {
                    // Reached at the end. Thus reset state to start mode and
		    // stop playing.
                    this.handler.state = constants.states.START_MODE;

                    var message = 'You have reached at the start of the playlist.';
                    this.response.speak(message).audioPlayerStop();
                    return this.emit(':responseReady');
                }
            }
            // Set values to attributes.
            this.attributes['index'] = index;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;

            controller.play.call(this);
        },
        loopOn: function () {
            // Turn on loop play.
            this.attributes['loop'] = true;
            var message = 'Loop turned on.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        loopOff: function () {
            // Turn off looping
            this.attributes['loop'] = false;
            var message = 'Loop turned off.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        shuffleOn: function () {
            // Turn on shuffle play.
            this.attributes['shuffle'] = true;
            shuffleOrder((newOrder) => {
                // Play order have been shuffled. Re-initializing indices and
		// playing first song in shuffled order.
                this.attributes['playOrder'] = newOrder;
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['playbackIndexChanged'] = true;
                controller.play.call(this);
            });
        },
        shuffleOff: function () {
            // Turn off shuffle play.
            if (this.attributes['shuffle']) {
                this.attributes['shuffle'] = false;
                // Although changing index, no change in audio file being played
		// as the change is to account for reordering playOrder
                this.attributes['index'] = this.attributes['playOrder'][this.attributes['index']];
                this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
            }
            controller.play.call(this);
        },
        startOver: function () {
            // Start over the current audio file.
            this.attributes['offsetInMilliseconds'] = 0;
            controller.play.call(this);
        },
        reset: function () {
            // Reset to top of the playlist.
            this.attributes['index'] = 0;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;
            controller.play.call(this);
        }
    }
}();

function canThrowCard() {
    /*
     * To determine when can a card should be inserted in the response. In
     * response to a PlaybackController Request (remote control events) we
     * cannot issue a card, Thus adding restriction of request type being
     * "IntentRequest".
     */
    if (this.event.request.type === 'IntentRequest' && this.attributes['playbackIndexChanged']) {
        this.attributes['playbackIndexChanged'] = false;
        return true;
    } else {
        return false;
    }
}

function shuffleOrder(callback) {
    // Algorithm : Fisher-Yates shuffle
    var array = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
    var currentIndex = array.length;
    var temp, randomIndex;

    while (currentIndex >= 1) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    }
    callback(array);
};

function ParseWelcomeMsg  (HTMLpage) {

    var retString = "", endIndex, startIndex = 0;
    var Firstdelimiter = "We try to make you feel comfortable";
    var Lastdelimiter = "ready for the rest of the week.";
    var delimiterSize = 1;
   
    var eventText = HTMLpage.substring( HTMLpage.indexOf(Firstdelimiter), HTMLpage.indexOf(Lastdelimiter)+ Lastdelimiter.length );
    var eventText = removeHTML(eventText);
   
    if (eventText.length == 0) {
	return "";
    }
 	// replace dashes returned in text from API
	eventText = eventText.replace(/\n/g, '');
	eventText = eventText.replace(/\r/g, '');   // \r\n\t\
	eventText = eventText.replace(/\t/g, ' ');
	eventText = eventText.replace(/\&nbsp;/g, ' ');
	// console.log ("from ParseWelcomeMsg eventText: " + eventText);
	// eventText = eventText.replace(/\u2013\s*/g, ' ');
	// eventText = eventText.replace(/\u201d\s*/g, ' ');
	// eventText = eventText.replace(/\u201c\s*/g, ' ');
	// eventText = eventText.replace(/\u2018\s*/g, ' ');
	// eventText = eventText.replace(/\u201A\s*/g, ' ');
	// eventText = eventText.replace(/\u201B\s*/g, ' ');
	// eventText = eventText.replace(/\u2032\s*/g, ' ');
	// eventText = eventText.replace(/\u2035\s*/g, ' ');
	// eventText = eventText.replace(/\u005c\s*/g, ' ');
	
	// eventText = eventText.replace(/[^\.\w\s]/gi, '')
	  
	 
 
	// console.log("parsing eventText ");
	// console.log ("from ParseWelcomeMsg eventText: " + eventText);
	 return eventText;
}
function ParseServiceMsg  (HTMLpage) {

    var retString = "", endIndex, startIndex = 0;
    var Firstdelimiter = "Sunday Worship Services";
    var Lastdelimiter = "Sunday morning activities!";
   
    var eventText = HTMLpage.substring( HTMLpage.indexOf(Firstdelimiter), HTMLpage.indexOf(Lastdelimiter)+ Lastdelimiter.length );
    var eventText = removeHTML(eventText);
   
    if (eventText.length == 0) {
	return "";
    }
     
	eventText = eventText.replace(/\n/g, '');
	eventText = eventText.replace(/\r/g, '');   // \r\n\t\
	eventText = eventText.replace(/\t/g, ' ');
	eventText = eventText.replace(/\&nbsp;/g, ' ');
	eventText =  eventText.replace(/<li\/>/g, 'break');
	
	 
	
	// console.log("parsing eventText ");
	// console.log ("from ParseWelcomeMsg eventText: " + eventText);
	 return eventText;
}
function ParseContactMsg  (HTMLpage) {

    var retString = "", endIndex, startIndex = 0;
    var Firstdelimiter = "Old Bridge United Methodist Church";
    var Lastdelimiter = "email:&nbsp;Churchoffice@oldbridgechurch.org";
   
   
    var eventText = HTMLpage.substring( HTMLpage.indexOf(Firstdelimiter), HTMLpage.indexOf(Lastdelimiter)+ Lastdelimiter.length );
    var eventText = removeHTML(eventText);
   
    if (eventText.length == 0) {
	return "";
    }
     
	eventText = eventText.replace(/\n/g, '');
	eventText = eventText.replace(/\r/g, '');   // \r\n\t\
	eventText = eventText.replace(/\t/g, ' ');
	eventText = eventText.replace(/\&nbsp;/g, ' ');
	 
	
	// console.log("parsing eventText ");
	// console.log ("from ParseWelcomeMsg eventText: " + eventText);
	 return eventText;
}
    

function ParseBlogMsg  (HTMLpage) {

    var retString = "", endIndex, startIndex = 0;
    var Firstdelimiter = '<div class="resurrect-entry-content resurrect-clearfix">';
    var Lastdelimiter = '<div class="sharedaddy sd-sharing-enabled">';
   
   
    var eventText = HTMLpage.substring( HTMLpage.indexOf(Firstdelimiter) + Firstdelimiter.length, HTMLpage.indexOf(Lastdelimiter) );
    var eventText = removeHTML(eventText);
   
    if (eventText.length == 0) {
	return "";
    }
     
	eventText = eventText.replace(/\n/g, '');
	eventText = eventText.replace(/\r/g, '');   // \r\n\t\
	eventText = eventText.replace(/\t/g, ' ');
	eventText = eventText.replace(/\&nbsp;/g, ' ');
	 
	
	// console.log("parsing eventText ");
	// console.log ("from ParseWelcomeMsg eventText: " + eventText);
	 return eventText;
}
     
 
function removeHTML(s) {
    // console.log ("s:" + s)
    var re = /<(?:.|\n|\/)*?>/g;
     
  //   s =  s.replace(/<font(.*)>/g, 'break');
     s =  s.replace(/<br\/>/g, 'break');
     s =  s.replace(/<\/div>/g, 'break');
     
   
     

   // s = s.replace(/<\/font(.*)>/g, 'fontend');
   
     s = s.replace(re, ' ');
     
      s =  s.replace(/break/gm, "<break time='1s'/>");
     // <break time=\'1s\'/>   <break time=\'1s\'/>
    
    
    // s = s.replace(/fontend/gm, '\<\/p\>');
    // console.log ("s ="+ s);
    return s;
    
    
   // s = s.replace(/ppp/gm, '<p>');
  // s = s.replace(/xxx/gm, '<\\p>');
}; // end RemoveHTML


function getHtmlOBUMCpage(pageURL, eventCallback) {
    console.log("pageURL = " + pageURL);
   http.get(pageURL, function(res) {
	
	var body = '';
	res.on('data', function(chunk) {
	 // console.log("getting chunks " );
	    body += chunk;
	});
	res.on('end', function() {
	  // var arrayResult = body;
	  // console.log ("body " + body);
	  // console.log ("returning body " );
	    eventCallback(body);
	});
   }).on('error', function(e) {
	console.log("Got error: ", e);
   });
   
}// end getHtmlOBUMCpage
