//
//Access the user class to use it as a data type
import { user, Iuser, business } from '../../../outlook/v/code/app.js';
//
//To access the registration ad authentication services
import { outlook } from '../../../outlook/v/code/login.js';
//
//Access the better error reporting method
import { database } from '../../../schema/v/code/schema.js';
//
//Import server library
import * as server from '../../../schema/v/code/server.js';
//
//To help in error reporting
import { mutall_error } from '../../../schema/v/code/schema.js';
//
//Use the dialog class to help in data collection
import { dialog, raw } from '../../../mashamba/v/code/dialog.js';
//
//Help to implement DOM manipulation methods
import { view } from '../../../outlook/v/code/view.js';
//
//The data being collected for user authentication
type credentials = {
    type: 'credentials';
    //
    //The primary data that idendifies a user
    username: string;
    password: string;
    //
    //The authentication processes a user can undertake
    operation: string;
};
//
//Handle membership infomation of a given user from the database
interface Imembership {
    //
    //The primary key of the member
    member: number;
    //
    //A collection of all the businesses a member is involved with
    business: Array<business>;
}
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
    //
    //The key to the user in the local_storage. The key value is a son string of
    //Iuser. You can convert to a user by creating a new one
    static current_user: string = '___user';
    //
    //Allows for instantiation of the class
    constructor(public business?: string) {
        //
        super();
    }
    //
    //Coordinate the various registration processes based on the operation
    //that the user selected. We first create a dialog that will collect the data from
    //the user then check the field operation to determine which process was
    //selected by the user and carry out the relevant operation
    public async administer(): Promise<user | undefined> {
        //
        //Create a dialog to collect data from the user
        const enroll = new enrollment(this.document.body);
        //
        //Using the dilog handle the registration process
        await enroll.administer();
        //
        //Ensure that the user is there if absent assume that there was an issue
        //and discontinue the process
        if (!enroll.user) return undefined;
        //
        //When we get here the user authentication was successful
        //We need to establish all the businesses a user is associated with in the database
        let businesses: Array<business> | null = await this.get_businesses(enroll.user);
        //
        //If the user is not registerd as a member of any business
        //Ask him or her to select all the businesses that he/her is involved with and save them to the db
        if (!businesses) businesses = await this.save_user_businesses(enroll.user);
        //
        //After saving the businesses check to see if this registration process was invoked form a given business
        if (this.business) {
            //
            //If the user is a member of the business that launched the registration system record the business details
            //of the business to associate the user with the business in the current login session
            if (businesses.find((business) => business.id === this.business))
                return this.set_business(enroll.user, this.business);
            //
            //If the user is not a member of the business we ask him to register for the given business
            //by showing the business registration dialog box
            this.save_user_businesses(enroll.user);
        }
        //
        //Ask the user which business should be linked with the current log in session
        //Return the user with the business included
        return this.select_business(enroll.user);
    }
    //
    //Get All the businesses in the database that a given user is a member of
    //Formulate a query that returns all the businesses that the given user is involved with
    //Execute the query to retrieve the data.
    async get_businesses(User: user): Promise<Array<business>| null> {
        //
        //THis is the sql to get all the
        const sql: string = `
            SELECT 
                user.user,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        "id",
                        business.id,
                        "name",
                        business.name
                    )
                ) AS businesses
            FROM 
                member 
                INNER JOIN user ON member.user = user.user 
                INNER JOIN business ON member.business = business.business
            WHERE user.user = ${User.pk}
            GROUP BY user.user;
        `;
        //
        //Execute the query using the library
        const results: Array<{user:number, businesses:string}> = await server.exec(
            'database',
            ['mutall_users',false],
            'get_sql_data',
            [sql]
        );
        //
        //Ensure that a user was retrieved 
        if (results.length === 0) 
            throw new mutall_error(`We found no such user in the database!!`);
        //
        //Ensure that only one user
        if (results.length > 1) 
            throw new mutall_error(`We expected only one user but got ${results.length}`);
        //
        //return the user membership infomation 
        return JSON.parse(results[0].businesses);
    }
    //
    //Open a dialog that will be used to get all the registared businesses that a 
    //user is involved with. 
    //Out of this process you get out with an Array of businesses or the programm
    //crash
    private async save_user_businesses(user: user): Promise<Array<business>>{
        //
        //Create an instance of the business registration dialog
        const dlg = new business_registration(user);
        //
        //Show the dialog to initiate the data collection process
        const results: Array<business>| undefined = await dlg.administer();
        //
        //Check to see if the user finished the business registration process
        //returning the results of the process incase of success
        if(results) return results;
        //
        //Crash the program if the user did not register businesses 
        throw new mutall_error("You must registar the businesses you are a member of");
    }
    //
    //Show and hide the password
    public show_password(): void {
        //
        //Get the checkbox which when checked, the password readable text
        //and when unchecked the password is not readable
        const show_element = this.get_element('show_password') as HTMLInputElement;
        //
        //Access the input element responsible for collecting the password
        const password_element = this.document.querySelector(
            'input[type=password]'
        ) as HTMLInputElement;
        //
        //Listen in on the checkbox for any changes
        show_element.addEventListener('change', () => {
            //
            //make the password readable and unreadable depending on the checkbox state
            if (show_element.checked) password_element.type = 'text';
            else password_element.type = 'password';
        });
    }
    //
    //Retrieve the current logged in user and remove the user from the window storage
    public logout(): void {
        //
        //Exit the function if there's no user logged in
        if (!this.get_current_user()) return;
        //
        //Clear the current user from teh local storage
        window.localStorage.removeItem(registration.current_user);
    }
    //
    //Get the user that is existing in the window storage, that is, the user
    //that is currently logged in otherwise return undefined if there's no user
    //that is logged in
    public get_current_user(): user | undefined {
        //
        //Check that the local storage has someone logged in.
        const Iuser_str: string | null = window.localStorage.getItem(registration.current_user);
        //
        //If no one is logged in, return undefined
        if (!Iuser_str) return undefined;
        //
        //There's someone logged in, convert the user string to an Iuser
        const Iuser: Iuser = JSON.parse(Iuser_str);
        //
        //Creae a new user
        return new user(Iuser.name, Iuser.pk);
    }
}
//
//This is the dialog that will help in collection of the user data for driving the
//registration process
class enrollment extends dialog<credentials> {
    //
    //Reference to the user that has logged in
    public user?: user;
    //
    constructor(anchor: HTMLElement) {
        //
        //Initialize the dialog with the given fragment and anchor
        super(anchor, undefined, true, '/registration/v/code/registration.html');
    }
    //
    //Extract data from the registration form as it is with possibility for errors
    //The dialog system will take care of the error checks and targeted reporting
    public async read(): Promise<raw<credentials>> {
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
    public async save(input: credentials): Promise<'Ok' | Error> {
        //
        //Create an instance of the outlook class that would handle the authentication
        //and registration processes
        const Outlook: outlook = new outlook(input.username, input.password);
        //
        //Using the data collected select appropriate operation to conduct
        switch (input.operation) {
            //
            //Handle the registation of new users
            case 'up':
                return await this.sign_up(Outlook);
            //
            //Here we handle authentication of exsistent users before allowing them
            //to access offerd services
            case 'in':
                return await this.sign_in(Outlook);
            //
            //It is very difficult to reach at this point without selecting an opperation
            //The dialog system will have alredy informed the user during data collection
            //that he cannot proceed without selection of an operation since it is required
            default:
                return new mutall_error('Please select an operation');
        }
    }
    //
    //Using the outlook instance given acces the authentication service
    //The result of a succesfull authentication process is a user otherwise an error
    //The user details are stored in the local storage and also returned if the
    //???????????? We are not using the credentials at this point
    public async sign_in(auth: outlook): Promise<'Ok' | Error> {
        //
        //Authenticate the user
        const user: user | Error = await auth.authenticate_user();
        //
        //Incase there was a problem with the process return the error that was gotten
        if (user instanceof Error) return user;
        //
        //At this point we know that the user was succesfully authenticated
        //We then store the user both in the local storage and as a property
        this.user = user;
        //
        window.localStorage.setItem(registration.current_user, JSON.stringify(user));
        //
        //Finally return ok to indicate that the authentication process was succesfull
        return 'Ok';
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
    public async sign_up(auth: outlook): Promise<'Ok' | Error> {
        //
        //Register the user
        const user: user | Error = await auth.register_user();
        //
        //Incase there was a problem with the process return the error that was gotten
        if (user instanceof Error) return user;
        //
        //At this point we know that the user was succesfully registered
        //We then store the user both in the local storage and as a property
        this.user = user;
        //
        window.localStorage.setItem(registration.current_user, JSON.stringify(user));
        //
        //Finally return ok to indicate that the authentication process was succesfull
        return 'Ok';
    }
}
//
//Drive the business registartion process using the bellow class
//This is a dialog that gets the businesses a user is involved with and 
//save the user as a member to the businesses
class business_registration extends dialog<Array<business>>{
    //
    //Usefull for creation of instances of this class
    //To successfully do business registation we need to know which user is doing
    //the business registration. This infomation is helpfull in saving to the db
    constructor(public user:user){
        //
        //initialize an instance of the parent
        super();
    }
    //
    //Get the input form the form for saving 
    async read():Promise<Array<business>>{
        //
        //
    }
    //
    //Create member for the selected number of businesses
    //Given the businesses of a given user we need to record the selected businesses
    //to the database here we use 
    async save(Input:Array<business>): Promise<Error | "Ok">{
        //
        //
    }
    //
    //This is the final chance to influence the form appearance
    //Here the goal is to paint my form with dynamic content from the db
    public async onopen():Promise<void>{
        //
        //Formulate a querry to get all businesses in the database
        const sql:string = "SELECT business, id, name FROM business";
        //
        //Get the businesses from the database
        const results: Array<{
            business:number, 
            id:string, 
            name: string
        }> = await server.exec(
            "database",
            ["mutall_user", false],
            "get_sql_data",
            [sql]
        );
        //
        //Create an evelope for all the checkboxes
        const env: HTMLLabelElement = this.create_element("label", this.proxy, {id:`business`});
        //
        //Iterate over the businesses creating a checkbox for each
        results.forEach(result => {
            //
            //Create the acctual checkbox?????????
            this.create_element("input", env, {
                type:"checkbox",
                textContent: result.name,
                value: result.id
            });
        })
        //
        //Create a error reporting section 
        this.create_element("span", env, {id: "report", className:"error"});
        //
        //Finall create the buttons for driving the data collection process
        //
        //submit
        this.create_element("button", this.proxy,{id:"submit", textContent:"submit"});
        //
        //cancel
        this.create_element("button", this.proxy,{id:"cancel", textContent:"cancel"});
    }
}
