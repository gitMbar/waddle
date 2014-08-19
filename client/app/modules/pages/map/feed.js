angular.module('waddle.feed', [])

  .controller('FeedController', function ($rootScope, $scope, UserRequests, MapFactory, $state) {

    $scope.allUserCheckinsFootprints = UserRequests.allData.data.allCheckins;
    $scope.selectedFootprint = null;

    console.log('InBounds: ', $scope.inBounds);
    console.log('AllUserCheckins: ', $scope.allUserCheckinsFootprints);


    var filterFeedByBounds = function () {
      var bounds = $scope.configuredMap.getBounds();
      var markers = MapFactory.markerQuadTree.markersInBounds(bounds._southWest, bounds._northEast);
      $scope.inBounds = {
        get: function(index, count, success) {
            success(markers);
        }
      };
      console.log('filterfeed')
      console.log( $scope.inBounds );
      console.log( $state.current );
    };

    // When the user pans the map, we set the list of checkins visible to a scope variable for rendering in the feed
    $scope.configuredMap.on('move', function() {
      filterFeedByBounds();
    });

    filterFeedByBounds();

    $scope.addPropsToCheckin = function (checkinID){
      console.log(checkinID);

      var propsData = {
        clickerID: window.sessionStorage.userFbID,
        checkinID: checkinID
      }

      UserRequests.giveProps(propsData)
      .then(function (data){
        console.log(data);
      });
    }

    $scope.addCheckinToBucketlist = function (checkinID){
      var data = {
        facebookID: window.sessionStorage.userFbID,
        checkinID: checkinID
      }
       UserRequests.addToBucketList(data)
    }

    $scope.getFootprint = function (footprint) {
      $scope.selectedFootprint = footprint;
      UserRequests.getFootprintInteractions(footprint.checkin.checkinID)
      .then(function (data){
        UserRequests.currentFootprint = data.data
        console.log(UserRequests.currentFootprint)
        $scope.data.footprint.propNumber = data.data.props;
        $scope.data.footprint.propGivers = data.data.propGivers;
        $scope.data.footprint.comments = data.data.comments;
      })
    }
  })

.directive( 'customSubmit' , function(UserRequests)
{
    return {
        restrict: 'A',
        link: function( scope , element , attributes )
        {
            var $element = angular.element(element);
            
            // Add novalidate to the form element.
            attributes.$set( 'novalidate' , 'novalidate' );
            
            $element.bind( 'submit' , function( e ) {
                e.preventDefault();
                
                // Remove the class pristine from all form elements.
                $element.find( '.ng-pristine' ).removeClass( 'ng-pristine' );
                
                // Get the form object.
                var form = scope[ attributes.name ];
                
                // Set all the fields to dirty and apply the changes on the scope so that
                // validation errors are shown on submit only.
                angular.forEach( form , function( formElement , fieldName ) {
                    // If the fieldname starts with a '$' sign, it means it's an Angular
                    // property or function. Skip those items.
                    if ( fieldName[0] === '$' ) return;
                    
                    formElement.$pristine = false;
                    formElement.$dirty = true;
                });
                
                // Do not continue if the form is invalid.
                if ( form.$invalid ) {
                    // Focus on the first field that is invalid.
                    $element.find( '.ng-invalid' ).first().focus();
                    
                    return false;
                }
                
                console.log(attributes.customSubmit)
                // From this point and below, we can assume that the form is valid.
                scope.$eval( attributes.customSubmit );

                var commentData = {
                  clickerID: window.sessionStorage.userFbID,
                  checkinID: $element.context.dataset['customSubmit'],
                  text: $element[0][0].value
                }

                UserRequests.addComment(commentData)
                .then(function (data){
                  $element[0][0].value = ""
                })
                console.log(commentData)
                
                scope.$apply();
            });
        }
    };
});
