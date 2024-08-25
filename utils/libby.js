import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

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
export const paginate = async (model, filter, page = 1, limit = 10) => {
  //have to discus with frontend team to know how much data they want to fetch each time
  try {
      // Calculate the number of documents to skip
      const skip = (page - 1) * limit;

      // Get total user count for pagination info
      const totalItems = await model.countDocuments(filter);

      // Calculate total pages based on total items
      const totalPages = Math.ceil(totalItems / limit);

      // Fetch paginated items from the database
      const items = await model.find(filter).skip(skip).limit(limit);

      return {
          items,
          totalItems,
          totalPages,
          currentPage: page,
      };
  } catch (error) {
      throw new Error('Error in pagination: ' + error.message);
  }
};



