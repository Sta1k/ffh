<?php
/*
Plugin Name: Family Farm & Home API
*/
header("Content-Type: application/json");
header('Access-Control-Max-Age: 1728000');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: *');
header('Access-Control-Allow-Headers: Content-MD5, X-Alt-Referer');
header('Access-Control-Allow-Credentials: true');

//To use at the server
require_once( $_SERVER['DOCUMENT_ROOT'] . '/wp-config.php' );
require_once( $_SERVER['DOCUMENT_ROOT'] . '/wp-includes/plugin.php' );
require_once( $_SERVER['DOCUMENT_ROOT'] . '/wp-includes/functions.php' );
require_once( $_SERVER['DOCUMENT_ROOT'] . '/wp-includes/class-wp-query.php' );
require_once( $_SERVER['DOCUMENT_ROOT'] . '/wp-includes/pluggable.php' );

/** Define API methods. */
add_action('wp_ajax_nopriv_stores', 'getStoresCoordinates');
add_action('wp_ajax_nopriv_circulars', 'getStoresCirculars');
add_action('wp_ajax_nopriv_offers', 'getStoresOffers');
add_action('wp_ajax_nopriv_get-barcode', 'getBarCode');
add_action('wp_ajax_nopriv_save-barcode', 'saveBarCode');
add_action('wp_ajax_nopriv_get-subscription', 'getSubscription');
add_action('wp_ajax_nopriv_subscribe-device', 'subscribeDevice');
add_action('wp_ajax_nopriv_un-subscribe-device', 'unSubscribeDevice');
add_action('wp_ajax_nopriv_get-interests', 'getInterests');
add_action('wp_ajax_nopriv_get-notifications', 'getNotifications');
add_action('wp_ajax_nopriv_set-notification-read', 'setNotificationRead');
add_action('wp_ajax_nopriv_get-local-store', 'getLocalStore');
add_action('wp_ajax_nopriv_set-local-store', 'setLocalStore');

/** Get GPS coordinates for all the stores. */
function getStoresCoordinates() {
    $response = [];
    $_terms = get_terms(['store']);

    foreach ($_terms as $term) :
        $term_slug = $term->slug;

        $_locations = new WP_Query(array(
            'post_type' => 'location',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'store',
                    'field' => 'slug',
                    'terms' => $term_slug,
                ),
            )
        ));

        // If this TAXONOMY has a post in the LOCATIONS post type, loop through each one of the LOCATIONS attributed to the TAXONOMY NAME and export the data
        if ($_locations->have_posts()) :
            while ($_locations->have_posts()) : $_locations->the_post();
                $storeInformation = [
                    'name' => $term->name,
                    'latitude' => types_render_field("latitude", []),
                    'longitude' => types_render_field("longitude", []),
                    'zip' => types_render_field("zip-code", []),
                    'place_id' => types_render_field("placeid", []),
                ];
                $response[] = $storeInformation;
            endwhile;
        endif;

        wp_reset_postdata();
    endforeach;

    echo json_encode( $response );
    die;
}

function getStoresCirculars() {
    $response = [];
    $_terms = get_terms(array('store'));
    $store = $_GET['store'];

    foreach ($_terms as $term) :
        $term_slug = $term->slug;
        $_circulars = new WP_Query(array(
            'post_type' => 'circular',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'store',
                    'field' => 'slug',
                    'terms' => $term_slug,
                ),
            ),
        ));

        // If this TAXONOMY has a post in the CIRCULARS post type, loop through each one of the CIRCULARS attributed to the TAXONOMY NAME and export the data
        if ($_circulars->have_posts()) :
            while ($_circulars->have_posts()) : $_circulars->the_post();
                $thumb = get_the_post_thumbnail_url();
                $circularInformation = [
                    'name' => $term->name,
                    'file' => $thumb,
                    'url' => types_render_field("circular-pdf", []),
                    'start-date' => types_render_field("circular-start-date", []),
                    'end-date' => types_render_field("circular-end-date", []),
                ];

                //Get only the cross stores circulars and the store-specific circulars
                if( $term->name == $store || $term->name == 'All Stores' ) {
                    $response[] = $circularInformation;
                }
                //Get all circulars of all the stores
                if( $store == 'all' ) {
                    $response[] = $circularInformation;
                }
            endwhile;
        endif;

        wp_reset_postdata();
    endforeach;

    echo json_encode( $response );
    die;
}

function getStoresOffers() {
    $response = [];
    $_terms = get_terms(['store']);
    $store = $_GET['store'];


    foreach ($_terms as $term) :
        $term_slug = $term->slug;
        $_offers = new WP_Query(array(
            'post_type' => 'offer',
            'posts_per_page' => -1,
            'tax_query' => array(
                array(
                    'taxonomy' => 'store',
                    'field' => 'slug',
                    'terms' => $term_slug,
                ),
            ),
        ));

        // If this TAXONOMY has a post in the OFFERS post type, loop through each one of the OFFERS attributed to the TAXONOMY NAME and export the data
        if ($_offers->have_posts()) :
            while ($_offers->have_posts()) : $_offers->the_post();
                $thumb = get_the_post_thumbnail_url();
                $offerInformation = [
                    'image' => $thumb,
                    'name' => $term->name,
                    'title' => types_render_field("offer-title", array()),
                    'disclaimer' => types_render_field("offer-disclaimer", array()),
                    'start' => types_render_field("offer-start-date", array()),
                    'end' => types_render_field("offer-end-date", array())
                ];
                //Get only the cross stores offers and the store-specific offers
                if( $term->name == $store || $term->name == 'All Stores' ) {
                    $response[] = $offerInformation;
                }
            endwhile;
        endif;

        wp_reset_postdata();
    endforeach;

    echo json_encode( $response );
    die;
}

/** Returns associated barcode for specified device ID. */
function getBarCode() {
    $deviceId = $_GET['deviceID'];
    $response = [];
    $response['found'] = false;
    $response['device_id'] = $deviceId;
    global $wpdb;

    if( !empty( $deviceId ) ) {
        $res = $wpdb->get_results( "SELECT * FROM mapp_users WHERE device_id = '{$deviceId}'" );

        if( count( $res ) > 0 ) {
            $response['device_id'] = $res[0]->device_id;
            $response['barcode_string'] = $res[0]->rewards_card_barcode_string;
            $response['found'] = true;
        }
    }

    echo json_encode( $response );
    die;
}

function saveBarCode() {
    global $wpdb;
    $response = [];
    $deviceId = $_GET['deviceID'];
    $barCodeString = $_GET['barCodeString'];

    if( !empty( $deviceId ) && !empty( $barCodeString ) ) {
        $res = $wpdb->get_results( "SELECT * FROM mapp_users WHERE device_id = '{$deviceId}'" );

        //If device exist, then perfom update.
        if( count( $res ) > 0 ) {
            $response['performed_action'] = 'Update';
            try {
                $wpdb->update(
                    'mapp_users',
                    array(
                        'rewards_card_barcode_string' => $barCodeString
                    ),
                    array( 'device_id' => $deviceId )
                );
                $response['success'] = true;
            } catch( \Exception $e ) {
                $response['success'] = false;
                $response['error'] = $e;
            }
        } else {
            //New device, perform insert.
            $response['performed_action'] = 'Insert';
            try {
                $wpdb->insert(
                    'mapp_users',
                    array(
                        'device_id' => $deviceId,
                        'rewards_card_barcode_string' => $barCodeString
                    )
                );
                $response['success'] = true;
            } catch( \Exception $e ) {
                $response['success'] = false;
                $response['error'] = $e;
            }
        }
    }

    echo json_encode( $response );
    die;
}

function subscribeDevice() {
    global $wpdb;
    $response = [];
    //----- Mandatory fields --------
    $deviceId = $_POST['deviceID'];
    $email = $_POST['email'];
    $zip = $_POST['zip'];
    $storeLocation = $_POST['store_location'];
    $animals = $_POST['animals'];
    $hobbies = $_POST['hobbies'];
    $iAnimals = explode( ',', $animals );
    $iHobbies = explode( ',', $hobbies );
    $allInterests = array_filter( array_merge( $iAnimals, $iHobbies ) );

    //----- Non-mandatory fields ------
    $firstName = $_POST['first_name'];
    $lastName = $_POST['last_name'];
    $phoneNumber = $_POST['phone_number'];
    $mobileNumber = $_POST['mobile_number'];
    $loyaltyMember = $_POST['loyalty_member'];
    if( $loyaltyMember ) {
        $loyaltyMember = 1;
    }
    else {
        $loyaltyMember = 0;
    }
    $birthMonth = $_POST['birth_month'];
    $gender = $_POST['gender'];

    if( !empty( $deviceId )  && !empty( $email ) && !empty( $zip ) && !empty( $storeLocation ) && ( !empty( $animals ) || !empty( $hobbies ) ) ) {
        $res = $wpdb->get_results( "SELECT * FROM mapp_users WHERE device_id = '{$deviceId}'" );

        //If device exist, then perfom update.
        if( count( $res ) > 0 ) {
            $response['performed_action'] = 'Update';
            try {
                $wpdb->update(
                    'mapp_users',
                    [
                        'registered_email' => $email,
                        'zip' => $zip,
                        'store_location' => $storeLocation,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'phone_number' => $phoneNumber,
                        'mobile_number' => $mobileNumber,
                        'birth_month' => $birthMonth,
                        'gender' => $gender,
                        'loyalty_member' => $loyaltyMember,
                        'opt_in' => 1,
                    ],
                    [ 'device_id' => $deviceId ]
                );

                //First, remove the old interest. Then save new ones.
                $wpdb->delete( 'mapp_users_interests', [ 'device_id' => $deviceId ] );
                foreach( $allInterests as $key => $interestId ) {
                    $wpdb->insert(
                        'mapp_users_interests',
                        [
                            'device_id' => $deviceId,
                            'interest_id' => $interestId,
                        ]
                    );
                }

                $response['success'] = true;
            } catch( \Exception $e ) {
                $response['success'] = false;
                $response['error'] = $e;
            }
        } else {
            //New device, perform insert.
            $response['performed_action'] = 'Insert';
            try {
                $wpdb->insert(
                    'mapp_users',
                    [
                        'device_id' => $deviceId,
                        'registered_email' => $email,
                        'zip' => $zip,
                        'store_location' => $storeLocation,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'phone_number' => $phoneNumber,
                        'mobile_number' => $mobileNumber,
                        'birth_month' => $birthMonth,
                        'gender' => $gender,
                        'loyalty_member' => $loyaltyMember,
                        'opt_in' => 1,
                    ]
                );

                foreach( $allInterests as $key => $interestId ) {
                    $wpdb->insert(
                        'mapp_users_interests',
                        [
                            'device_id' => $deviceId,
                            'interest_id' => $interestId,
                        ]
                    );
                }

                $response['success'] = true;
            } catch( \Exception $e ) {
                $response['success'] = false;
                $response['error'] = $e;
            }
        }
    } else {
        $response['success'] = false;
    }

    echo json_encode( $response );
    die;
}

function getSubscription() {
    $deviceId = $_GET['deviceID'];
    $response = [];
    $response['found'] = false;
    $response['device_id'] = $deviceId;
    global $wpdb;

    if( !empty( $deviceId ) ) {
        $res = $wpdb->get_results( "SELECT * FROM mapp_users WHERE device_id = '{$deviceId}'" );

        if( count( $res ) > 0 ) {
            if( !empty( $res[0]->registered_email ) ) {
                $response['device_id'] = $res[0]->device_id;
                $response['email'] = $res[0]->registered_email;
                $response['found'] = true;
            }
        }
    }

    echo json_encode( $response );
    die;
}

function getInterests() {
    $response = [];
    global $wpdb;

    $res = $wpdb->get_results( "SELECT * FROM mapp_interests" );

    foreach( $res as $i ) {
        $obj['id'] = $i->id;
        $obj['name'] = $i->name;
        $obj['type'] = $i->type;
        $response[] = $obj;
    }

    echo json_encode( $response );
    die;
}

function unSubscribeDevice() {
    global $wpdb;
    $response = [];
    $deviceId = $_POST['deviceID'];

    if( !empty( $deviceId ) ) {
        $res = $wpdb->get_results( "SELECT * FROM mapp_users WHERE device_id = '{$deviceId}' AND opt_in = 1" );

        //Check if device is subscribed. If so, then proceed to un-subscribe by setting opt_in to 0.
        if( count( $res ) > 0 ) {
            $wpdb->update(
                'mapp_users',
                [
                    'opt_in' => 0,
                ],
                [ 'device_id' => $deviceId ]
            );

            $response['success'] = true;
        } else {
            $response['success'] = false;
            $response['message'] = "Your are not subscribed!";
        }
    }

    echo json_encode( $response );
    die;
}


function getNotifications() {
    global $wpdb;
    $response = [];
    $deviceId = $_GET['deviceID'];

    if( !empty( $deviceId ) ) {
        $res = $wpdb->get_results( "SELECT * FROM mapp_notifications WHERE device_id = '{$deviceId}' AND notified = 0 ORDER BY tstamp DESC LIMIT 10" );

        foreach( $res as $i ) {
            $time = strtotime( $i->tstamp );
            $dateTime = date("Y/m/d H:i:s", $time);
            $obj['id'] = $i->id;
            $obj['title'] = $i->title;
            $obj['text'] = $i->text;
            $obj['tstamp'] = $dateTime;
            $response[] = $obj;
        }
    }

    echo json_encode( $response );
    die;
}

function setNotificationRead() {
    global $wpdb;
    $response = [];
    $notificationId = $_GET['notificationID'];

    if( !empty( $notificationId ) ) {
        try {
            $wpdb->update(
                'mapp_notifications',
                [
                    'notified' => 1,
                ],
                [ 'id' => $notificationId ]
            );
            $response['success'] = true;

        } catch( \Exception $e ) {
            $response['message'] = $e->getMessage();
            $response['success'] = false;
        }
    }

    echo json_encode( $response );
    die;
}

function setLocalStore() {
    global $wpdb;
    $response = [];
    $deviceId = $_GET['deviceID'];
    $storeLocation = $_GET['local_store'];

    if( !empty( $deviceId ) && !empty( $storeLocation ) ) {
        $res = $wpdb->get_results( "SELECT * FROM mapp_users WHERE device_id = '{$deviceId}'" );
        if( count( $res ) > 0 ) {
            try {
                $wpdb->update(
                    'mapp_users',
                    [
                        'store_location' => $storeLocation,
                    ],
                    [ 'device_id' => $deviceId ]
                );
                $response['success'] = true;

            } catch( \Exception $e ) {
                $response['message'] = $e->getMessage();
                $response['success'] = false;
            }
        } else {
            try {
                $wpdb->insert(
                    'mapp_users',
                    [
                        'device_id' => $deviceId,
                        'store_location' => $storeLocation,
                    ]
                );
                $response['success'] = true;

            } catch( \Exception $e ) {
                $response['message'] = $e->getMessage();
                $response['success'] = false;
            }
        }
    }
    echo json_encode( $response );
    die;
}

function getLocalStore() {
    global $wpdb;
    $response = [];
    $deviceId = $_GET['deviceID'];

    if( !empty( $deviceId ) ) {
        $res = $wpdb->get_results( "SELECT store_location FROM mapp_users WHERE device_id = '{$deviceId}'" );
        if( count( $res ) > 0 ) {
            $response['local_store'] = $res[0]->store_location;
        }
    }

    echo json_encode( $response );
    die;
}

/** Call to the requested method. */
do_action( 'wp_ajax_nopriv_' . $_GET['action'] );