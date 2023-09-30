<?php
//
//Include the schema so that php can check the compartibility brtween definations
include '../../../schema/v/code/schema.php';
//
//Import the questionnaire to facilitate writing to the database
include '../../../schema/v/code/questionnaire.php';
//
//Random password
//Generate random bytes then encode them to base 64 to make a string from the bytes
$password = base64_encode(random_bytes(10));
//
//Hash the password
$hash = password_hash("mutall_data", PASSWORD_DEFAULT);
//
//Write the new hashed password to the db under the given user
//
//Create an instance of the questionnaire class
$quest = new \mutall\questionnaire("mutall_users");
//
//Collect the layouts
$layouts = [
    [1326,"user", "user"],
    [$hash, "user", "password"]
];
//
//Load the data using the questionnaire
$result/* :'Ok'|string */ = $quest->load_common($layouts, "log.xml");
//
//log the results of the operation
echo $result;


