(function(){

var MapController = function (Auth, UserRequests, MapFactory, $scope, $state, $stateParams, $rootScope){
      
  // On transition from a friends map to original user map,
  // only the data should change (and reload feed)
  $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
    if (toState.name === 'map' && fromState.name !== 'map'){
      MapFactory.markerQuadTree = $scope.handleUserCheckinData(UserRequests.allData.allCheckins);
      $state.go('map.feed');
    }
  });

  console.log(UserRequests.allData)

  $scope.data = {};
    
  Auth.checkLogin()
  .then(function(){

    L.mapbox.accessToken = 'pk.eyJ1Ijoid2FkZGxldXNlciIsImEiOiItQWlwaU5JIn0.mTIpotbZXv5KVgP4pkcYrA';

    $scope.configuredMap = L.mapbox.map('map', 'injeyeo2.i9nn801b', {
      attributionControl: false,
      zoomControl: false,
      worldCopyJump: true,
      minZoom: 2,
      // maxBounds: [[80,200],[-80,-200]],
      bounceAtZoomLimits: false
    }).setView([20.00, 0.00], 2);

    var shadedCountries = L.mapbox.featureLayer().addTo($scope.configuredMap);

    var aggregatedMarkers = new L.MarkerClusterGroup({showCoverageOnHover: false, disableClusteringAtZoom: 12, maxClusterRadius: 60});
    
    var makeMarker = function (footprint) {
      var place = footprint.place;
      var checkin = footprint.checkin;

      var placeName = place.name;
      var latLng = [place.lat, place.lng];
      var img;
      var caption;

      if (checkin.photoSmall !== 'null') {
        img = checkin.photoSmall;
      }

      if (checkin.caption !== 'null') {
        caption = checkin.caption;
      }

      var marker = L.marker(latLng, {
        icon: L.mapbox.marker.icon({
          'marker-color': '1087bf',
          'marker-size': 'large',
          'marker-symbol': 'circle-stroked'
        }),
        title: placeName
      });

      if (img && caption) {
        marker.bindPopup('<h3>' + placeName + '</h3><h4>' + caption + '</h4><img src="' + img + '"/>');
      } else if (img) {
        marker.bindPopup('<h3>' + placeName + '</h3><img src="' + img + '"/>');
      } else if (caption) {
        marker.bindPopup('<h3>' + placeName + '</h3><h4>' + caption + '</h4>');
      } else {
        marker.bindPopup('<h3>' + placeName + '</h3>');
      }

      aggregatedMarkers.addLayer(marker);
    };

    $rootScope.handleUserCheckinData = function (allFootprints) {
      
      aggregatedMarkers.clearLayers();

      var footprintQuadtree;

      _.each(allFootprints, function (footprint) {
        var latLng = [footprint.place.lat, footprint.place.lng];

        footprintQuadtree ? footprintQuadtree.insert(footprint) : footprintQuadtree = new MapFactory.QuadTree(footprint);

        makeMarker(footprint);
      });

      return footprintQuadtree;
    };

    $scope.configuredMap.addLayer(aggregatedMarkers);
    // $scope.countriesBeen = [];

   //  var findCountriesBeen = function (allUserCheckins) {
   //    for(var i = 0; i < allUserCheckins.data.length; i++) {
   //      var place = allUserCheckins.data[i].place;
   //      var country = 
   //      if($scope.countriesBeen.indexOf(country) === -1) {
   //        $scope.countriesBeen.push(country);
   //      }
   //      return $scope.countriesBeen;
   //    }
   //  };

    // var addToShadedCountries = function () {
     //  for(var j = 0; j < $scope.countriesBeen.length; j++) {
     //    for(var i = 0; i < globalCountryData.features.length; i++){
     //    var boundaries = globalCountryData.features[i].geometry.coordinates;
      //     if(globalCountryData.features[i].properties['NAME'] == $scope.countriesBeen[j]) {
      //       if(globalCountryData.features[i].geometry.type == 'MultiPolygon') {
    //           console.log('hi');
      //         L.multiPolygon(boundaries, {stroke: false, opacity: 0.7, weight: 10, color:'#000', fillColor: '#000', fillOpacity: 0.7}).addTo(shadedCountries);
      //       }
      //       else {
      //         L.polygon(boundaries, {stroke: false, fillColor: '#000'}).addTo(shadedCountries);
      //       }
      //     }
     //    }
     //  }
    // }
    // addToShadedCountries();

    if(UserRequests.allData) {
      MapFactory.markerQuadTree = $rootScope.handleUserCheckinData(UserRequests.allData.allCheckins);
      $state.go('map.feed');
    } else {
      $state.go('frontpage');
    }
  });
}

MapController.$inject = ['Auth', 'UserRequests', 'MapFactory', '$scope', '$state', '$stateParams', '$rootScope'];

//Start creating Angular module
angular.module('waddle.map', [])
  .controller('MapController', MapController);

})();
