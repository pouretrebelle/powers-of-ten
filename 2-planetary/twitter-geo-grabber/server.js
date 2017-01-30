'use strict';

var Twitter = require('twitter');
var GooglePlaces = require('node-googleplaces');
var secrets = require('./secrets');

var express = require('express');
var deasync = require('deasync');

// setup server
var app = express();

// health check
var healthcheck = {
  version: require('./package').version,
  http: 'okay'
};
// healthcheck info public
app.get(['/healthcheck'], function(req, res) {
  res.jsonp(healthcheck);
});


// setup twitter client
var client = new Twitter({
  consumer_key: secrets.twitterKey,
  consumer_secret: secrets.twitterSecret,
  access_token_key: secrets.twitterTokenKey,
  access_token_secret: secrets.twitterTokenSecret
});


// setup google places client
var places = new GooglePlaces(secrets.googleMapsKey);


// main function
function twitterData(req, res, next) {
  res.setTimeout(0);
  var json = {
    friends: getFriends(req.params.name),
    followers: getFollowers(req.params.name),
  };
  res.send(json);
};


// get friends
function getFriends(username) {
  var json = [];
  var ret;

  var params = {
    cursor: -1,
    screen_name: username,
    skip_status: true,
    count: 200,
    include_user_entities: false,
  };

  client.get('friends/list.json', params, function getData(error, data, response) {
    if (!error) {
      for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].location) {
          var user = userData(data.users[i]);
          if (user) json.push(user);
        }
      }
      params.cursor = data.next_cursor;
      if (params.cursor > 0) {
        client.get('friends/list.json', params, getData);
      }
      else {
        ret = json;
      }
    }
    else {
      ret = false;
    }
  });



  deasync.loopWhile(function(){return ret === undefined});
  return ret;
}


// get followers
function getFollowers(username) {
  var json = [];
  var ret;

  var params = {
    cursor: -1,
    screen_name: username,
    skip_status: true,
    count: 200,
    include_user_entities: false,
  };

  client.get('followers/list.json', params, function getData(error, data, response) {
    if (!error) {
      for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].location) {
          var user = userData(data.users[i]);
          if (user) json.push(user);
        }
      }
      params.cursor = data.next_cursor;
      if (params.cursor > 0) {
        client.get('followers/list.json', params, getData);
      }
      else {
        ret = json;
      }
    }
    else {
      ret = false;
    }
  });


  while (ret === undefined) {
    deasync.runLoopOnce();
  }
  return ret;
}


function userData(user) {
    var loc = getLocation(user.location);
    if (!loc) return false;
    var single = {
      id: user.id,
      name: user.name,
      username: user.screen_name,
      followers: user.followers_count,
      location: loc,
    };
    console.log(single);
    return single;
}


// get Places location
function getLocation(str) {
  var ret;

  places.textSearch({query: str}, function(error, data) {
    if (!error && data.body && data.body.results && data.body.results[0]) {
      ret = {
        name: data.body.results[0].formatted_address,
        geometry: data.body.results[0].geometry.location,
      };
    }
    else {
      if (data.body) {
        console.log(data.body.error_message);
      } else {
        console.log(error);
      }
      ret = false;
    }
  });

  deasync.loopWhile(function(){return ret === undefined});

  return ret;
}


// deal w/ the routing
app.route('/:name').get(twitterData);


var server = app.listen(process.env.PORT || 2000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
server.timeout = 0;
