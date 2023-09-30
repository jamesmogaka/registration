<?php

//
//Import the schema library to help in querying the database
include '../../../schema/v/code/schema.php';
//
//Import the questionnaire to facilitate writing to the database
include '../../../schema/v/code/questionnaire.php';
//
//
//Investigate on strict_types ?????????????
//
//Get the username and email for verification of user deatils
//Fetch the records from the database using the database class
//Incase the user was verified successfully proceed to generation of a temporary 
//password then hash the generated password.
//Modify the record from the database using the questionnaire class
//finally send the temporary password to the user via the email.

function change_password(string $username, string $email) {
    //
    //1. Fetch the user details of the given user
    //
    //1.1 Formulate the sql query for geting the user data
    $sql = 'SELECT user, name, email FROM user WHERE name =' . $username;
    //
    //1.2 Create a new instance of the database class
    $database = new \mutall\database('mutall_users', false);
    //
    //1.3 Use the db obejct to fetch the data
    $result/* Array<{user, name, email}> */ = $database->get_sql_data($sql);
    //
    //2. Verify that indeed the email provided is simmilar to what is there on the 
    //database. If they match continue to change the password otherwise 
    //discontinue the process returning feedback to the user.
    //
    //2.1 If there is no record in the database the user was never registared
    //(Report to the user)??????????
    if (count($result) === 0)
        throw new Exception("You need to be registard with us!");
    //
    //2.2 If there is more than one record in the database there is a problem in design
    if (count($result) > 1)
        throw new Exception("There is an issue with the database indexes");
    //
    //2.3 If only one user exist proceed to compare the email provided with the email 
    //that was gotten from the database
    if ($result[0]["email"] !== $email)
        throw new Exception("The email provided is not the one in the database");
    //
    //3. Generate a random password and hash it
    //
    //3.1 Random password
    //Generate random bytes then encode them to base 64 to make a string from the bytes
    $password = base64_encode(random_bytes(10));
    //
    //3.2 Hash the password
    $hash = password_hash($password, PASSWORD_DEFAULT);
    //
    //4. Write the new hashed password to the db under the given user
    //
    //4.1 Create an instance of the questionnaire class
    $quest = new \mutall\questionnaire('mutall_users');
    //
    //4.2 Collect the layouts
    $layouts = [
        [$result[0]["user"], "user", "user"],
        [$hash, "user", "password"]
    ];
    //
    //4.2 Load the data using the questionnaire
    $result/* :'Ok'|string */ = $quest->load_common($layouts);
    //
    //5. Send the password to the user upon successfull editing 
    //
    //5.1 Create an instance of the mailer class
    $messenger = new \mutall\messenger();
    //
    //5.2 Send the message using the mailer
    $messenger->send();
}

//