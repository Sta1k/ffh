var storesPicker = document.getElementById('stores');
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
            getStoreCirculars( apiResponse.local_store );
            var backLinkDiv = document.getElementById('backTolocalStore');
            backLinkDiv.innerHTML = '<button onclick="getStoreCirculars(\'' + apiResponse.local_store + '\')">' + localStoreName + '</button>';
        } else {
            getStoreCirculars();
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

/** Load selected store circulars from DB and display them in circularContent div. */
function getStoreCirculars( store ) {
    var circularContentDiv = document.getElementById('circularContent');
    circularContentDiv.innerHTML = "";

    if( !store ) {
        var selectedStore = storesPicker.options[storesPicker.selectedIndex].value;
        if( selectedStore != null ) {
            store = selectedStore;
        }
    }
    var url = "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=circulars";
    if( store != 0 ) {
        url = "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=circulars&store=" + store;
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        var circularInformation = "";
         apiResponse.forEach( function( c ) {
             var file = "img/logo.png";
             if ( c.file ) {
                 file = c.file;
             }
             var url = "#";
             if ( c.url ) {
                 url = c.url;
             }
            circularInformation += '<div class="circulars-container"><img src="' + file + '"/><a class="btn-ffh" onclick="openLink(\'' + url + '\')">View the PDF online</a></div>';
         });

        circularContentDiv.innerHTML = circularContentDiv.innerHTML + circularInformation;
    };
    xhr.send();
}

//Open external URL
function openLink( l ) {
    if( device.platform === 'Android' ) {
        navigator.app.loadUrl( l, { openExternal:true } );
    } else {
        window.open( l, '_system' );
    }
}