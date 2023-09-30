//
//Access the user class to use it as a data type
import { user, Iuser } from "../../../outlook/v/code/app.js";
//
//To access the registration ad authentication services
import {outlook} from "../../../outlook/v/code/login.js";
//
//Access to the popup class (to implement dialog box-like behavior)
import {popup} from "../../../outlook/v/code/outlook.js";
//
//Access the better error reporting method
import {database} from "../../../schema/v/code/schema.js";
//
//Import server library
import * as server from "../../../schema/v/code/server.js";
//
//To help in error reporting
import {mutall_error} from "../../../schema/v/code/schema.js";
//
//Use the dialog class to help in data collection
import {dialog,raw} from "../../../mashamba/v/code/dialog.js";
//
//Help to implement DOM manipulation methods
import {view} from "../../../outlook/v/code/view.js";
//
//The data being collected for user authentication
type credentials = {
    type:'credentials',
    //
    //The primary data that idendifies a user
    username:string, 
    password:string,
    email:string,
    //
    //The authentication processes a user can undertake
    operation:string
};
//
//Keys of the credentials
type key = keyof credentials;
//
//Dirty credentials
type dirty<data extends{[i in keyof data]:data[i]}> = {[i in keyof data]:data[i]|null| Error};
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
class registration extends view{
    //
    //The key to the user in the local_storage. The key value is a son string of
    //Iuser. You can convert to a user by creating a new one
    static current_user:string = '___user';
    //
    //Allows for instantiation of the class 
    constructor(public business?:string){
        //
        super();
    }
    //
    //Coordinate the various registration processes based on the operation
    //that the user selected. We first create a dialog that will collect the data from
    //the user then check the field operation to determine which process was 
    //selected by the user and carry out the relevant operation
    public async administer():Promise<user | undefined | Error>{
        //
        //Create a dialog to collect data from the user
        const enroll = new enrollment(this.document.body);
        //
        //Get data form the dialog
        const data: credentials | undefined = await enroll.administer();
        //
        //If the data collection process was aborted discontinue the process
        if(!data) return;      
    }
    //
    //
    private forgot_password(data:credentials):user{
        //
        //
    }
    //
    //
    private change_password(data:credentials):user{
        //
        //
    }
    //
    //
    public update_details():user{
        //
        //
    }
    //
    //Remove the errors when changes are made to form input elements
    public on_input():void{
        //
        //Get the elements with class 'error' then remove the error message
        const errors = this.document.querySelectorAll('.error');
        //
        //Clear any error messages on the form
        errors.forEach(error=>error.textContent='');
    }
    //
    //Show and hide the password 
    public show_password():void{
        //
        //Get the checkbox which when checked, the password readable text
        //and when unchecked the password is not readable
        const show_element = this.get_element('show_password')as HTMLInputElement;
        //
        //Access the input element responsible for collecting the password
        const password_element = this.document.querySelector('input[type=password]') as HTMLInputElement;
        //
        //Listen in on the checkbox for any changes 
        show_element.addEventListener("change", ()=>{
            //
            //make the password readable and unreadable depending on the checkbox state
            if(show_element.checked)password_element.type = "text";            
            else password_element.type = "password";
        });
    }
    //
    //Retrieve the current logged in user and remove the user from the window storage
    public logout():void{
        //
        //Exit the function if there's no user logged in
        if(!(this.get_current_user())) return;
        //
        //Clear the current user from teh local storage
        window.localStorage.removeItem(registration.current_user);
    }
    //
    //Get the user that is existing in the window storage, that is, the user 
    //that is currently logged in otherwise return undefined if there's no user 
    //that is logged in
    public get_current_user():user|undefined{
        //
        //Check that the local storage has someone logged in.
        const Iuser_str:string|null = window.localStorage.getItem(registration.current_user);
        //
        //If no one is logged in, return undefined
        if (!Iuser_str) return undefined;
        //
        //There's someone logged in, convert the user string to an Iuser
        const Iuser:Iuser = JSON.parse(Iuser_str);
        //
        //Creae a new user
        return new user(Iuser.name, Iuser.pk);
    }
}
//
//This is the dialog that will help in collection of the user data for driving the
//registration process
class enrollment extends dialog<credentials>{
    //
    //Reference to the user that has logged in 
    public user?:user;
    //
    constructor(anchor:HTMLElement){
        //
        //Initialize the dialog with the given fragment and anchor
        super({url:"/registration/v/code/registration.html",anchor});
    }
    //
    //Extract data from the registration form as it is with possibility for errors
    //The dialog system will take care of the error checks and targeted reporting 
    public async read():Promise<raw<credentials>>{
        //
        //Compile the raw credentials by geting the inputs directly form the form
        //
        //Whatever we read from the enrollment dialog changes depending on the operation.
        //In that when the user selects sign in and sign up we require the user name,
        //email and password and if the user selects forgot password we are required to
        //collect the username and email
        //
        //
        return {
            type:'credentials',
            username:this.get_value('username'),
            password:this.get_value('password'),
            email: this.get_value('email'),
            operation:this.get_value('operation'),
        }
    }
    //
    //We have no data to populate in the registration system
    public populate(data:credentials):void{}
    //
    //
    public async save(input:credentials):Promise<"ok" | Error>{
        //
        //Create an instance of the outlook class that would handle the authentication
        //and registration processes
        const Outlook = new outlook(input.username, input.password);
        //
        //Using the data collected select appropriate operation to conduct
        switch (input.operation){
            //
            //Handle the registation of new users 
            case 'up': return await this.sign_up(Outlook);
            //
            //Here we handle authentication of exsistent users before allowing them
            //to access offerd services
            case 'in': return await this.sign_in(Outlook);
            //
            //This process generates a temporary password for the user to use before changing
            //incase he/she has forgoten the pasword
            //?????????? Here the password is not mandatory since the user has 
            //forgotten his/her password ???????????????????
            case 'forgot': return this.forgot_password(input);
            //
            //This handles the process of changing the user password on the database
            //A user who has forgotten his/her password cannot change the password
            //this is a viable solution only to users who know their current password
            case 'change': return this.change_password(input);
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
    public async sign_in(/*data:credentials,*/ auth:outlook):Promise<"ok" | Error>{
        //
        //Authenticate the user 
        const user:user | Error = await auth.authenticate_user();
        //
        //Incase there was a problem with the process return the error that was gotten
        if(user instanceof Error) return user;
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
    public async sign_up(auth:outlook):Promise<"ok" | Error>{
        //
        //Register the user 
        const user:user | Error = await auth.register_user();
        //
        //Incase there was a problem with the process return the error that was gotten
        if(user instanceof Error) return user;
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

