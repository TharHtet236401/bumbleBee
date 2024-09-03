import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Class from "../models/class.model.js";

import fs from "fs";

dotenv.config();

// you can format the response
export const fMsg = (res, msg, result = {}, statusCode = 200) => {
    res.status(statusCode).json({ con: true, msg, result });
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


export const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file: ${filePath}`, err);
        } else {
            console.log(`File deleted: ${filePath}`);
        }
    });
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
