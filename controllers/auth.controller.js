import User from "../models/user.model.js";
import { encode, genToken, fMsg, decode } from "../utils/libby.js";

export const register = async (req, res) => {
    // Handles user registration by creating a new user in the database
    try {
        const {
            userName,
            email,
            password,
            phone,
            confirmPassword,
            roles,
            relationship,
        } = req.body;

        if (password !== confirmPassword) {
            return fMsg(res, "Registration failed", "Passwords do not match", 400);
        }

        //you can use bcrypt to hash the password that encode function can be found in utils/libby.js
        const hashedPassword = encode(password);

        //construct the new user object
        const newUser = {
            userName,
            email,
            password: hashedPassword,
            phone,
            roles,
            relationship,
        };

        //save the new user to the database
        const user = await User.create(newUser);

        //this is to encrypt the user id and create a token
        const toEncrypt = {
            _id: user._id,
            roles: user.roles,
            email: user.email,
            schools: user.schools,
            classes: user.classes,
            username: user.userName
        };

        //this is to create a token
        const token = genToken(toEncrypt);
        
        //this is to send the response and token to the client-frontend and save in local storage
        fMsg(res, "Registered Successfully", { user, token }, 201);
    } catch (error) {
        fMsg(res, "Registration failed", error.message, 500);
    }
};

export const login = async (req, res) => {
    // Handles user login by verifying email and password
    try {
        const { email, password } = req.body;

        // if the email or password is not provided, return an error message
        if (!email || !password) {
            return fMsg(res, "Login failed", "Email and password are required", 400);
        }

        //search the user in the database by email
        const user = await User.findOne({ email });
        if (!user) {
            return fMsg(res, "Login failed", "Invalid username or password", 404);
        }

        //check if the password is correct and decode the password
        const isMatch = decode(password, user.password);

        if (!isMatch) {
            return fMsg(res, "Login failed", "Invalid username or password", 400);
        }

        // this is to encrypt the user id and create a token
        const toEncrypt = {
            _id: user._id,
            roles: user.roles,
            email: user.email,
            schools: user.schools,
            classes: user.classes,
            username: user.userName
        };

        //this is to create a token
        const token = genToken(toEncrypt);

        //this is to send the response and token to the client-frontend and save in local storage
        fMsg(res, "Login Successfully", { user, token }, 200);
    } catch (error) {
        fMsg(res, "Login failed", error.message, 500);
    }
};

//note
//acutually we dont have to generate token for both login and register, it may depend on the workflow of UI but discuss later ..But i have created both but will delete one base on discussion
