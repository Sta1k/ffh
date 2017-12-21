document.addEventListener("deviceready", onDeviceReady, false);
var deviceID = null;
function onDeviceReady() {
    initialize();
}

var map;
var service;
var markers = [];
var storesPicker = document.getElementById('stores');
var infowindow = new google.maps.InfoWindow();
var currentLocation;
function initialize() {
    //Get all stores coordinates from server DB.
    getStoresCoordinates();
}

function initializeMap(places) {
    var center;
    navigator.geolocation.getCurrentPosition(function (position) {
        currentLocation = {
            lat: 41.850,// position.coords.latitude,
            lng: -87.650// position.coords.longitude
        };
        center = new google.maps.LatLng(currentLocation.lat, currentLocation.lng);

        map = new google.maps.Map(document.getElementById('map'), {
            center: center,
            zoom: 5
        });

        service = new google.maps.places.PlacesService(map);

        places.forEach(function (p) {
            var placeLocation = new google.maps.LatLng(p.latitude, p.longitude);
            var marker = new google.maps.Marker({
                map: map,
                position: placeLocation
            });

            var markerObj = {
                'marker': marker,
                'zip': p.zip
            };
            markers.push(markerObj);

            google.maps.event.addListener(marker, 'click', function () {
                getPlaceDetails(p.place_id, this);
            });
        });
    }, function () {
        alert('Could not locate current location');
    },
        { enableHighAccuracy: true }
    );


}

function callbackNearby(results, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        if (results) {
            results.forEach(function (p) {
                var placeLocation = new google.maps.LatLng(p.geometry.location.lat(), p.geometry.location.lng());
                var marker = new google.maps.Marker({
                    map: map,
                    position: placeLocation
                });
                // initMap(placeLocation)
                var markerObj = {
                    'marker': marker
                };
                markers.push(markerObj);

                google.maps.event.addListener(marker, 'click', function () {
                    getPlaceDetails(p.place_id, this);
                });
            });
        }
    }
}

function getPlaceDetails(placeId, objMarker) {
    service.getDetails({
        placeId: placeId
    }, function (extendedPlace, statusIn) {
        if (statusIn === google.maps.places.PlacesServiceStatus.OK) {
            var dest = { lat: extendedPlace.geometry.location.lat(), lng: extendedPlace.geometry.location.lng() }
            console.log('coordinates', dest)
            var photos = extendedPlace.photos;
            var photo = null;
            if (photos) {
                photo = photos[0].getUrl({ 'maxWidth': 300, 'maxHeight': 300 });
            }
            if (photo != null) {
                var address = "";
                var addressComp = extendedPlace.adr_address;
                var address = addressComp.replace(', <span class="locality"', '<br> <span class="locality"');

                // TODO: NEED TO FIGURE OUT HOW TO MAKE IT SO THAT IT SHOWS COMPLETE STORE INFORMATION WHEN CLICKING ON POPUP's MORE INFORMATION LINK OR PHOTO
                infowindow.setContent('<div class="store-location-popup"><div class="popup-image"><img src="' + photo + '" alt="Family Farm & Home"></div><div class="popup-content"><p class="popup-title">' + extendedPlace.name + '</p><p class="popup-address">' + address + '</p><p><a onclick="showStoreInformation(\'' + extendedPlace.place_id + '\')">More Information</a></p></div></div><div class="destination"><button onclick="initMap(' + dest.lat+','+dest.lng + ')">Set destination</button></div>'
                );
                console.log(extendedPlace)
            } else {
                console.log(extendedPlace)
                infowindow.setContent('<div><strong>' + extendedPlace.name + '</strong><br>' +
                    extendedPlace.adr_address + '</div><div class="destination"><button onclick="initMap(' + dest.lat+','+dest.lng + ')">Set destination</button></div>'//+'<button></button>'
                );
            }

            infowindow.open(map, objMarker)
        } else {
            console.log(statusIn);
        }

        console.log(extendedPlace);
    });
}

function searchByZipCode() {
    var zip = document.getElementById('zip-input');
    if (zip.value) {
        var storeFound = false;
        clearMarkers();

        markers.forEach(function (m) {
            if (zip.value == m.zip) {
                storeFound = true;
                //Enable only the matching markers
                m.marker.setMap(map);
                //Center the map to the found marker
                var latLng = m.marker.getPosition();
                map.setCenter(latLng);
            }
        });

        if (!storeFound) {
            alert('No store found at that location!');
        }
    }
}

function searchByNearby() {
    navigator.geolocation.getCurrentPosition(function (position) {
        currentLocation = {
            lat: 41.850,// position.coords.latitude,
            lng: -87.650// position.coords.longitude
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
        // initMap(currentLocation,{lat: 39.79, lng: -86.14})
        service.nearbySearch(request, callbackNearby);
    }, function () {
        alert('Could not locate current location');
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
function initMap(lat, lng) {
    console.log('start find destination')
    finishPoint = { 
        lat: lat,
        lng: lng 
    }
    navigator.geolocation.getCurrentPosition(function (position) {
        var currentLocation = {
            lat: 41.850,// position.coords.latitude,
            lng: -87.650// position.coords.longitude
        };
        clearMarkers();
        //Center map to current location.
        map.setCenter(currentLocation);
        //Add marker to current location.
        new google.maps.Marker({
            map: map,
            position: currentLocation

        });

    }, function () {
        alert('Could not locate current location');
    },
        { enableHighAccuracy: true }
    );

    var directionsDisplay = new google.maps.DirectionsRenderer({
        map: map
    });

    // Set destination, origin and travel mode.
    var request = {
        destination: finishPoint,
        origin: currentLocation,
        travelMode: 'DRIVING'
    };

    // Pass the directions request to the directions service.
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function (response, status) {
        if (status == 'OK') {
            directionsDisplay.set('directions', null);
            // Display the route on the map.
            directionsDisplay.setDirections(response);
        }
    });
}

function showStoreInformation(place_id) {
    clearMarkers();
    var storeInformationDiv = document.getElementById('storeInformation');
    storeInformationDiv.innerHTML = "";
    var storeInformation = '<a href="/stores-search.html" class="chunk yellow-button-styles center-button">Go Back</a><';
    if (place_id == '' || place_id == null) {
        var selectedStorePlaceId = storesPicker.options[storesPicker.selectedIndex].value;
    } else {
        var selectedStorePlaceId = place_id;
        var selectStores = document.getElementById('stores');

        for (var i, j = 0; i = selectStores.options[j]; j++) {
            if (i.value == place_id) {
                selectStores.selectedIndex = j;
                break;
            }
        }
    }

    var storeName = storesPicker.options[storesPicker.selectedIndex].text;

    service.getDetails({
        placeId: selectedStorePlaceId
    }, function (extendedPlace, statusIn) {
        if (statusIn === google.maps.places.PlacesServiceStatus.OK) {
            $('#mapBar, #map').hide();
            var photos = extendedPlace.photos;
            var photo = null;
            if (photos) {
                photo = photos[0].getUrl({ 'maxWidth': 300, 'maxHeight': 300 });
                storeInformation += '<div class="store-information-image-container"><img src="' + photo + '" alt="Family Farm & Home" style="width: 100%; margin-bottom: 20px;"></div>';
            }
            extendedPlace.address_components.forEach(function (a) {
                a.types.forEach(function (t) {
                    if (t == 'locality') {
                        storeInformation += '<h4 class="chunk ffh-yellow">' + a.long_name + '</h4>';
                    }
                });
            });

            //          TODO: create link between address and local device maps app to enable directions feature.
            //            <a href="https://maps.google.com/?q=1391 Cinema Way, Benton Harbor, MI 49022, USA">open map</a>

            // TODO: NEED TO ADD PHONE NUMBER CLICKABILITY ---v

            storeInformation += '<a href="tel:' + extendedPlace.formatted_phone_number.replace(/[^0-9]/ig, '') + '" class="yellow-button-styles chunk center-button">' + extendedPlace.formatted_phone_number + '</a>';
            storeInformation += '<p class="chunk ffh-loc-address">' + extendedPlace.formatted_address + '</p>';
            storeInformation += '<div class="white-box">';
            storeInformation += '<ul class="store-hours">';
            extendedPlace.opening_hours.weekday_text.forEach(function (h) {
                console.log(h);
                storeInformation += '<li>' + h + '</li>';
            });
            storeInformation += '</ul>';

            //Check if local store is already setup
            var deviceID = device.uuid;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=get-local-store&deviceID=" + deviceID);
            xhr.onload = function () {
                var apiResponse = JSON.parse(xhr.responseText);

                if (apiResponse.local_store == storeName) {
                    storeInformation += '<p class="chunk" style=" text-align: center; color: #fff; padding: 20px;">This is currently set as your Local Store</p>';
                } else {
                    storeInformation += '<a href="javascript:void();" onclick="setLocalStore()" class="set-as-local-store-button">Set as Local Store</a>';
                }
                //Update store information div.
                storeInformationDiv.innerHTML = storeInformationDiv.innerHTML + storeInformation;
            };
            xhr.send();

            storeInformation += '</div>';
        }
    });
}

function setLocalStore() {
    var store = storesPicker.options[storesPicker.selectedIndex].text;

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=set-local-store&deviceID=" + deviceID + "&local_store=" + store);
    xhr.onload = function () {
        var apiResponse = JSON.parse(xhr.responseText);
        console.log(apiResponse);
        if (apiResponse.success) {
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
    xhr.onload = function () {
        var apiResponse = JSON.parse(xhr.responseText);
        apiResponse.forEach(function (r) {
            if (r.place_id) {
                places.push(r);
                //Fill stores dropdown
                if (storesPicker.options.length <= apiResponse.length) {
                    var newStore = document.createElement("option");
                    newStore.text = r.name;
                    newStore.value = r.place_id;
                    storesPicker.options.add(newStore, r.name);
                }
            }
        });
        initializeMap(places);
    };
    xhr.send();
}