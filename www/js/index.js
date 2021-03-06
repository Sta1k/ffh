var storesPicker = document.getElementById('stores');
document.addEventListener("deviceready", onDeviceReady, false);
var deviceID = null;
function onDeviceReady() {
    deviceID = device.uuid;
    initialize();
}

function initialize() {
    getStoresDescription()
    console.log('Device: ', device.platform);
    var iosSettings = {};
    iosSettings["kOSSettingsKeyAutoPrompt"] = true;
    iosSettings["kOSSettingsKeyInAppLaunchURL"] = false;
    window.plugins.OneSignal
        .startInit("a57b93b0-3c10-4eae-9edf-bf9d06b32a9c")
        .handleNotificationReceived(function (jsonData) {
         
            console.log('Received notification: ', jsonData.notification);
        })
        .handleNotificationOpened(function (jsonData) {
           
        // window.location.href=jsonData.notification.payload.additionalData.type+'s.html'
            // console.log('Opened notification: ',  window.location.href);
        })
        // .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.InAppAlert)
        .iOSSettings(iosSettings)
        .endInit();
    //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    //Check if local store is already setup
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=get-local-store&deviceID=" + deviceID);
    xhr.onload = function () {
        var apiResponse = JSON.parse(xhr.responseText);
        if (apiResponse.local_store) {
            for (var i = 0; i < storesPicker.options.length; i++) {
                if (storesPicker.options[i].value === apiResponse.local_store) {
                    storesPicker.options.selectedIndex = i;
                    // var divMessage = document.getElementById('localStoreMesage');
                    // divMessage.innerHTML = "Your actual local store is:";
                }
            }
        }
    };
    xhr.send();
    //------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
}

function setLocalStore() {
    var store = storesPicker.options[storesPicker.selectedIndex].value;
    console.log(store.toLowerCase())
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=set-local-store&deviceID=" + deviceID + "&local_store=" + store);
    xhr.onload = function () {
        var apiResponse = JSON.parse(xhr.responseText);
        console.log(apiResponse);
        if (apiResponse.success) {
            window.plugins.OneSignal.sendTags({loc: store.toLowerCase(),default:'all stores'});
            alertMessage("Local Store has been set successfully!");
        }
    };
    xhr.send();
}

function getStoresDescription() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=stores");
    xhr.onload = function () {
        var apiResponse = JSON.parse(xhr.responseText);
        apiResponse.forEach(function (s) {
            var newStore = document.createElement("option");
            newStore.text = s.name;
            newStore.value = s.name;
            storesPicker.options.add(newStore, s.name);
        });
    };
    xhr.send();
}
function alertDismissed() {
    // do something
}

var alertMessage = function (message) {
    return navigator.notification.alert(
        message,  // message
        alertDismissed,         // callback
        'Family Farm & Home',            // title
        'Ok'                  // buttonName
    )
};