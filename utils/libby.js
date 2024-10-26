import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Class from "../models/class.model.js";

import fs from "fs";

dotenv.config();

// you can format the response
export const fMsg = (res, msg, result = {}, statusCode = 200) => {
    return res.status(statusCode).json({ con: true, msg, result });
};

export const fError = (res, msg, statusCode = 500) => {
    return res.status(statusCode).json({ con: false, msg});
};

//you can encode the password
export const encode = (payload) => {
    return bcrypt.hashSync(payload, 10);
};

//you can decode the password
export const decode = (payload, hash) => {
    return bcrypt.compareSync(payload, hash);
};

//you can generate JWT the token
export const genToken = (payload) =>
    jwt.sign(
        {
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            data: payload,
        },
        process.env.SECRET_KEY
    );

// utils/pagination.js
export const paginate = async (model, filter, page = 1, limit = 10, sortField = null, populate = []) => {
    try {
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Get total user count for pagination info
        const totalItems = await model.countDocuments(filter);

        // Calculate total pages based on total items
        const totalPages = Math.ceil(totalItems / limit);

        // Query to paginate items from the database
        let query = model.find(filter).skip(skip).limit(limit);

        // Apply sorting if a sortField is provided
        if (sortField) {
            query = query.sort({ [sortField]: -1 }); // Sort by the provided field (descending)
        }

        // Apply populate if provided
        if (populate.length > 0) {
            populate.forEach(pop => {
                query = query.populate(pop);
            });
        }

        // Execute the query and get the items
        const items = await query;

        return {
            items,
            totalItems,
            totalPages,
            currentPage: page,
        };
    } catch (error) {
        throw new Error("Error in pagination: " + error.message);
    }
};

export const paginateAnnouncements = ( announcementDoc, page = 1, limit = 10) => {
    try {
        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Calculate total items and pages
        const totalItems = announcementDoc[0].announcements.length;
        const totalPages = Math.ceil(totalItems / limit);

        // Slice announcements for pagination
        const paginatedAnnouncements = announcementDoc[0].announcements.slice(skip, skip + limit);
        return {
            items: paginatedAnnouncements,
            totalItems,
            totalPages,
            currentPage: page,
        };
    } catch (error) {
        throw new Error("Error in pagination: " + error.message);
    }
};



// generate random class code with 4 digits
export const generateClassCode = (length) => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const charactersLength = characters.length;
    let counter = 0;
    let result = "";
    while (counter < length) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
        counter += 1;
    }
    return result;
};

export const checkArray = (array, item) => {
    
    if(array == []){
        return false;
    }
    let duplicate = false;
      //this block checks whether the teacher is responsible for the class
      while(duplicate == false){
        //change into for loop
        array.forEach((eachItem) => {
          if(eachItem.toString() === item.toString()){
            duplicate = true;
          }
        })
        if(duplicate != true){
          return false;
        }
      }
      return true;
}


// for web user interface   
// This function generates a JSON Web Token (JWT) for a given user_id and sets it as a cookie in the response.
export const generateTokenAndSetCookie = (res, user_id) => {
    // Sign a JWT with the user_id and a secret key, set to expire in 30 days.
    const token = jwt.sign({ id: user_id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
    // Set the JWT as a cookie in the response, with security features to prevent XSS and ensure it's sent over HTTPS in development.
    res.cookie('jwt', token, {
        httpOnly: true, // prevent XSS
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        secure: process.env.NODE_ENV === 'development',
    });
};