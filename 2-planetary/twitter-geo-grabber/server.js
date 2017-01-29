'use strict';

var Twitter = require('twitter');
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
  consumer_key: secrets.key,
  consumer_secret: secrets.secret,
  access_token_key: secrets.tokenKey,
  access_token_secret: secrets.tokenSecret
});


// main function
function twitterData(req, res, next) {
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
          json.push({
            id: data.users[i].id,
            location: data.users[i].location,
          });
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


  while (ret === undefined) {
    deasync.runLoopOnce();
  }
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
          json.push({
            id: data.users[i].id,
            location: data.users[i].location,
          });
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


// deal w/ the routing
app.route('/:name').get(twitterData);


var server = app.listen(process.env.PORT || 2000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
