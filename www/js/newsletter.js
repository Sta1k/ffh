document.addEventListener("deviceready", onDeviceReady, false);
var subscriptionForm = document.getElementById('subscriptionForm');
var storesPicker = document.getElementById('store_location');
var deviceID = null;
function onDeviceReady() {
    //Check for device newsletters
    deviceID = device.uuid;
    initialize();
}

function initialize() {
    //----------------------------------- Get stores from DB to fill stores dropdown --------------------------------
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=stores");
    xhr.onload = function() {
        var apiResponse = JSON.parse( xhr.responseText );
        apiResponse.forEach( function ( s ) {
            var newStore = document.createElement( "option" );
            newStore.text = s.name;
            newStore.value = s.name;
            storesPicker.options.add( newStore, s.name );
        });
    };
    xhr.send();
    //---------------------------------------------------------------------------------------------------------------

    //-------------------------------------------------- Get interests items from DB---------------------------------
    var xhr2 = new XMLHttpRequest();
    xhr2.open("GET", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=get-interests");
    xhr2.onload = function() {
        var apiResponse = JSON.parse( xhr2.responseText );
        var iAnimalsDiv = document.getElementById('interests-animals');
        var iHobbiesDiv = document.getElementById('interests-hobbies');
        var animalsInput = '';
        var hobbiesInput = '';
        apiResponse.forEach( function ( s ) {
            if( s.type === 'Animals' ) {
                animalsInput += '<p><input type="checkbox" name="animals" value="' + s.id + '" id="interest_' + s.id + '"> <label for="interest_' + s.id +  '">' + s.name + '</label></p>';
            } else if( s.type === 'Interests and Hobbies' ) {
                hobbiesInput += '<p><input type="checkbox" name="hobbies" value="' + s.id + '" id="interest_' + s.id + '"> <label for="interest_' + s.id +  '">' + s.name + ' </label></p>';
            }
        });
        iAnimalsDiv.innerHTML = iAnimalsDiv.innerHTML + animalsInput;
        iHobbiesDiv.innerHTML = iHobbiesDiv.innerHTML + hobbiesInput;
    };
    xhr2.send();
    //---------------------------------------------------------------------------------------------------------------
}

function saveSubscription() {
    //First, check mandatory fields based on opt selection.
    var opt = document.getElementsByName('opt');
    var optVal = null;

    //Because of compatibility with physical device, should use for statement instead of forEach().
    for( var i = 0; i < opt.length; ++i ) {
        if( opt[i].checked ) {
            optVal = opt[i].value;
        }
    }

    if( !optVal ) {
        alert("You must select an option for OPT field!");
        return false;
    }

    if( optVal === 'in' ) {
        //Email, Zip, Store Location, and at least one interest items are mandatory.
        var email = document.getElementById('email').value;
        var zip_code = document.getElementById('zip_code').value;
        var store_location = storesPicker.options[storesPicker.selectedIndex].value;
        var animals = document.getElementsByName('animals');
        var hobbies = document.getElementsByName('hobbies');
        var okInterests = false;

        //Checks that at least the user checked 1 interest.
        var counterInterests = 0;
        var selectedAnimals = [];
        for( var a = 0; a < animals.length; ++a ) {
            if( animals[a].checked ) {
                counterInterests++;
                selectedAnimals.push( animals[a].value );
            }
        }

        var selectedHobbies = [];
        for( var h = 0; h < hobbies.length; ++h ) {
            if( hobbies[h].checked ) {
                counterInterests++;
                selectedHobbies.push( hobbies[h].value );
            }
        }

        if( counterInterests > 0 ) {
            okInterests = true;
        }

        //If passes mandatory fields validation, then save subscription.
        if( email && zip_code && store_location != 0 && okInterests ) {
            var first_name = document.getElementById('first_name').value;
            var last_name = document.getElementById('last_name').value;
            var loyalty_member = document.getElementById('loyalty_member');
            var phone_number = document.getElementById('phone_number').value;
            var mobile_number = document.getElementById('mobile_number').value;
            var birth_month = document.getElementById('birth_month');
            var gender = document.getElementsByName('gender');

            var genderValue = null;
            for( var g = 0; g < gender.length; ++g ) {
                if( gender[g].checked ) {
                    genderValue = gender[g].value;
                }
            }

            //------------------------------------------------------- SAVE Subscription ---------------------------------------------------------------------------------
            var data = new FormData();
            //----------- Mandatory information for subscrition --------------------
            data.append('deviceID', deviceID);
            data.append('email', email);
            data.append('zip', zip_code);
            data.append('store_location', store_location);
            data.append('animals', selectedAnimals);
            data.append('hobbies', selectedHobbies);
            //----------- Extra information ----------------------------------------
            data.append('loyalty_member', loyalty_member.checked);
            data.append('gender', genderValue);
            data.append('first_name', first_name);
            data.append('last_name', last_name);
            data.append('birth_month', birth_month.options[birth_month.selectedIndex].value);
            data.append('phone_number', phone_number);
            data.append('mobile_number', mobile_number);

            var xhr = new XMLHttpRequest();
            xhr.open( "POST", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=subscribe-device" );
            xhr.onload = function() {
                var apiResponse = JSON.parse( xhr.responseText );
                console.log( apiResponse );
                if( apiResponse.success ) {
                    alert("Subscribed successfully!");
                } else {
                    alert("Error occurred while subscribing. Try again.");
                }
            };
            xhr.send( data );
            //----------------------------------------------------------------------------------------------------------------------------------------
        } else {
            alert( "You must fill the mandatory fields to make the subscription!" );
        }
    } else if( optVal === 'out' ) {
        var data2 = new FormData();
        data2.append( 'deviceID', deviceID );
        var xhr2 = new XMLHttpRequest();
        xhr2.open( "POST", "https://mapp.familyfarmandhome.com/wp-content/plugins/ffhapi/ffhapi.php?action=un-subscribe-device" );
        xhr2.onload = function() {
            var apiResponse = JSON.parse( xhr2.responseText );
            if( apiResponse.success ) {
                alert("Removed subscription successfully!");
                subscriptionForm.reset();
            } else {
                var message = "Error occurred while removing subscription. Try again.";
                if( apiResponse.message ) {
                    message = apiResponse.message;
                }
                alert( message );
            }
        };
        xhr2.send( data2 );
    }
}

