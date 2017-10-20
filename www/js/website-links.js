var deviceID = null;
document.addEventListener("deviceready", onDeviceReady, false);
function onDeviceReady() {
    deviceID = device.uuid;
}

//Open external URL
function openLink( l ) {
    if( device.platform === 'Android' ) {
        navigator.app.loadUrl( l, { openExternal:true } );
    } else {
        window.open( l, '_system' );
    }
}