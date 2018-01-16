var app = {
    // Application Constructor
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function () {
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);

        // OneSignal Initialization
        // Enable to debug issues.
        // window.plugins.OneSignal.setLogLevel({logLevel: 4, visualLevel: 4});

        // Set your iOS Settings
        var iosSettings = {};
        iosSettings["kOSSettingsKeyAutoPrompt"] = true;
        iosSettings["kOSSettingsKeyInAppLaunchURL"] = false;

        window.plugins.OneSignal
            //.startInit("b2f7f966-d8cc-11e4-bed1-df8f05be55ba")
            .startInit("a57b93b0-3c10-4eae-9edf-bf9d06b32a9c")//my onesignal service
            .handleNotificationReceived(function (jsonData) {
                // alert("Notification received: \n" + JSON.stringify(jsonData));
                console.log('Did I receive a notification: ' + JSON.stringify(jsonData));
            })
            .handleNotificationOpened(function (jsonData) {
                // alert("Notification opened: \n" + JSON.stringify(jsonData));
                console.log('didOpenRemoteNotificationCallBack: ' + JSON.stringify(jsonData));
            })
            .inFocusDisplaying(window.plugins.OneSignal.OSInFocusDisplayOption.InAppAlert)
            .iOSSettings(iosSettings)
            .endInit();

        //Call syncHashedEmail anywhere in your app if you have the user's email.
        //This improves the effectiveness of OneSignal's "best-time" notification scheduling feature.
        //window.plugins.OneSignal.syncHashedEmail(userEmail);
    }

};
var monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
var app_id = 'a57b93b0-3c10-4eae-9edf-bf9d06b32a9c';
function getNotifications() {
    // var store = storesPicker.options[storesPicker.selectedIndex].value;
    var xhr = new XMLHttpRequest();

    xhr.open("GET", "https://onesignal.com/api/v1/notifications?app_id=" + app_id);
    xhr.setRequestHeader('Authorization', 'Basic NDU1NTZiYzYtMDlhOC00ZGE5LThiZmYtODMyYzQwOGJhZDhj');
    xhr.onload = function () {

        var apiResponse = JSON.parse(xhr.responseText);
        var notifications = apiResponse.notifications;
        console.log(notifications);
        notifications.forEach(function (el) {
            var table = document.getElementById('notificationsTable'),
                template = document.getElementById('template');
                var dup_template = template.cloneNode(true),
                t = dup_template.getElementsByClassName('title')[0],
                title = document.createTextNode(el.headings.en),
                message = document.createTextNode(el.contents.en),
                convert = new Date(Number(el.queued_at + '000')).toString();

            convert = monthNames[new Date(Number(el.queued_at + '000')).getMonth()]+
                ' '+convert.split(' ').slice(2, 4).join(' ');
            date = document.createTextNode(convert);
            m = dup_template.getElementsByClassName('message')[0];
            d = dup_template.getElementsByClassName('date')[0];
            t.appendChild(title);
            m.appendChild(message);
            d.appendChild(date);
            table.appendChild(dup_template);
        });
    };
    xhr.send();
}
function registerForPushNotification() {
    console.log("Register button pressed");
    window.plugins.OneSignal.registerForPushNotifications();
    // Only works if user previously subscribed and you used setSubscription(false) below
    window.plugins.OneSignal.setSubscription(true);
}

function getIds() {
    window.plugins.OneSignal.getIds(function (ids) {
        document.getElementById("OneSignalUserId").innerHTML = "UserId: " + ids.userId;
        document.getElementById("OneSignalPushToken").innerHTML = "PushToken: " + ids.pushToken;
        console.log('getIds: ' + JSON.stringify(ids));
        // alert("userId = " + ids.userId + "\npushToken = " + ids.pushToken);
    });
}

function getTags() {
    window.plugins.OneSignal.getTags(function (tags) {
        // alert('Tags Received: ' + JSON.stringify(tags));
    });
}

function deleteTags() {
    window.plugins.OneSignal.deleteTags(["PhoneGapKey", "key2"]);
    // alert("Tags deleted");
}

function promptLocation() {
    window.plugins.OneSignal.promptLocation();
    // iOS - add CoreLocation.framework and add to plist: NSLocationUsageDescription and NSLocationWhenInUseUsageDescription
    // android - add one of the following Android Permissions:
    // <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    // <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
}

function syncHashedEmail() {
    window.plugins.OneSignal.syncHashedEmail("example@google.com");
    // alert("Email synced");
}

function postNotification() {
    window.plugins.OneSignal.getIds(function (ids) {
        var notificationObj = {
            contents: {en: "message body"},
            include_player_ids: [ids.userId]
        };
        window.plugins.OneSignal.postNotification(notificationObj,
            function (successResponse) {
                console.log("Notification Post Success:", successResponse);
            },
            function (failedResponse) {
                console.log("Notification Post Failed: ", failedResponse);
                // alert("Notification Post Failed:\n" + JSON.stringify(failedResponse));
            }
        );
    });
}

function setSubscription() {
    window.plugins.OneSignal.setSubscription(false);
}

app.initialize();
setTimeout(getNotifications(), 3000);
