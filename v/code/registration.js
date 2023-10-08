//
//Access the user class to use it as a data type
import { user } from "../../../outlook/v/code/app.js";
//
//To access the registration ad authentication services
import { outlook } from "../../../outlook/v/code/login.js";
//
//To help in error reporting
import { mutall_error } from "../../../schema/v/code/schema.js";
//
//Use the dialog class to help in data collection
import { dialog } from "../../../mashamba/v/code/dialog.js";
//
//Help to implement DOM manipulation methods
import { view } from "../../../outlook/v/code/view.js";
//
//Handles all registration activities
//
//The registration facilites provided by this class include:-
//Sign in 
//Sign up
//Sign out
//Password reset(Forgot password)
//Changing password 
//Updating User details
export class registration extends view {
    business;
    //
    //The key to the user in the local_storage. The key value is a son string of
    //Iuser. You can convert to a user by creating a new one
    static current_user = '___user';
    //
    //Allows for instantiation of the class 
    constructor(business) {
        //
        super();
        this.business = business;
    }
    //
    //Coordinate the various registration processes based on the operation
    //that the user selected. We first create a dialog that will collect the data from
    //the user then check the field operation to determine which process was 
    //selected by the user and carry out the relevant operation
    async administer() {
        //
        //Create a dialog to collect data from the user
        const enroll = new enrollment(this.document.body);
        //
        //Get data form the dialog
        const data = await enroll.administer();
        //
        //If the data collection process was aborted discontinue the process
        if (!data)
            return undefined;
        //
        //We get the user from the enroll if there is one present
        return enroll.user;
    }
    //
    //Show and hide the password 
    show_password() {
        //
        //Get the checkbox which when checked, the password readable text
        //and when unchecked the password is not readable
        const show_element = this.get_element('show_password');
        //
        //Access the input element responsible for collecting the password
        const password_element = this.document.querySelector('input[type=password]');
        //
        //Listen in on the checkbox for any changes 
        show_element.addEventListener("change", () => {
            //
            //make the password readable and unreadable depending on the checkbox state
            if (show_element.checked)
                password_element.type = "text";
            else
                password_element.type = "password";
        });
    }
    //
    //Retrieve the current logged in user and remove the user from the window storage
    logout() {
        //
        //Exit the function if there's no user logged in
        if (!(this.get_current_user()))
            return;
        //
        //Clear the current user from teh local storage
        window.localStorage.removeItem(registration.current_user);
    }
    //
    //Get the user that is existing in the window storage, that is, the user 
    //that is currently logged in otherwise return undefined if there's no user 
    //that is logged in
    get_current_user() {
        //
        //Check that the local storage has someone logged in.
        const Iuser_str = window.localStorage.getItem(registration.current_user);
        //
        //If no one is logged in, return undefined
        if (!Iuser_str)
            return undefined;
        //
        //There's someone logged in, convert the user string to an Iuser
        const Iuser = JSON.parse(Iuser_str);
        //
        //Creae a new user
        return new user(Iuser.name, Iuser.pk);
    }
}
//
//This is the dialog that will help in collection of the user data for driving the
//registration process
class enrollment extends dialog {
    //
    //Reference to the user that has logged in 
    user;
    //
    constructor(anchor) {
        //
        //Initialize the dialog with the given fragment and anchor
        super({ url: "/registration/v/code/registration.html", anchor });
    }
    //
    //Remove the errors when changes are made to form input elements
    on_input() {
        //
        //Get the elements with class 'error' then remove the error message
        const errors = this.document.querySelectorAll('.error');
        //
        //Clear any error messages on the form
        errors.forEach(error => error.textContent = '');
    }
    //
    //Extract data from the registration form as it is with possibility for errors
    //The dialog system will take care of the error checks and targeted reporting 
    async read() {
        //
        //Compile the raw credentials by geting the inputs directly form the form
        //
        //Whatever we read from the enrollment dialog changes depending on the operation.
        //In that when the user selects sign in and sign up we require the user name,
        //email and password and if the user selects forgot password we are required to
        //collect the username and email. The case of change password is special since
        //we need another dialog form to collect the current password and  
        //
        //
        return {
            type: 'credentials',
            username: this.get_value('username'),
            password: this.get_value('password'),
            operation: this.get_value('operation'),
        };
    }
    //
    async save(input) {
        //
        //Create an instance of the outlook class that would handle the authentication
        //and registration processes
        const Outlook = new outlook(input.username, input.password);
        //
        //Using the data collected select appropriate operation to conduct
        switch (input.operation) {
            //
            //Handle the registation of new users 
            case 'up': return await this.sign_up(Outlook);
            //
            //Here we handle authentication of exsistent users before allowing them
            //to access offerd services
            case 'in': return await this.sign_in(Outlook);
            //
            //It is very difficult to reach at this point without selecting an opperation
            //The dialog system will have alredy informed the user during data collection
            //that he cannot proceed without selection of an operation since it is required
            default: return new mutall_error("Please select an operation");
        }
    }
    //
    //Using the outlook instance given acces the authentication service
    //The result of a succesfull authentication process is a user otherwise an error
    //The user details are stored in the local storage and also returned if the 
    //???????????? We are not using the credentials at this poin
    async sign_in(/*data:credentials,*/ auth) {
        //
        //Authenticate the user 
        const user = await auth.authenticate_user();
        //
        //Incase there was a problem with the process return the error that was gotten
        if (user instanceof Error)
            return user;
        //
        //At this point we know that the user was succesfully authenticated 
        //We then store the user both in the local storage and as a property
        this.user = user;
        //
        window.localStorage.setItem(registration.current_user, JSON.stringify(user));
        //
        //Finally return ok to indicate that the authentication process was succesfull
        return "ok";
    }
    //
    //????????The current registar_user method in the outlook does not take care
    //of the fact that we need the user to provide an email which will be helpful 
    //incase of forget password
    //
    //
    //Using the authentication instance perfom the enrollment of the new user
    //After succesfull enrollment we expect the user property of this enrollment
    //class to be updated and the enrolled user records to be stored in the local 
    //storage of the browser. In case the registration process was not successfull
    //the function returns the error.
    async sign_up(auth) {
        //
        //Register the user 
        const user = await auth.register_user();
        //
        //Incase there was a problem with the process return the error that was gotten
        if (user instanceof Error)
            return user;
        //
        //At this point we know that the user was succesfully registered 
        //We then store the user both in the local storage and as a property
        this.user = user;
        //
        window.localStorage.setItem(registration.current_user, JSON.stringify(user));
        //
        //Finally return ok to indicate that the authentication process was succesfull
        return "ok";
    }
}
