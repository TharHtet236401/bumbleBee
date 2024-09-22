import Post from "../models/post.model.js";
import path from "path";
import { fileURLToPath } from "url";
import { fMsg, paginate, paginateAnnouncements } from "../utils/libby.js";
import { deleteFile } from "../utils/libby.js";
import Class from "../models/class.model.js";
import User from "../models/user.model.js";
import initializeSupabase from "../config/connectSupaBase.js";
import dotenv from "dotenv";
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
  uploadDocumentToSupabase,
  deleteDocumentFromSupabase,
} from "../utils/supabaseUpload.js";

dotenv.config();

export const createPost = async (req, res, next) => {
  try {
    const { heading, body, contentType, reactions, classId, schoolId } =
      req.body;
    const posted_by = req.user._id;

    let contentPicture = null;
    let documents = [];

    

    if (req.files && req.files.contentPicture && req.files.contentPicture[0]) {
      try {
        contentPicture = await uploadImageToSupabase(
          req.files.contentPicture[0],
          "posts"
        );
      } catch (uploadError) {
        return next(new Error(`File upload failed: ${uploadError.message}`));
      }
    }

    if (req.files && req.files.documents) {
      try {
        for (const file of req.files.documents) {
          const documentUrl = await uploadDocumentToSupabase(file, "documents");
          documents.push(documentUrl);
        }
      } catch (uploadError) {
        return next(
          new Error(`Document upload failed: ${uploadError.message}`)
        );
      }
    }

    const post = new Post({
      posted_by,
      heading,
      body,
      contentPicture,
      contentType,
      reactions,
      classId,
      schoolId,
      documents,
    });

    await post.save();
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

    const populate = { posted_by: "userName profilePicture roles" };

    const populateString = Object.entries(populate).map(([path, select]) => ({
      path,
      select,
    }));

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

    const announcements = await Class.find(query, "announcements")
      .sort({ createdAt: -1 })
      .populate({
        path: "announcements",
        populate: {
          path: "posted_by",
          select: "userName profilePicture roles",
        },
      })
      .lean();

    const paginatedResults = paginateAnnouncements(announcements, page);

    fMsg(res, "Announcements fetched successfully", paginatedResults, 200);
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

export const editPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      return next(new Error("Post not found"));
    }

    // Handle contentPicture update
    if (req.files && req.files.contentPicture && req.files.contentPicture[0]) {
      try {
        // Delete old file if it exists
        if (post.contentPicture) {
          await deleteImageFromSupabase(post.contentPicture, "posts");
        }

        // Upload new file
        const newContentPicture = await uploadImageToSupabase(
          req.files.contentPicture[0],
          "posts"
        );
        req.body.contentPicture = newContentPicture;
      } catch (uploadError) {
        return next(
          new Error(`Content picture operation failed: ${uploadError.message}`)
        );
      }
    }

    // Handle documents update
    if (req.files && req.files.documents) {
      try {
        // Delete old documents
        for (const docUrl of post.documents) {
          await deleteDocumentFromSupabase(docUrl, "documents");
        }

        // Upload new documents
        const newDocuments = [];
        for (const file of req.files.documents) {
          const documentUrl = await uploadDocumentToSupabase(file, "documents");
          newDocuments.push(documentUrl);
        }
        req.body.documents = newDocuments;
      } catch (uploadError) {
        return next(
          new Error(`Documents operation failed: ${uploadError.message}`)
        );
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.post_id,
      {
        ...req.body,
      },
      { new: true }
    );
    fMsg(res, "Post updated successfully", updatedPost, 200);
  } catch (error) {
    console.error("Error in editPost:", error);
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
    if (post.contentPicture) {
      await deleteImageFromSupabase(post.contentPicture, "posts");
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
