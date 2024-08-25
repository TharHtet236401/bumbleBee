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
            classname,
            grade
        } = req.body

        const posted_by = req.user._id;
        const school = req.user.schools[0] || "Some School";

        contentPicture = req.file ? `/uploads/post_images/${req.file.filename}` : null;

        const post = new Post({
            posted_by,
            school,
            heading,
            body,
            contentPicture,
            contentType,
            reactions,
            classname,
            grade
        })
        await post.save();
        await post.populate('posted_by', 'userName email phone roles');
        fMsg(res, "Post created successfully", post, 201);
    } catch (error) {
        console.log(error)
        fMsg(res, "error in creating post", error, 500);
    }
};

export const getPosts = async (req, res) => {
    try {
        const school = req.user.schools
            // || ["66cab8838b334f640e053052", "66caeb3a03651d7601f7ffb9"];
        const classname = req.user.classes
            // || ["apple", "banana"];
        const { grade, contentType } = req.query;
        
        // Construct query object
        let query = {};
        if (school.length > 0) query.school = { $in: school };
        if (grade) query.grade = grade;
        if (classname.length > 0) query.classname = { $in: classname };
        if (contentType) query.contentType = contentType;

        const posts = await Post.find(query)
                                .sort({ createdAt: -1 })
                                .populate('posted_by', 'userName email phone roles');

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
                console.log(post.contentPicture)
                console.log( path.basename(post.contentPicture))
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