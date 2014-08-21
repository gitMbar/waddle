var https = require('https');
var qs = require('querystring');
var User = require('../api/users/userModel.js');
var foursquareUtils = require('./foursquareUtils.js');
var _ = require('lodash');

var Q = require('q');

var utils = {};

utils.handleUpdate = function (update) {
  var deferred = Q.defer();

  var timestamp = update.time - 1;
  
  var igUserID = update.object_id;
  var user;

  User.findByInstagramID(igUserID)
  .then(function (userNode) {
    user = userNode;
    return utils.makeRequestForMedia(user, timestamp);
  })
  .then(function (mediaResp) {
    var media = mediaResp.data;
    var postsWithLocation = [];
    _.each(media, function (photo) {
      if (photo.location && photo.location.name) {
        postsWithLocation.push(utils.parseIGPost(photo, user));
      }
    });
    return Q.all(postsWithLocation);
  })
  .then(function (data) {
    deferred.resolve(data);
  })
  .catch(function (e) {
    deferred.reject(e);
  })

  return deferred.promise;
};

utils.makeRequestForMedia = function (user, timestamp) {
  var deferred = Q.defer();

  var igUserID = user.getProperty('instagramID');
  var accessToken = user.getProperty('igToken');

  var query = {
    access_token: accessToken,
    min_timestamp: timestamp
  };

  var queryPath = 'https://api.instagram.com/v1/users/'+ igUserID + '/media/recent?' + qs.stringify(query);

  https.get(queryPath, function (res) {
    var data = '';
    res.on('data', function(chunk) {
      data += chunk;
    });

    res.on('end', function () {
      deferred.resolve(JSON.parse(data));
    })

  }).on('error', function (e) {
    deferred.reject(e);
  });

  return deferred.promise;

  // HANDLE PAGINATION
  // if (postArr.pagination && postArr.pagination.next_url){
  //     console.log("MORE DATA!!")
  //   }
};

utils.exchangeIGUserCodeForToken = function (igCode) {
  var deferred = Q.defer();

  var query = {
    client_id: process.env.WADDLE_INSTAGRAM_CLIENT_ID,
    client_secret: process.env.WADDLE_INSTAGRAM_CLIENT_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: 'http://waddle.herokuapp.com/instagramredirect',
    code: igCode
  };

  var queryPath = qs.stringify(query);
  
  var options = {
    hostname: 'api.instagram.com',
    path: '/oauth/access_token',
    method: 'POST'
  };

  var req = https.request(options, function(res) {
    var data = '';
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      deferred.resolve(JSON.parse(data));
    })
  });

  req.on('error', function (e) {
    deferred.reject(e);
  });

  req.write(queryPath);
  req.end();

  return deferred.promise;
};

utils.parseIGPost = function (post, user) {
  //data[i].location.latitude
  //.data.location.longitude
  //.data.location.name
  //.data.caption.text
  //.data.createdAt
  //.data.[picturessmalllarge]
  //.data.images.thumbnail
  //.data.images.standard_resolution
  //.data.id
  var deferred = Q.defer();;

  var place = {
    'checkinID': post.id,
    'name': post.location.name,
    'lat': post.location.latitude,
    'lng': post.location.longitude,
    'checkinTime': new Date(parseInt(post.created_time)),
    'likes': 'null',
    'photoSmall': 'null',
    'photoLarge': 'null',
    'caption': 'null',
    'foursquareID': 'null',
    'country': 'null',
    'category': 'null',
    'source': 'facebook'
  };

  if (post.likes) {
    place.likes = post.likes.count;
  }

  if(post.caption) {
    place.caption = post.caption.text;
  }

  if (post.images) {
    if (post.images.thumbnail){
      place.photoSmall = post.images.thumbnail.url;
    }
    if (post.images.standard_resolution){
      place.photoLarge = post.images.standard_resolution.url;
    }
  }

  var latlng = place.lat.toString() + ',' + place.lng.toString();
    
  foursquareUtils.generateFoursquarePlaceID(user, place.name, latlng)
  .then(function (foursquareVenueID) {
    place.foursquareID = foursquareVenueID;
    deferred.resolve({
      place: place,
      user: user
    });
  })
  .catch(function (err) {
    deferred.reject(err);
  });

  return deferred.promise;
};

module.exports = utils;
