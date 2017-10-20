document.addEventListener("deviceready", onDeviceReady, false);
var deviceID = null;
function onDeviceReady() {
    initialize();
}

var map;
var service;
var markers = [];
var storesPicker = document.getElementById('stores');

function initialize() {
    //Get all stores coordinates from server DB.
    getStoresCoordinates();
}

function initializeMap( places ) {
    var center = new google.maps.LatLng(42.076344, -86.426639);
    map = new google.maps.Map(document.getElementById('map'), {
        center: center,
        zoom: 11
    });

    service = new google.maps.places.PlacesService(map);

    places.forEach( function( p ) {
        var placeLocation = new google.maps.LatLng( p.latitude, p.longitude );
        var marker = new google.maps.Marker({
            map: map,
            position: placeLocation
        });

        var markerObj = {
            'marker': marker,
            'zip': p.zip
        };
        markers.push( markerObj );

        google.maps.event.addListener(marker, 'click', function() {
            getPlaceDetails( p.place_id, this );
        });
    });
}

function callbackNearby(results, status) {
    if ( status == google.maps.places.PlacesServiceStatus.OK ) {
        if( results ) {
            results.forEach( function( p ) {
                var placeLocation = new google.maps.LatLng( p.geometry.location.lat(), p.geometry.location.lng() );
                var marker = new google.maps.Marker({
                    map: map,
                    position: placeLocation
                });

                var markerObj = {
                    'marker': marker
                };
                markers.push( markerObj );

                google.maps.event.addListener(marker, 'click', function() {
                    getPlaceDetails( p.place_id, this );
                });
            });
        }
    }
}

function getPlaceDetails( placeId, objMarker ) {
    service.getDetails({
        placeId: placeId
    }, function( extendedPlace, statusIn ) {
        if ( statusIn === google.maps.places.PlacesServiceStatus.OK ) {
            var infowindow = new google.maps.InfoWindow();
            var photos = extendedPlace.photos;
            var photo = null;
            if (photos) {
                photo = photos[0].getUrl({'maxWidth': 300, 'maxHeight': 300});
            }
            if( photo != null ) {
                infowindow.setContent('<div><strong>' + extendedPlace.name + '</strong><br>' +
                    extendedPlace.formatted_address + '</div>' +
                    '<img src="'+photo+'" alt="Family Farm & Home" height="250" width="250">'
                );
            } else {
                infowindow.setContent('<div><strong>' + extendedPlace.name + '</strong><br>' +
                    extendedPlace.formatted_address + '</div>'
                );
            }

            infowindow.open(map, objMarker);
        } else {
            console.log( statusIn );
        }
    });
}

function searchByZipCode() {
    var zip = document.getElementById('zip-input');
    if( zip.value ) {
        var storeFound = false;
        clearMarkers();

        markers.forEach( function (m) {
            if( zip.value == m.zip ) {
                storeFound = true;
                //Enable only the matching markers
                m.marker.setMap(map);
                //Center the map to the found marker
                var latLng = m.marker.getPosition();
                map.setCenter(latLng);
            }
        });

        if( !storeFound ) {
            alert('No store found at that location!');
        }
    }
}

function searchByNearby() {
    navigator.geolocation.getCurrentPosition(function(position) {
        var currentLocation  = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        clearMarkers();
        var request = {
            location: currentLocation,
            //Limit for radius is 50km.
            radius: '50000',
            name: 'Family Farm & Home'
        };
        //Center map to current location.
        map.setCenter(currentLocation);
        //Add marker to current location.
        new google.maps.Marker({
            map: map,
            position: currentLocation
        });
        //Perform nearby search.
        service.nearbySearch(request, callbackNearby);
    }, function() {
        alert('Could not get device current location!');
    },
        { enableHighAccuracy: true }
    );
}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].marker.setMap(map);
    }
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    setMapOnAll(null);
}

function showStoreInformation() {
    clearMarkers();
    var storeInformationDiv = document.getElementById('storeInformation');
    storeInformationDiv.innerHTML = "";
    var storeInformation = "";
    var selectedStorePlaceId = storesPicker.options[storesPicker.selectedIndex].value;
    var storeName = storesPicker.options[storesPicker.selectedIndex].text;

    service.getDetails({
        placeId: selectedStorePlaceId
    }, function( extendedPlace, statusIn ) {
        if ( statusIn === google.maps.places.PlacesServiceStatus.OK ) {
            $('#mapBar, #map').hide();
            var photos = extendedPlace.photos;
            var photo = null;
            if ( photos ) {
                photo = photos[0].getUrl({'maxWidth': 300, 'maxHeight': 300});
                storeInformation += '<img src="' + photo + '" alt="Family Farm & Home" style="width: 100%; margin-bottom: 20px;">';
            }
            extendedPlace.address_components.forEach( function( a ) {
                a.types.forEach( function( t ) {
                    if( t == 'locality' ) {
                        storeInformation += '<h4>' + a.long_name + '</h4>';
                    }
                });
            });

//          TODO: create link between address and local device maps app to enable directions feature.
//            <a href="https://maps.google.com/?q=1391 Cinema Way, Benton Harbor, MI 49022, USA">open map</a>
            storeInformation += '<ul>';
            storeInformation += extendedPlace.formatted_address;
            extendedPlace.opening_hours.weekday_text.forEach( function( h ) {
                console.log(h);
                storeInformation += '<li>' + h + '</li>';
            });
            storeInformation += '</ul>';
            storeInformation += extendedPlace.formatted_phone_number;
            storeInformation += '<br>';

            //Check if local store is already setup
            var deviceID = device.uuid;
            var xhr = new XMLHttpRequest();
            xhr.open( "GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=get-local-store&deviceID=" + deviceID );
            xhr.onload = function() {
                var apiResponse = JSON.parse( xhr.responseText );

                if( apiResponse.local_store == storeName ) {
                    storeInformation += '<span>This is your Local Store</span>';
                } else {
                    storeInformation += '<a href="javascript:void();" onclick="setLocalStore()">Set as Local Store</a>';
                }
                //Update store information div.
                storeInformationDiv.innerHTML = storeInformationDiv.innerHTML + storeInformation;
            };
            xhr.send();
        }
    });
}

function setLocalStore() {
    var store = storesPicker.options[storesPicker.selectedIndex].text;

    var xhr = new XMLHttpRequest();
    xhr.open( "GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=set-local-store&deviceID=" + deviceID + "&local_store="+store);
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        console.log( apiResponse );
        if( apiResponse.success ) {
            alert("Local Store has been set successfully!");
        }
    };
    xhr.send();
}

/** Get all stores coordinates from DB.
 * @returns array
 */
function getStoresCoordinates() {
    var places = [];
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=stores");
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        apiResponse.forEach( function( r ) {
            if( r.place_id ) {
                places.push( r );
                //Fill stores dropdown
                if( storesPicker.options.length <= apiResponse.length ) {
                    var newStore = document.createElement("option");
                    newStore.text = r.name;
                    newStore.value = r.place_id;
                    storesPicker.options.add( newStore, r.name );
                }
            }
        });
        initializeMap( places );
    };
    xhr.send();
}