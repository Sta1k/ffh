var storesPicker = document.getElementById('stores');
document.addEventListener("deviceready", onDeviceReady, false);
var deviceID = null;
function onDeviceReady() {
    deviceID = device.uuid;
    initialize();
}

function initialize() {
    console.log('Device: ',device.platform);

    // Add to index.js or the first page that loads with your app.
    // For Intel XDK and please add this to your app.js.

    // document.addEventListener('deviceready', function () {
    //     // Enable to debug issues.
    //     // window.plugins.OneSignal.setLogLevel({logLevel: 4, visualLevel: 4});
      
    //     var notificationOpenedCallback = function(jsonData) {
    //         console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
    //     };

    //     window.plugins.OneSignal
    //         .startInit("1048badd-c94b-46da-8bbf-1b643e977808")
    //         .handleNotificationOpened(notificationOpenedCallback)
    //         .endInit();
      
    //     // Call syncHashedEmail anywhere in your app if you have the user's email.
    //     // This improves the effectiveness of OneSignal's "best-time" notification scheduling feature.
    //     // window.plugins.OneSignal.syncHashedEmail(userEmail);
    // }, false);
    var iosSettings = {};
    iosSettings["kOSSettingsKeyAutoPrompt"] = true;
    iosSettings["kOSSettingsKeyInAppLaunchURL"] = false;
    window.plugins.OneSignal
          .startInit("a57b93b0-3c10-4eae-9edf-bf9d06b32a9c")
          .handleNotificationReceived(function(jsonData) {
            // alert("Notification received: \n" + JSON.stringify(jsonData));
            console.log('Did I receive a notification: ' + JSON.stringify(jsonData));
          })
          .handleNotificationOpened(function(jsonData) {
            // alert("Notification opened: \n" + JSON.stringify(jsonData));
            console.log('didOpenRemoteNotificationCallBack: ' + JSON.stringify(jsonData));
          })
          .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.InAppAlert)
          .iOSSettings(iosSettings)
          .endInit();
    //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    getStoresDescription()
    //Check if local store is already setup
    var deviceID = device.uuid;
    var xhr = new XMLHttpRequest();
    xhr.open( "GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=get-local-store&deviceID=" + deviceID );
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        if( apiResponse.local_store ) {
            for( var i = 0; i < storesPicker.options.length; i++ ) {
                if( storesPicker.options[i].value === apiResponse.local_store ) {
                    storesPicker.options.selectedIndex = i;
                    var divMessage = document.getElementById('localStoreMesage');
                    divMessage.innerHTML = "Your actual local store is:";
                }
            }
        }
    };
    xhr.send();
    //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
}

function setLocalStore() {
    var store = storesPicker.options[storesPicker.selectedIndex].value;
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