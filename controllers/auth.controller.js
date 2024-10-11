import path from "path";

import User from "../models/user.model.js";

import { encode, genToken, fMsg, decode, fError } from "../utils/libby.js";
import { UserSchema } from "../utils/schema.js";
import Token from "../models/token.model.js";

export const register = async (req, res, next) => {
    try {
        let {
            userName,
            email,
            password,
            phone,
            confirmedPassword,
            roles,
            ...otherInfos
        } = req.body;

        const findEmail = await User.findOne({ email });
        const findPhone = await User.findOne({ phone });
        if (findEmail) {
            return fError(res, "Email already exists", 409);
        }
        if (findPhone) {
            return fError(res, "Phone number already exists", 409);
        }

        if (password !== confirmedPassword) {
            return fError(res, "Passwords do not match", 400);
        }

        const hashedPassword = encode(password);

        const newUser = {
            userName,
            email,
            password: hashedPassword,
            phone,
            roles,
            ...otherInfos,
        };

        const user = await User.create(newUser);
        user.profilePicture = `https://ysffgebnlbingizxsbvx.supabase.co/storage/v1/object/public/profile-pictures/default%20%20jpg.jpg`;
        await user.save();

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        const toEncrypt = {
            _id: user._id,
            roles: user.roles,
            email: user.email,
        };

        const token = genToken(toEncrypt);

        fMsg(
            res,
            "Registered Successfully",
            { user: userWithoutPassword, token },
            200
        );
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const login = async (req, res, next) => {
    // Handles user login by verifying email and password
    try {
        const { email, password } = req.body;

        // if the email or password is not provided, return an error message
        //might delete later if the front end can handle the error message
        if (!email || !password) {
            return next(new Error("Email and password are required"));
        }

        //search the user in the database by email
        const user = await User.findOne({ email })
                .populate("classes", "className grade")
                .populate({
                    path: "childern", 
                    select: "name",
                    populate: {
                        path: "classes",
                        select: "className grade"
                    }
                });
                
        if (!user) {
            return next(new Error("Invalid username or password"));
        }

        //check if the password is correct and decode the password
        const isMatch = decode(password, user.password);

        if (!isMatch) {
            return next(new Error("Invalid username or password"));
        }

        // this is to encrypt the user id and create a token
        const toEncrypt = {
            _id: user._id,
            roles: user.roles,
            email: user.email,
        };

        //this is to create a token
        const token = genToken(toEncrypt);

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,  // Secure should be true in production (HTTPS)
            sameSite: 'lax',  // Required for cross-site requests when using credentials
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        // destructure the user object to remove the password field
        const { password: _, ...userInfo } = user.toObject();
        
        let logins = await Token.find({
            userId: user._id
        });

        //this will be uncommented once the user session problem has bbeen  
        let numberOfLogins;
        if(logins.length < 3){
            numberOfLogins = logins.length +1;
        }else{
            return fError(res, "You can't login with more than three devices")
        }
            

        const newTokenRegisteration = {
            userId: user._id,
            name: user.userName,
            token,
            // attempt: numberOfLogins
        };

        await Token.create(newTokenRegisteration)

        //this is to send the response and token to the client-frontend and save in local storage
        fMsg(res, "Login Successfully", { userInfo, token }, 200);
    } catch (error) {
        console.log(error)
        next(error);
    }
};

export const passwordReset = async (req, res, next) => {
    try {
        const { email, newPassword } = req.body;

        if (!email.trim() || !newPassword.trim()) {
            return next(new Error("All fields are required"));
        }
        const user = await User.findOne({ email });

        if (!user) {
            return next(new Error("User not found"));
        }

        const hashedPassword = encode(newPassword);

        await User.updateOne({ email }, { password: hashedPassword });

        fMsg(res, "Password reset successful", "Password has been reset", 200);
    } catch (error) {
        next(error);
    }
};

export const changePassword = async (req, res, next) => {
    try {
        const { email } = req.user;

        const { oldPassword, newPassword, confirmedNewPassword } = req.body;

        //might delete later if the front end can handle the error message
        if (
            !email.trim() ||
            !oldPassword.trim() ||
            !newPassword.trim() ||
            !confirmedNewPassword.trim()
        ) {
            return next(new Error("All fields are required"));
        }

        //might delete later if the front end can handle the error message
        if (newPassword !== confirmedNewPassword) {
            return next(
                new Error(
                    "New password and confirmed new password do not match"
                )
            );
        }

        const user = await User.findOne({ email });
        if (!user) {
            return next(new Error("User not found"));
        }

        const isMatch = decode(oldPassword, user.password);

        if (!isMatch) {
            return next(new Error("Invalid old password"));
        }

        if (newPassword !== confirmedNewPassword) {
            return next(
                new Error(
                    "New password and confirmed new password do not match"
                )
            );
        }

        //might delete later if the front end can handle the error message
        if (newPassword === oldPassword) {
            return next(
                new Error("New password and old password are the same")
            );
        }

        const hashedPassword = encode(newPassword);

        await User.updateOne({ email }, { password: hashedPassword });

        fMsg(
            res,
            "Password change successful",
            "Password has been changed",
            200
        );
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res) => {
    try {
        // Since JWT is stateless, we don't need to invalidate the token on the server
        // The actual "logout" happens on the client-side by removing the token
        // For now, we'll just send a success message
        const user = await User.findById(req.user._id)
        let token = req.headers.authorization.split(" ")[1];
        let deletedToken = await Token.findOneAndDelete({token})

        if(!deletedToken)
            return fError(res, "User has already signed out or their session got expired ", 505)

        fMsg(res, "Logout successful", "User has been logged out", 200);
    } catch (error) {
        next(error);
    }
};

//note
//acutually we dont have to generate token for both login and register, it may depend on the workflow of UI but discuss later ..But i have created both but will delete one base on discussion

//note


// api for web start here

export const webRegister = async (req, res, next) => {
    try {
        let {
            userName,
            email,
            password,
            phone,
            confirmedPassword,
            roles,
            ...otherInfos
        } = req.body;

        const findEmail = await User.findOne({ email });
        const findPhone = await User.findOne({ phone });
        if (findEmail) {
            return fError(res, "Email already exists", 409);
        }
        if (findPhone) {
            return fError(res, "Phone number already exists", 409);
        }

        if (password !== confirmedPassword) {
            return fError(res, "Passwords do not match", 400);
        }

        const hashedPassword = encode(password);

        const newUser = {
            userName,
            email,
            password: hashedPassword,
            phone,
            roles,
            ...otherInfos,
        };


        const user = await User.create(newUser);
        user.profilePicture = `https://ysffgebnlbingizxsbvx.supabase.co/storage/v1/object/public/profile-pictures/default%20%20jpg.jpg`;
        await user.save();

        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        // this is to encrypt the user id and create a token
        const toEncrypt = {
            _id: user._id,
            roles: user.roles,
            email: user.email,
        };

        //this is to create a token
        const token = genToken(toEncrypt);

        fMsg(
            res,
            "Registered Successfully",
            { user: userWithoutPassword, token },
            200
        );
    } catch (error) {
        console.log(error);
        next(error);
    }
};
