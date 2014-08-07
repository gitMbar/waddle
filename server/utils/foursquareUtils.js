var https = require('https');
var qs = require('querystring');
var Q = require('q');

var utils = {};

//FOURSQUARE HELPER METHODS

utils.exchangeFoursquareUserCodeForToken = function (fsqCode) {
  var deferred = Q.defer();

  var query = {
    client_id: process.env.WADDLE_FOURSQUARE_CLIENT_ID,
    client_secret: process.env.WADDLE_FOURSQUARE_CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:8080/fsqredirect',
    code: fsqCode
  };

  var queryPath = 'https://foursquare.com/oauth2/access_token?' + qs.stringify(query);

  https.get(queryPath, function (res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      console.log(data);
      deferred.resolve(JSON.parse(data));
    })
  }).on('error', function(err) {
    deferred.reject(err);
  });
  return deferred.promise; 
};

utils.tabThroughFoursquareCheckinHistory = function (user) {
  var deferred = Q.defer();
  var offset = 0;
  var historyBucket = [];
  var fsqAccessToken = user.getProperty('fsqToken');
  utils.getFoursquareCheckinHistory(fsqAccessToken, offset)
  .then(function(checkinHistory) {
    historyBucket.push(checkinHistory);
    var checkinCount = checkinHistory.response.checkins.count;
    console.log('checkins count: '+ checkinCount);
    var numberOfTimesToTabThroughHistory = Math.ceil(checkinCount/250);
    for(var i = 1; i < numberOfTimesToTabThroughHistory; i++) {
      offset += 250;
      console.log('the offset is: ' + offset);
      utils.getFoursquareCheckinHistory(fsqAccessToken, offset)
      .then(function(tabbedCheckinHistory) {
        historyBucket.push(tabbedCheckinHistory);
        console.log(historyBucket);
        console.log("the length of this tab is: " + JSON.stringify(historyBucket[1].response.checkins.items.length));
        if(historyBucket.length === numberOfTimesToTabThroughHistory) {
          console.log('my history bucket: ' + historyBucket.length);
          deferred.resolve(historyBucket);
          return deferred.promise;
        }
       })
     }
   });
}

utils.getFoursquareCheckinHistory = function (userAccessToken, offset) {
  var deferred = Q.defer();
  var offsetString = offset.toString();
  // var fsqAccessToken = user.getProperty('fsqToken');
  var queryPath = 'https://api.foursquare.com/v2/users/self/checkins?v=20140806' +
  '&limit=250' +
  '&offset=' + offsetString +
  '&oauth_token=' + userAccessToken;

  https.get(queryPath, function (res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function(){
      deferred.resolve(JSON.parse(data));
    })
  }).on('error', function(err) {
    console.log(err);
    deferred.reject();
  });
  return deferred.promise;
};

utils.processFoursquareCheckinHistory = function (foursquareCheckinHistoryBucket) {
  var allCheckins = [];
  for(var i = 0; i < foursquareCheckinHistoryBucket.length; i++) {
    allCheckins.push(foursquareCheckinHistoryBucket[i].response.checkins.items);
  }
  console.log(JSON.stringify(allCheckins));
}

module.exports = utils;
