import Post from "../models/post.model.js";
import path from "path";
import { fileURLToPath } from "url";
import { fMsg, paginate, paginateAnnouncements } from "../utils/libby.js";
import { deleteFile } from "../utils/libby.js";
import Class from "../models/class.model.js";
import User from "../models/user.model.js";
import initializeSupabase from "../config/connectSupaBase.js";
import dotenv from "dotenv";

dotenv.config();

// Initialize Supabase client
const supabase = initializeSupabase();

const createPostsBucketIfNotExists = async () => {
  try {
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();
    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }

    if (!buckets.some((bucket) => bucket.name === "posts")) {
      const { data, error } = await supabase.storage.createBucket("posts", {
        public: false,
      });
      if (error) {
        console.error("Error creating posts bucket:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } else {
        console.log("Posts bucket created successfully");
      }
    } else {
      console.log("Posts bucket already exists");
    }
  } catch (error) {
    console.error("Unexpected error in createPostsBucketIfNotExists:", error);
  }
};

// createPostsBucketIfNotExists();

export const createPost = async (req, res, next) => {
  try {
    if (!supabase) {
      return next(new Error("Supabase client not initialized"));
    }
    const { heading, body, contentType, reactions, classId, schoolId } =
      req.body;

    const posted_by = req.user._id;

    let contentPicture = null;

    if (req.file) {
      const file = req.file;
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        // console.log('Upload result:', JSON.stringify({ uploadData, uploadError }, null, 2));

        if (uploadError) {
          console.error(
            "Supabase upload error:",
            JSON.stringify(uploadError, null, 2)
          );
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        const { data: urlData, error: urlError } = supabase.storage
          .from("posts")
          .getPublicUrl(fileName);

        if (urlError) {
          console.error(
            "Error getting public URL:",
            JSON.stringify(urlError, null, 2)
          );
          throw new Error("Failed to get public URL for uploaded file");
        }

        contentPicture = urlData.publicUrl;
        console.log("File uploaded successfully. Public URL:", contentPicture);
      } catch (uploadError) {
        console.error(
          "Detailed Supabase upload error:",
          JSON.stringify(uploadError, null, 2)
        );
        return next(new Error(`File upload failed: ${uploadError.message}`));
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

    if (req.file) {
      if (post.contentPicture) {
        const oldFileName = post.contentPicture.split("/").pop();
        const { error: deleteError } = await supabase.storage
          .from("posts")
          .remove([oldFileName]);

        if (deleteError) {
          console.error("Error deleting old file from Supabase:", deleteError);
        }
      }

      const file = req.file;
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("posts")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        return next(new Error("File upload failed. Please try again."));
      }

      const { data: urlData } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      req.body.contentPicture = urlData.publicUrl;
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
    const post = await Post.findByIdAndDelete(req.params.post_id);
    if (!post) {
      return next(new Error("Post not found"));
    }

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
