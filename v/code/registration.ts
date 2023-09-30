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
//The data being collected for user authentication
type credentials = {
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
//
//A popup-based class that is to be exported as a module in order to
//access registration services
export class registration extends popup<user>{
    //
    //The key to the user in the local_storage. The key value is a son string of
    //Iuser. You can convert to a user by creating a new one
    static current_user:string = '___user';
    //
    //Allows for instantiation of the class 
    constructor(){
        //
        //Use the registration html file to populate the popup
        super("/registration/v/code/registration.html");
    }
    //
    //Intervene in show pannels so that we can present the form from its normal
    //behavior
    public async show_panels(): Promise<void>{
        //
        await super.show_panels();
        //
        //Prevent the form from submitting data, as we want to take charge instead
        this.get_element('login_form').onsubmit =(e)=>e.preventDefault();
    }    
    //
    //Implement the required check method. It checks all the user inputs
    //and returns true if they are all valid; otherwise false.
    //It also saves the the user to the local storage, for use by other applications
    public async check():Promise<boolean>{
        //
        //Collect the signing credentials, with all its dirt
        const Credentials:dirty<credentials> = {
            username:this.get_value('username'),
            password:this.get_value('password'),
            email: this.get_value('email'),
            operation:this.get_value('operation'),
        }
        //
        //Get the keys of the credentials
        const keys =<Array<key>>Object.keys(Credentials);
        //
        //Check that the inputs all valid, i.e., neither null nor erroneous. 
        const dirty_keys = keys.filter((k)=>(typeof Credentials[k]!=='string'));
        //
        //If any of of the key values is dirty, the report them in the popup 
        //and return false
        if (dirty_keys.length>0){
            //
            //Report the dirty keys
            dirty_keys.forEach(key => this.report_inconsistencies(key, Credentials));    
            //
            //Do not continue
            return false;
        }     
        //
        //Use the credentials to authenticate the visiting user
        const {username, password, operation} = Credentials as credentials;
        //
        //2. Test if the user is new or old. If new, sign up; otherwise sign in
        //
        //2.1 Define the user that we will eventually to return
        let new_user:user|Error;
        //
        //Check if the user forgot password
        if(operation ==='forgot'){}
        //
        //2.2 Create the outlook provider to access sign-up or sign-in services
        const Outlook = new outlook(username, password);
        //
        //2.3 Now do the authentication
        if(operation==='up')  new_user = await Outlook.register_user();
        else  new_user = await Outlook.authenticate_user();
        //
        //Handle the signing errors.
        if (new_user instanceof Error) {
            //
            //Use the dialog to handle the error
            this.get_element('report').textContent = new_user.message;
            //
            //Stop this signing
            return false;
        }
        this.result= new_user;
        //
        //Save the user to the local storage
        window.localStorage.setItem(registration.current_user, JSON.stringify(new_user));
        //
        //if the authentication is valid return tue otherwise report the 
        //problem and return false.
        return true;
    }
    //
    //Handle reporting of the errors
    private report_inconsistencies(key:key, credentials: dirty<credentials>){
        //
        //The key must be pointing to an error
        const msg = (<Error> credentials[key]).message;
        //
        //Report the error message
        this.report_error(key, msg);
    }   
    //
    //
    public async get_result():Promise<user>{
        //
        //test if the result is set; if no you have a problem
        if (this.result===undefined) throw 'Result is not set yet';
        //
        return this.result;
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
        })
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
    //If a user forgets their password generate a temporary password,
    //hash the password and modify the database to reflect the changed password
    //then send this temporary password to the users email 
    public async forgot_password():Promise<void> {
        //
        //Get the username of the user and the email
        const {username, email} = this.get_user(); 
        //
        //Use the fetch to communicate with the php
        const response:Response =await fetch("./registartion.php",{
            method:'POST',
            body: JSON.stringify({username,email}),
            headers:{
                "Content-Type": "application/json"
            }
        });
        //
        //Check if the request was succesfull
        if (!response.ok) 
            throw new mutall_error("Problems communicating with the server");
        //
        //Extract the result of the server operation
        const result: "ok" | string = await response.text();
        //
        //If the operation was succesfull inform the user to check the mail for a new password
        if (result !== "ok") this.report_error("report", result);
        else this.report_error("report",`Temporary password succesfylly sent to ${email}. Check you inbox.`)
    }
    //
    //Collect the data form the registration/ log-in form using 
    private get_user():dirty<{username: string; email: string}>{
        //
        //Get the raw username from the user as it is with possibility of errors
        const username:string| Error | null= this.get_value('username');
        //
        //Get the email of from the user
        const email:string| Error | null  = this.get_value('email');
        //
        return {username,email};
    }
    //
    //Get the old(temporary) password and the new password form the user 
    //Verify that both fields are filled and the old password corresponds 
    //to what is there in the database and only then can we proceed with actual 
    //changing of the password (Hashing the new password and modifying the user record in the db)
    public change_password(): void{
        //
        //Wait for the user to input the two passwords and intiate the process
        //
        //
        //
        //
    }
}
