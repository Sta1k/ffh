document.addEventListener("deviceready", onDeviceReady, false);
var cardImageDiv = document.getElementById('rewards-card');
var deviceID = null;
function onDeviceReady() {
    //Check if device already has an associated card.
    deviceID = device.uuid;
    initialize();
}

function initialize() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=get-barcode&deviceID=" + deviceID);
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        if( apiResponse.found ) {
            updateCardImageDiv( apiResponse.barcode_string );
        } else {
            updateCardImageDiv( null );
        }
    };
    xhr.send();
}

function updateCardImageDiv( barcode ) {
    var img = 'img/barcode.png';
    var card = "";

    if( barcode ) {
        card = '<svg id="barcode"></svg>';
    } else {
        card = '<img src="' + img + '" >';
    }
    cardImageDiv.innerHTML = card;

    //Since the div must be created first, we generate the graphic at the end.
    if( barcode ) {
        //Generate graphic for barcode
        JsBarcode( "#barcode", barcode );
    }
}

function changeCard() {
    //Open scanner
    cordova.plugins.barcodeScanner.scan(
        function (result) {
            //Show barcode image.
            updateCardImageDiv( result.text );
            //Save barcode string into DB.
            saveRewardCard( result.text );
        },
        function (error) {
            alert("Scanning failed: " + error);
        },
        {
            preferFrontCamera : false, // iOS and Android
            showFlipCameraButton : true, // iOS and Android
            showTorchButton : true, // iOS and Android
            torchOn: true, // Android, launch with the torch switched on (if available)
            prompt : "Place a barcode inside the scan area", // Android
            resultDisplayDuration: 500, // Android, display scanned text for X ms. 0 suppresses it entirely, default 1500
            formats : "QR_CODE,PDF_417", // default: all but PDF_417 and RSS_EXPANDED
            orientation : "landscape", // Android only (portrait|landscape), default unset so it rotates with the device
            disableAnimations : true, // iOS
            disableSuccessBeep: false // iOS
        }
    );
}

function saveRewardCard( barCodeString ) {
    var xhr = new XMLHttpRequest();
    xhr.open( "GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=save-barcode&barCodeString=" + barCodeString + "&deviceID=" + deviceID );
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        if( apiResponse ) {
            alert("Homegrown Rewards saved succesfully!");
        } else {
            alert("An error occurred while tempting to save your Homegrown Rewards. Please try again.");
        }
    };
    xhr.send();
}
