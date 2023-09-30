<?php
//
//To facilitate sending of emails to the user
include '../../../schema/v/messenger_originals/mailer.php';
//Send an email to a given user 
//
//5.1 Create an instance of the mailer class
$mailer = new mailer();
//
//5.2 Send the message using the mailer
$result = $mailer->send_email(
    //
    //The recepient
    "jamesoyondi23@gmail.com",
    //
    //The subject of the email
    "THIS IS A TEST",
    //
    //The body of the email
    "Test 123"
);

echo $result;
