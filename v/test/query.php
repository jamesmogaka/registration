<?php
//
//Import the schema library to help in querying the database
include '../../../schema/v/code/schema.php';
//
//1. Fetch the user details of the given user
//
//1.1 Formulate the sql query for geting the user data
$sql = 'SELECT user, name, email FROM user WHERE name ="mogaka"';
//
//1.2 Create a new instance of the database class
$database = new \mutall\database('mutall_users', false);
//
//1.3 Use the db obejct to fetch the data
$result/* Array<{user, name, email}> */ = $database->get_sql_data($sql);
//
//1.4 If there is no record in the database the user was never registared
//(Report to the user)??????????
if (count($result) === 0)
    throw new Exception("You need to be registard with us!");
//
//1.5 If there is more than one record in the database there is a problem in design
if (count($result) > 1)
    throw new Exception("There is an issue with the database indexes");
//
//Verify that indeed the email provided is simmilar to what is in the
//database. If they match continue to change the password otherwise 
//discontinue the process returning feedback to the user.
//
//If only one user exist proceed to compare the email provided with the email 
//that was gotten from the database
//if ($result[0]["email"] !== $email) throw new Exception("The email provided is not the one in the database");
//
//display the results form the query 
var_dump($result);