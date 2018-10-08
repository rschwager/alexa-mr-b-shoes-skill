var alexa = require('alexa-app');
var app = new alexa.app('mr_b_shoes_skill');
var csv = require('csv'); 
const parse = require('csv-parse');
var fs = require('fs');
var dateFormat = require('dateformat');

// Allow this module to be reloaded by hotswap when changed
module.change_code = 1;
module.exports = app;


app.launch(function(req,res) {
  // Add what you what the skill to do when the skill starts
	res.say("Welcome to Mr. B's sneaker closet by Hannah.  This skill was created for the school science fair.  Ask for " +
          "help to learn more.");
  res.shouldEndSession (false, "To hear about a shoe, ask me what shoe Mr. B wore on a date.");
});

app.intent('AMAZON.HelpIntent', 
    {
        "slots": {},
        "utterances": [
            "help", "how to use"
        ]
    },
    function (request, response) {
      // Add what you what the skill to do when you ask for help
	    response.say("Mr. B's shoe skill can help you understand the specific sneakers Mr. B " +
                   "has worn to school on any day. He has a really great sneaker collection. " +
                   "The commands for this are tell me what shoe Mr. B " +
                   "wore on a date. For example, tell me what shoe did Mr. B wear on October 24, 2017. Or, " +
                   "tell me any shoe Mr. B wore.");
      response.shouldEndSession(false);  

    }    
);

app.intent('AMAZON.StopIntent', stopSession);
app.intent('AMAZON.CancelIntent', stopSession);
app.sessionEnded(stopSession);

function stopSession(request, response) {
  // Add what you what to do when someone stops using the skill
  response.say("Thanks for using Mr. B's shoe skill.");
  response.shouldEndSession(true);  
}

function sayShoeInfo(shoeData, res) {
  var strDate = dateFormat(shoeData.Date, "mmmm dS, yyyy");
  var say = "On " + strDate + ", Mr. B wore the ";
  if (shoeData.Brand != '') {
    say += shoeData.Brand + ' ';
  }
  if (shoeData.Style != '') {
    say += shoeData.Style + ' ';
  }
  if (shoeData.ColorWay != '') {
    say += shoeData.ColorWay + ' ';
  }
  if (shoeData.Collaboration != '') {
    say += 'in collaboration with ' + shoeData.Collaboration;
  }
  res.say(say);
}

app.intent('ShoeIntent', {
  "slots": { "SHOEDATE": "AMAZON.DATE" },
  "utterances": ["Tell me what shoe Mr. B wore on {SHOEDATE}", "What shoe did Mr. B wear on {SHOEDATE}",
                 "Tell me about any shoe Mr. B wore.", "Tell me any shoe Mr. B wore"]
}, function(req, res) {
  
  var shoeDate = req.slot('SHOEDATE');
  console.log(shoeDate);

  if (typeof shoeDate === "undefined") {
    // Need to pick a random date
    var index = Math.round(Math.random() * listSize);
    var shoe = haveInfoDays[index];
    sayShoeInfo(shoe, res);
  }
  else if (typeof shoeList[shoeDate] === "undefined") {
    // We don't have info for this date
    res.say("Sorry, this skill only has shoe information for this school year.");
  }
  else if (shoeList[shoeDate].WasAbsent === "x") {
    // Mr. B was absent
    res.say("Mr. B was absent on this day.");
  }
  else if (shoeList[shoeDate].Weekend === "x") {
    // It was a weekend
    res.say("Sorry, this day was on the weekend.");
  }
  else if (shoeList[shoeDate].Holiday === "x") {
    // It was a weekend
    res.say("Sorry, this day was on a vacation day or holiday.");
  }
  else {
    // Talk about the shoe
    // We have info for this date
    var shoe = shoeList[shoeDate];
    sayShoeInfo(shoe, res);
  }

  console.log(shoeList[shoeDate]);
  res.shouldEndSession (false, "Would you like to hear about another shoe?");
});

// error handler example
app.error = function(e, request, response) {
  response.say("I captured the exception! It was: " + e.message);
};

// Shoe Information
function ShoeData(aDate, aBrand, aCollaboration, aStyle, aColorWay, absent, weekend, holiday) {
  this.Date = aDate;
  this.Brand = aBrand;
  this.Collaboration = aCollaboration;
  this.ColorWay = aColorWay;
  this.Style = aStyle;
  this.WasAbsent = absent;
  this.Weekend = weekend;
  this.Holiday = holiday;
};

var shoeList = [];
var haveInfoDays = [];
var listSize = 0;

// Create a parser to process the shoe list
var parser = parse({delimiter: ',', from: 2, ltrim: true, rtrim: true}, function(err, data){
    for (var index = 1; index < data.length; index++) {
        var shoeData = new ShoeData(data[index][0], data[index][1], data[index][2], data[index][3], data[index][4],
                                   data[index][5], data[index][6], data[index][7]);
        shoeList[shoeData.Date] = shoeData;
        if (shoeData.Style != '') {
          listSize++;
          haveInfoDays.push(shoeData);
        }
    }
    //console.log(shoeList);    
});

// Open up the shoe list
fs.createReadStream(__dirname+'/../../assets/BultemaShoeList.csv').pipe(parser);