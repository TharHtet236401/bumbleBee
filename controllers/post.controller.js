import Post from "../models/post.model.js";
import mongoose from "mongoose";
import {
    fMsg,
    paginate,
    paginateAnnouncements,
    fError,
} from "../utils/libby.js";

import Class from "../models/class.model.js";
import User from "../models/user.model.js";
import initializeSupabase from "../config/connectSupaBase.js";
import dotenv from "dotenv";
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
  uploadDocumentToSupabase,
  deleteDocumentFromSupabase,
  uploadMultipleDocumentsToSupabase,
} from "../utils/supabaseUpload.js";

dotenv.config();





export const createPost = async (req, res, next) => {
  try {
    const {
      heading,
      body,
      contentType,
      reactions,
      gradeName, // Changed from grade to gradeName
      className,
    } = req.body;

        const posted_by = req.user._id;
        const userObject = await User.findById(posted_by);

    let classId = null;
    if (contentType === "announcement") {
      const classExists = await Class.findOne({
        grade: gradeName,
        className: className,
        school: userObject.schools[0],
      });

      if(contentType === "feed" && userObject.roles.includes("teacher")){
        return fError(res, "You are not authorized to create feeds", 401);
      }

      if (!classExists) {
        return next(new Error("Class not found"));
      }

      if (!userObject.classes.includes(classExists._id) && !userObject.roles.includes("admin")) {
        return next(new Error("You are not registered in this class"));
      }
      classId = classExists._id;
    }

    let contentPictures = []; // Ensure this is initialized
    let documents = [];

    // Handle contentPictures upload
    if (req.files && req.files.contentPictures) { // Check if contentPictures are present
      try {
        for (const file of req.files.contentPictures) {
          const contentPictureUrl = await uploadImageToSupabase(file, "posts");
          contentPictures.push(contentPictureUrl); // Save the URL to the array
        }
      } catch (uploadError) {
        return next(new Error(`File upload failed: ${uploadError.message}`));
      }
    } else {
      console.warn("No content pictures uploaded."); // Log if no images are uploaded
    }

    // Handle documents upload
    if (req.files && req.files.documents) {
      try {
        for (const file of req.files.documents) {
          const documentUrl = await uploadDocumentToSupabase(file, "documents");
          documents.push(documentUrl);
        }
      } catch (uploadError) {
        return next(new Error(`Document upload failed: ${uploadError.message}`));
      }
    }

    const post = new Post({
      posted_by,
      heading,
      body,
      contentPictures, // Ensure this is being populated correctly
      contentType,
      reactions,
      classId,
      schoolId:userObject.schools[0],
      documents,
    });

    try {
      await post.save(); // Save the post to the database
    } catch (saveError) {
      console.error("Error saving post:", saveError);
      return next(new Error("Failed to save post"));
    }

    await post.populate("posted_by", "userName profilePicture roles");

    if (contentType === "announcement" && classId) {
      await Class.findByIdAndUpdate(
        classId,
        { $push: { announcements: post._id } },
        { new: true }
      );

      
    }

    fMsg(res, "Post created successfully", post, 200);
  } catch (error) {
    console.error("Detailed error in createPost:", error);
    next(error);
  }
};

export const getPosts = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const userInfo = await User.findById(userId, "schools").lean();

        const schoolIds = userInfo.schools;

        const query = {
            schoolId: { $in: schoolIds },
        };

        const page = parseInt(req.query.page) || 1;

        const sortField = "createdAt";

        const populate = { posted_by: "userName profilePicture roles", schoolId: "schoolName"};

        const populateString = Object.entries(populate).map(
            ([path, select]) => ({
                path,
                select,
            })
        );

        const paginatedFeeds = await paginate(
            Post,
            query,
            page,
            10,
            sortField,
            populateString
        );
        // console.log(paginatedFeeds)
        fMsg(res, "Posts fetched successfully", paginatedFeeds, 200);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
};

export const getFeeds = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const userInfo = await User.findById(userId, "schools").lean();

        const schoolIds = userInfo.schools;
        const type = "feed";

        const query = {
            schoolId: { $in: schoolIds },
            contentType: type,
        };

        const page = parseInt(req.query.page) || 1;

        const sortField = "createdAt";

        const populate = { posted_by: "userName profilePicture roles", schoolId: "schoolName"};

        const populateString = Object.entries(populate).map(
            ([path, select]) => ({
                path,
                select,
            })
        );

        const paginatedFeeds = await paginate(
            Post,
            query,
            page,
            10,
            sortField,
            populateString
        );

        fMsg(res, "Posts fetched successfully", paginatedFeeds, 200);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getAnnouncements = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const userInfo = await User.findById(userId, "classes").lean();

        const classes = userInfo.classes;

        if (classes.length == 0) {
            return next(new Error("No classes registered for you"));
        }

        const query = {
            _id: { $in: classes },
        };

        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const totalClasses = await Class.countDocuments(query);

        const announcements = await Class.find(query, "announcements")
            .sort({ createdAt: -1 })
            .populate({
                path: "announcements",
                select: "-_id", // Exclude the _id field
                populate: {
                    path: "posted_by",
                    select: "userName profilePicture roles",
                },
                populate: {
                  path: "schoolId",
                  select: "schoolName"
                }
            })
            .lean();

        // Flatten the announcements array
        const allAnnouncements = announcements.flatMap(
            (classDoc) => classDoc.announcements
        );

        const paginatedAnnouncements = allAnnouncements.slice(
            startIndex,
            endIndex
        );

        const result = {
            announcements: paginatedAnnouncements,
            currentPage: page,
            totalPages: Math.ceil(allAnnouncements.length / limit),
            totalAnnouncements: allAnnouncements.length,
        };

        fMsg(res, "Announcements fetched successfully", result, 200);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const filterFeeds = async (req, res, next) => {
    try {
        const { grade, contentType, classId, schoolId } = req.query;

        let query = {};
        if (schoolId) query.schoolId = schoolId;
        if (grade) query.grade = grade;
        if (classId) query.classId = classId;
        if (contentType) query.contentType = contentType;

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .populate("posted_by", "userName profilePicture roles");

        fMsg(res, "Posts fetched successfully", posts, 200);
    } catch (error) {
        console.log(error);
        next(error);
    }
};


export const deletePost = async (req, res, next) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return next(new Error("Post not found"));
        }

        // Delete associated file from Supabase if it exists
        if (post.contentPictures) {
            for (const pictureUrl of post.contentPictures) {
                await deleteImageFromSupabase(pictureUrl, "posts");
            }
        }

        // Delete associated documents
        for (const docUrl of post.documents) {
            await deleteDocumentFromSupabase(docUrl, "documents");
        }

        await Post.findByIdAndDelete(req.params.post_id);

        if (post.contentType === "announcement" && post.classId) {
            await Class.findByIdAndUpdate(post.classId, {
                $pull: { announcements: post._id },
            });
        }

        fMsg(res, "Post deleted successfully", post, 200);
    } catch (error) {
        next(error);
    }
};

export const createPostWithProgress = async (req, res, next) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      heading,
      body,
      contentType,
      reactions,
      gradeName,
      className,
    } = req.body;

    const posted_by = req.user._id;
    const userObject = await User.findById(posted_by);

    let classId = null;
    if (contentType === "announcement") {
      const classExists = await Class.findOne({
        grade: gradeName,
        className: className,
        school: userObject.schools[0],
      });

      if (!classExists) {
        sendProgress({ error: "Class not found" });
        return res.end();
      }

      if (!userObject.classes.includes(classExists._id)) {
        sendProgress({ error: "You are not registered in this class" });
        return res.end();
      }
      classId = classExists._id;
    }

    let contentPictures = [];
    let documents = [];

    // Handle contentPictures upload (no progress tracking)
    if (req.files && req.files.contentPictures) {
      for (const file of req.files.contentPictures) {
        try {
          const contentPictureUrl = await uploadImageToSupabase(file, "posts");
          contentPictures.push(contentPictureUrl);
        } catch (uploadError) {
          sendProgress({ error: `Image upload failed: ${uploadError.message}` });
          return res.end();
        }
      }
    }

    // Handle documents upload with progress tracking
    if (req.files && req.files.documents) {
      sendProgress({ status: 'uploading', type: 'documents', total: req.files.documents.length });
      for (let i = 0; i < req.files.documents.length; i++) {
        const file = req.files.documents[i];
        try {
          const documentUrl = await uploadDocumentToSupabase(file, "documents", (progress) => {
            sendProgress({ status: 'progress', type: 'document', current: i + 1, total: req.files.documents.length, progress });
          });
          documents.push(documentUrl);
          sendProgress({ status: 'complete', type: 'document', current: i + 1, total: req.files.documents.length });
        } catch (uploadError) {
          sendProgress({ error: `Document upload failed: ${uploadError.message}` });
          return res.end();
        }
      }
      sendProgress({ status: 'complete', type: 'documents' });
    }

    const post = new Post({
      posted_by,
      heading,
      body,
      contentPictures,
      contentType,
      reactions,
      classId,
      schoolId:userObject.schools[0],
      documents,
    });

    try {
      await post.save();
      await post.populate("posted_by", "userName profilePicture roles");

      if (contentType === "announcement" && classId) {
        await Class.findByIdAndUpdate(
          classId,
          { $push: { announcements: post._id } },
          { new: true }
        );
      }

      sendProgress({ status: 'complete', type: 'post', data: post });
    } catch (saveError) {
      sendProgress({ error: `Failed to save post: ${saveError.message}` });
    }

    res.end();
  } catch (error) {
    console.error("Detailed error in createPostWithProgress:", error);
    sendProgress({ error: error.message });
    res.end();
  }
};

export const editPost = async (req, res, next) => {
 
  try {
    const {heading, body, contentType, reactions, gradeName, className} = req.body;
    const post = await Post.findById(req.params.post_id);
    const userObject = await User.findById(req.user._id);
    if (!post) {
      return next(new Error("Post not found"));
    }


    if(!heading && !body ){
      return fError(res, "Heading, body are required", 400);
    }

    if(contentType ==="feed" && userObject.roles.includes("teacher")){
      return fError(res, "You are not authorized to create feeds", 401);
    }
    //if its a feed and gradeName or className is provided, then return an error
    if(contentType ==="feed" && (gradeName || className)){
      return fError(res, "Feeds cannot be associated with a class", 400);
    }

    if(contentType ==="announcement"){

      if(!gradeName || !className){
        return fError(res, "Grade and class are required while creating an announcement", 400);
      }

      const classExists = await Class.findOne({
        grade: gradeName,
        className: className,
        school: userObject.schools[0],
      });

      if (!classExists) {
        return next(new Error("Class not found"));
      }

      await Class.findByIdAndUpdate(
        classExists._id,
        { $push: { announcements: post._id } },

      );
    }

    if(contentType ==="feed"){

      const classExists = await Class.findOne({
        grade: post.grade,
        className: className,
        school: userObject.schools[0],
      });
      await Class.findByIdAndUpdate(
        post.classId,
        { $pull: { announcements: post._id } },
      );

      
    }


    // Handle contentPictures update
    if (req.files && req.files.contentPictures && req.files.contentPictures.length > 0) {
      try {
        // Delete old files if they exist
        if (post.contentPictures && post.contentPictures.length > 0) {
          for (const pictureUrl of post.contentPictures) {
            await deleteImageFromSupabase(pictureUrl, "posts");
          }
        }

        if(req.files.contentPictures.length == 0){
          for (const pictureUrl of post.contentPictures) {
            await deleteImageFromSupabase(pictureUrl, "posts");
          }
          req.body.contentPictures = [];
        }

        // Upload new files
        const newContentPictures = [];
        for (const file of req.files.contentPictures) {
          const contentPictureUrl = await uploadImageToSupabase(file, "posts");
          newContentPictures.push(contentPictureUrl);
        }
        req.body.contentPictures = newContentPictures;
      } catch (uploadError) {
        return next(new Error(`Content pictures operation failed: ${uploadError.message}`));
      }
    } else if (!req.body.contentPictures || req.body.contentPictures.length === 0) {
      // If no contentPictures are provided in the request, delete existing ones
      if (post.contentPictures && post.contentPictures.length > 0) {
        for (const pictureUrl of post.contentPictures) {
          await deleteImageFromSupabase(pictureUrl, "posts");
        }
        req.body.contentPictures = [];
      }
    }

    // Handle documents update
    if (req.files && req.files.documents && req.files.documents.length > 0) {
      try {
        // Delete old documents
        if (post.documents && post.documents.length > 0) {
          for (const docUrl of post.documents) {
            await deleteDocumentFromSupabase(docUrl, "documents");
          }
        }

        // Upload new documents
        const newDocuments = [];
        for (const file of req.files.documents) {
          const documentUrl = await uploadDocumentToSupabase(file, "documents");
          newDocuments.push(documentUrl);
        }
        req.body.documents = newDocuments;
      } catch (uploadError) {
        return next(new Error(`Documents operation failed: ${uploadError.message}`));
      }
    } else if (!req.body.documents || req.body.documents.length === 0) {
      // If no documents are provided in the request, delete existing ones
      if (post.documents && post.documents.length > 0) {
        for (const docUrl of post.documents) {
          await deleteDocumentFromSupabase(docUrl, "documents");
        }
        req.body.documents = [];
      }
    }

   
    if(post.contentType ==="announcement"){
      post.classId = null;
    }
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.post_id,
      {
        heading,
        body,
        contentType,
        reactions,
        classId:post.classId,
        documents:req.body.documents,
        contentPictures:req.body.contentPictures,
      },
      { new: true }
    );

     

    fMsg(res, "Post updated successfully", updatedPost, 200);
  } catch (error) {
    console.error("Error in editPost:", error);
    next(error);
  }
};