import Post from '../models/post.model.js';
import { fMsg } from "../utils/libby.js";



export const createPost = async (req, res) => {
    try {
        const post = new Post({
            ...req.body,
        })
        await post.save();
        await post.populate('posted_by', 'userName email phone roles');
        fMsg(res, "Post created successfully", post);
    } catch (error) {
        console.log(error)
        fMsg(res, "error in creating post", error);
    }
};

export const editPost = async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.post_id, {
            ...req.body
        }, { new: true });
        fMsg(res, "Post updated successfully", post);
    } catch (error) {
        fMsg(res, "error in updating post", error);
    }
};

export const deletePost = async (req, res) => {
    try {
        // Find the post by ID and delete it
        const post = await Post.findByIdAndDelete(req.params.post_id);
        
        // Check if the post was found and deleted
        if (!post) {
            return fMsg(res, "Post not found");
        }

        // Respond with a success message
        fMsg(res, "Post deleted successfully", post);
    } catch (error) {
        console.log(error);
        fMsg(res, "Error in deleting post", error);
    }
};