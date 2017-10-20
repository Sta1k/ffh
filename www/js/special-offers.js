var storesPicker = document.getElementById('stores');
var offersContentDiv = document.getElementById('offersContent');
var deviceID = null;
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    deviceID = device.uuid;
    initialize();
}

function initialize() {
    getStoresDescription();
    //------------------------------------------------------- Get local store and prepare back button -----------------------------------------------------------------------------------------
    var xhr = new XMLHttpRequest();
    xhr.open( "GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=get-local-store&deviceID=" + deviceID );
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        if( apiResponse.local_store ) {
            var localStoreName = "";
            for( var i = 0; i < storesPicker.options.length; i++ ) {
                if( storesPicker.options[i].value === apiResponse.local_store ) {
                    storesPicker.options.selectedIndex = i;
                    localStoreName = storesPicker.options[i].value;
                }
            }
            getStoreOffers( apiResponse.local_store );
            var backLinkDiv = document.getElementById('backTolocalStore');
            backLinkDiv.innerHTML = '<button onclick="getStoreOffers(\'' + apiResponse.local_store + '\')">' + localStoreName + '</button>';
        } else {
            getStoreOffers();
        }
    };
    xhr.send();
    //------------------------------------------------------------------------------------------------------------------------------------------------
}

/** Get all stores description from DB and fill storesPicker. */
function getStoresDescription() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=stores");
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        apiResponse.forEach( function( s ) {
            var newStore = document.createElement("option");
            newStore.text = s.name;
            newStore.value = s.name;
            storesPicker.options.add( newStore, s.name );
        });
    };
    xhr.send();
}

/** Load store offers from DB and display them in offersContent div. */
function getStoreOffers( store ) {
    offersContentDiv.innerHTML = "";

    //Just when the method is called via storePicker.
    if( !store ) {
        var selectedStore = storesPicker.options[storesPicker.selectedIndex].value;
        if( selectedStore != null ) {
            store = selectedStore;
        }
    }
    var url = "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=offers";
    if( store != 0 ) {
        url = "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=offers&store=" + store;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        var offersInformation = "";
        apiResponse.forEach( function( o ) {
            offersInformation += getOfferHtml( o );
        });
        offersContentDiv.innerHTML = offersContentDiv.innerHTML + offersInformation;
    };
    xhr.send();
}

function getOfferHtml( offer ) {
    var offerHtml = "";
    var image = "img/logo.png";
    if( offer.image ) {
        image = offer.image;
    }
    offerHtml += '<div class="offers-container">';
    offerHtml += '<img src="' + image + '"/>';
    offerHtml += '<div class="offers-content-container"><h3>' + offer.title + '</h3>';
    offerHtml += '<span class="offer-date"><strong>' + offer.start + ' - ' + offer.end + '</strong></span>';
    offerHtml += '<span class="offer-disclaimer">' + offer.disclaimer + '</span></div>';
    offerHtml += '</div>';

    return offerHtml;
}