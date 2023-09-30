<?php
//Generate a random password and hash it
//
//Random password
//Generate random bytes then encode them to base 64 to make a string from the bytes
$password = base64_encode(random_bytes(10));
//
//Hash the password
$hash = password_hash($password,PASSWORD_DEFAULT);
//
//Show the password and the hash that was generated
echo $password;
//
echo $hash;
