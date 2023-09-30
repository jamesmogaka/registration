//Make reference to the server
import * as server from "../../../schema/v/code/server.js";
//
//Import outlook class in order to access register and authenticate methods
import { outlook } from "../../../outlook/v/code/login.js";
import * as app from "../../../outlook/v/code/app.js";
//
//query to gett all the businesses from the database
const business_query = "SELECT * FROM business";
//Declare global variables
var username;
var password;
var show_password;
var options;
var failed;
var login_dialog;
var login_form;
var organization_dialog;
var organization_form;
var option_sect;
var businesses_options;
var signup_businesses_dialog;
var signup_div;
var signup_businesses_form;
var business_form_error;
var businesses_checkboxes;
var add_business;
var business_input;
export function register() {
    //
    //Declaring variables for  referencing the html elements
    username = document.getElementById('user_name');
    password = document.getElementById('password');
    show_password = document.getElementById('show_password');
    options = document.getElementsByName('option');
    failed = document.getElementById('failed');
    login_dialog = document.getElementById('login_dialog');
    login_form = document.getElementById('login_form');
    organization_dialog = document.getElementById('selection_dialog');
    organization_form = document.getElementById('selection_form');
    option_sect = document.getElementById('radio');
    businesses_options = document.getElementsByName('business');
    signup_div = document.getElementById('checkbox');
    signup_businesses_form = document.getElementById('businesses_form');
    signup_businesses_dialog = document.getElementById('businesses_dialog');
    business_form_error = document.getElementById('business_form_error');
    businesses_checkboxes = document.getElementsByName("check_business");
    add_business = document.getElementById("add_business");
    business_input = document.getElementById('input_business');
    //
    //Start the authentication or registration process
    document.getElementById('register').addEventListener('click', on_start_registration);
    //
    //Listen to submitting of the form.
    login_form.addEventListener('submit', on_sign);
    //
    //Remove the error message on form input
    login_form.oninput = () => {
        failed.innerHTML = '';
    };
    //
    //
    show_password.addEventListener('change', function () {
        //
        //makes the password visible when the checkbox is checked
        if (show_password.checked) {
            password.type = 'text';
        }
        //hides the password when the checkbox is unchecked
        else {
            password.type = 'password';
        }
    });
    signup_businesses_form.addEventListener('submit', checked_business);
    signup_businesses_form.oninput = () => {
        business_form_error.innerHTML = '';
    };
    //
    //When the user wants to add the business to the list of offered options..
    add_business.onclick = () => {
        //
        //Call the function responsible for adding the business to the database
        add_business_db();
        //
    };
}
//
//
//Sign in for old users or sign up for new users
async function on_sign(e) {
    //
    //Prevent the default form behavior of clearing the form data on submission.
    e.preventDefault();
    //
    //Collect the signing credentials, i.e., username,  password and the sign.
    const Credentials = {
        username: username.value,
        password: password.value,
        sign: get_sign(options)
    };
    //
    //Use the credentials (and the outlook library) to authenticate the user. 
    const result = await authenticate_user(Credentials);
    //
    //If the credentials are valid...
    if (result instanceof app.user) {
        //
        //...close the dialog
        login_dialog.close();
        //
        //check the option that the user has selected. For sign up, open a registration form 
        //in order to get all the details of the user. For sign in, open the organization selection
        //dialog and welcome the user
        if (Credentials.sign === 'up') {
            //
            //Open the multiple business selection to register under the user's businesses
            console.log("registration form");
            signup_businesses_dialog.showModal();
            business_form_error.innerHTML = '';
            multiple_selection();
        }
        else if (Credentials.sign === 'in') {
            //
            //Open the business/organization selection
            for (let i = 0; i < businesses_options.length; i++)
                if (businesses_options[i].checked) {
                    businesses_options[i].checked = false;
                }
            organization_dialog.showModal();
            on_success(result);
            //
            //Listen to submitting the organization form
            organization_form.addEventListener('submit', (e) => {
                //
                //Prevent default form behavior i.e., clearing the input and refreshing the page
                e.preventDefault();
                //
                //Call a method that closes the organization dialog and welcomes the user
                on_finish(result);
                for (let i = 0; i < businesses_options.length; i++)
                    if (businesses_options[i].checked) {
                        console.log(businesses_options[i].value);
                    }
                //location.reload();
            });
        }
    }
    //..otherwise report signing failure    
    else
        failed.innerHTML = result.message;
}
//
//Get the value of the sign property in the credentials object from the option that is
//selected.
function get_sign(options) {
    //
    //let the default sign be 'out';
    let return_value = 'out';
    //
    //Go through the options, that is, sign up and sign in
    for (let i = 0; i < options.length; i++) {
        //
        //see whether the option at position i is checked and it's value is 'sign up'
        //then sign becomes 'up'
        if (options[i].checked && options[i].value == "up") {
            return_value = 'up';
        }
        //see whether the option at position i is checked and it's value is 'sign in'
        //then sign becomes 'in'
        else if (options[i].checked && options[i].value == "in") {
            return_value = 'in';
        }
    }
    return return_value;
}
//
//Use the credentials to authenticate the user and password. Use the outlook library
//to do this. Get help from peter
async function authenticate_user(credentials) {
    //
    //Create the outlook provider object
    const Outlook = new outlook(credentials.username, credentials.password);
    //
    //Defining the sign result;
    let result;
    //
    //Decide from the users request whether to  sign in or up
    switch (credentials.sign) {
        case 'in':
            result = await Outlook.authenticate_user();
            break;
        case 'up':
            result = await Outlook.register_user();
            break;
        case 'out':
            //
            //Sign out not implemented
            result = new Error('Sign out not implemented');
    }
    //
    //Return the sign results
    return result;
}
//
//Open the dialog with all input fields empty   
function on_start_registration() {
    //
    //open the dialog in a way that other elements outside can't be accessed
    login_dialog.showModal();
    //
    //clear the username and password
    username.value = '';
    password.value = '';
    //
    //checks which of the radio buttons is checked and unchecks it
    for (let i = 0; i < options.length; i++)
        if (options[i].checked)
            options[i].checked = false;
    //failed.innerHTML ='';
}
//
//Close the business selection dialog and welcome the user
function on_finish(user) {
    organization_dialog.close();
    console.log("Welcome " + user.name);
}
//
//On successful sign in that is, the credentials are the right ones
async function on_success(user) {
    //
    //Query to get the business from the user
    console.log(user);
    const user_business_query = `SELECT business FROM user WHERE name='${user.name}'`;
    //retrieves the businesses from the user that is signing in
    const businesses = await server.exec("database", ["mutall_users", false], "get_sql_data", [user_business_query]);
    if (!option_sect.hasChildNodes()) {
        businesses.forEach(business => {
            let input = document.createElement('input');
            let tag = document.createElement('label');
            let business_id = business.business;
            let business_name = business.name;
            input.setAttribute('id', business_id);
            tag.setAttribute('for', business_id);
            input.type = 'radio';
            input.required = true;
            input.name = 'business';
            input.value = business_name;
            option_sect.appendChild(tag);
            tag.appendChild(input);
            tag.append(business_name);
        });
    }
}
async function multiple_selection() {
    //
    //retrieves the businesses from the business table
    const businesses = await server.exec("database", ["mutall_users", false], "get_sql_data", [business_query]);
    for (let i = 0; i < businesses_checkboxes.length; i++) {
        if (businesses_checkboxes[i].checked) {
            businesses_checkboxes[i].checked = false;
        }
    }
    if (!signup_div.hasChildNodes()) {
        businesses.forEach(business => {
            let input = document.createElement('input');
            let tag = document.createElement('label');
            let business_id = business.business;
            let business_name = business.name;
            input.setAttribute('id', business_id);
            tag.setAttribute('for', business_id);
            input.type = 'checkbox';
            input.value = business_name;
            input.name = 'check_business';
            signup_div.appendChild(tag);
            tag.appendChild(input);
            tag.append(business_name);
        });
    }
    else {
        console.log("Has child nodes!");
    }
}
//
//Checks whether you've filled any check
async function checked_business(e) {
    e.preventDefault();
    //
    //Query to get the most recent registered user so as to 
    //add the checked businesses to his account
    const recent_user_query = "SELECT * FROM user ORDER BY user DESC LIMIT 1";
    let checked = new Array();
    for (let i = 0; i < businesses_checkboxes.length; i++) {
        if (businesses_checkboxes[i].checked) {
            checked.push(businesses_checkboxes[i]);
        }
    }
    if (checked.length === 0) {
        business_form_error.innerHTML = "Please select at least one business";
    }
    else {
        // checked.forEach(async input=>{
        // })
        //
        //Get the most recent user
        let recent_user = await server.exec("database", ["mutall_users", false], "get_sql_data", [recent_user_query]);
        //
        //Add the business associated with the user to the user.business
        let user_business_query = `UPDATE user SET business='${checked[0].id}' WHERE name='${recent_user[0].name}'`;
        await server.exec("database", ["mutall_users", false], "query", [user_business_query]);
        signup_businesses_dialog.close();
    }
}
//
//WHen we add want to add a business, the following steps are taken..
function add_business_db() {
    //
    //Make sure the input field contains the name of the business you want to add
    if (business_input.value.length === 0) {
        business_form_error.innerHTML = "Kindly provide the name of the business you want added!";
    }
    else {
        //
        //Get the value entered and execute the query to add the business to the database
        let business_value = business_input.value;
        let add_business_query = `INSERT INTO business(id, name) VALUES ('${business_value.toLowerCase().replace(" ", "_")}', '${business_value}')`;
        server.exec("database", ["mutall_users", false], "query", [add_business_query]);
        //
        signup_businesses_dialog.close();
        //
        //Empty the div with the options so as to populate it with
        //the updated database content 
        for (let i = 0; i < signup_div.childNodes.length; i++) {
            signup_div.replaceChildren();
        }
        //
        //show the dialog after 0.5s 
        setTimeout(() => {
            signup_businesses_dialog.showModal();
            business_input.value = '';
            //
            //Call the method from populating the depopulated section with
            //updated list of businesses
            multiple_selection();
        }, 500);
    }
}
// START TRANSACTION; INSERT INTO your_table_name (username, password, business) VALUES ('example_user', 'example_password', 'business1');COMMIT;
// SELECT * FROM your_table_name
// ORDER BY id DESC
// LIMIT 1;
