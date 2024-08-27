import Post from '../models/post.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { fMsg } from "../utils/libby.js";
import {deleteFile} from "../utils/libby.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createPost = async (req, res) => {
    try {

        let {
            heading,
            body,
            contentPicture,
            contentType,
            reactions,
            classId,
            schoolId,
            grade
        } = req.body

        const posted_by = req.user._id;

        contentPicture = req.file ? `/uploads/post_images/${req.file.filename}` : null;

        const post = new Post({
            posted_by,
            heading,
            body,
            contentPicture,
            contentType,
            reactions,
            classId,
            schoolId,
            grade
        })

        await post.save();
        await post.populate('posted_by', 'userName profilePicture roles');

        fMsg(res, "Post created successfully", post, 201);
    } catch (error) {
        console.log(error)
        if (req.file) {
            const oldFilePath = path.join(__dirname, '..', req.file.path);
            deleteFile(oldFilePath);
        }
        fMsg(res, "error in creating post", error, 500);
    }
};

export const getFeeds = async (req, res) => {
    try {
        const { schools } = req.user;
        const contentType = req.query.contentType;

        const query = {
            school: { $in: schools },
            contentType
        }

        const posts = await Post.find(query)
                                .sort({ createdAt: -1 })
                                .populate('posted_by', 'userName profilePicture roles')

        fMsg(res, "Posts fetched successfully", posts, 200);
    } catch (error) {
        console.log(error)
        fMsg(res, "Error in fetching posts", error, 500);
    }
};

export const getAnnouncements = async (req, res) => {
    try {
        const { schools, classes } = req.user;

        const query = {
            school: { $in: schools },
            classId: { $in: classes }
        }

        const posts = await Post.find(query)
                                .sort({ createdAt: -1 })
                                .populate('posted_by', 'userName profilePicture roles')

        fMsg(res, "Posts fetched successfully", posts, 200);
    } catch (error) {
        console.log(error)
        fMsg(res, "Error in fetching posts", error, 500);
    }
};

export const filterFeeds = async (req, res) => {
    try {

        const { grade, contentType, classname, school } = req.query;
        
        // Construct query object
        let query = {};
        if (school) query.school = school;
        if (grade) query.grade = grade;
        if (classname) query.classname = classname;
        if (contentType) query.contentType = contentType;

        const posts = await Post.find(query)
                                .sort({ createdAt: -1 })
                                .populate('posted_by', 'userName profilePicture roles');

        fMsg(res, "Posts fetched successfully", posts, 200);
    } catch (error) {
        console.log(error);
        fMsg(res, "Error in fetching posts", error, 500);
    }
};


export const editPost = async (req, res) => {
    try {

        // delete the old file if a new file is uploaded
        if (req.file) {
            const post = await Post.findById(req.params.post_id);
            if (post.contentPicture) {

                const oldFilePath = path.join(__dirname, '..', 'uploads', 'post_images' , path.basename(post.contentPicture));
                deleteFile(oldFilePath);

            }
            req.body.contentPicture = `/uploads/post_images/${req.file.filename}`;
        }

        const post = await Post.findByIdAndUpdate(req.params.post_id, {
            ...req.body
        }, { new: true });
        fMsg(res, "Post updated successfully", post, 200);
    } catch (error) {
        console.log(error)
        fMsg(res, "error in updating post", error, 500);
    }
};

export const deletePost = async (req, res) => {
    try {
        // Find the post by ID and delete it
        const post = await Post.findByIdAndDelete(req.params.post_id);
        
        // Check if the post was found and deleted
        if (!post) {
            return fMsg(res, "Post not found", null, 404);
        }

        // Respond with a success message
        fMsg(res, "Post deleted successfully", post, 200);
    } catch (error) {

        fMsg(res, "Error in deleting post", error, 500);
    }
};

