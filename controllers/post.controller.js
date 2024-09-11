import Post from '../models/post.model.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { fMsg, paginate, paginateAnnouncements } from "../utils/libby.js";
import { deleteFile } from "../utils/libby.js";
import Class from '../models/class.model.js';
import User from '../models/user.model.js';
import { nextTick } from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//it will create the post and if the post is an announcement, it will add the post id to the class's announcements array
export const createPost = async (req, res, next) => {
    try {

        let {
            heading,
            body,
            contentPicture,
            contentType,
            reactions,
            classId,
            schoolId
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
            schoolId
        })

        await post.save();
        await post.populate('posted_by', 'userName profilePicture roles');

        if (contentType === 'announcement' && classId) {
            // Find the class and push the post ID to the announcements array
            await Class.findByIdAndUpdate(
                classId,
                { $push: { announcements: post._id } },
                { new: true }
            );
        }

        fMsg(res, "Post created successfully", post, 201);
    } catch (error) {
        console.log(error)
        if (req.file) {
            const oldFilePath = path.join(__dirname, '..', req.file.path);
            deleteFile(oldFilePath);
        }
        next(error);
    }
};

//it will get the feeds for the user depending on the school id he/she is in
export const getFeeds = async (req, res, next) => {
    try {
    
        const userId = req.user._id
        const userInfo = await User.findById(userId, 'schools').lean();

        const schoolIds = userInfo.schools
        const type = 'feed';

        const query = {
            schoolId: { $in: schoolIds },
            contentType: type
        }
        
        const page = parseInt(req.query.page) || 1;

        const sortField = 'createdAt'

        const populate = {"posted_by": "userName profilePicture roles"}

        const populateString = Object.entries(populate).map(([path, select]) => ({
            path,
            select
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
        console.log(error)
        next(error);
    }
};

//it will get the announcements for the user depending on the class id he/she is in
export const getAnnouncements = async (req, res, next) => {
    try {

        const userId = req.user._id
        const userInfo = await User.findById(userId,  'classes' ).lean();

        const classes = userInfo.classes

        if(classes.length == 0){
            return next(new Error("No classes registered for you"));
        }

        const query = {
            _id: { $in: classes },
        }

        const page = parseInt(req.query.page) || 1;

        const announcements = await Class.find(query, 'announcements')
                                .sort({ createdAt: -1 })
                                .populate({
                                    path: 'announcements',
                                    populate: {
                                        path: 'posted_by',
                                        select: 'userName profilePicture roles'
                                    }
                                })
                                .lean();

        const paginatedResults =  paginateAnnouncements(announcements, page);

        

        fMsg(res, "Announcements fetched successfully", paginatedResults, 200);
    } catch (error) {
        console.log(error);
        next(error);
    }
};



//this may be useful for the admin to filter the feeds for the school
//admin function
export const filterFeeds = async (req, res, next) => {
    try {

        const { grade, contentType, classId, schoolId } = req.query;
        
        // Construct query object
        let query = {};
        if (schoolId) query.schoolId = schoolId;
        if (grade) query.grade = grade;
        if (classId) query.classId = classId;
        if (contentType) query.contentType = contentType;

        const posts = await Post.find(query)
                                .sort({ createdAt: -1 })
                                .populate('posted_by', 'userName profilePicture roles');

        fMsg(res, "Posts fetched successfully", posts, 200);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

// this may allow the user to edit the post
export const editPost = async (req, res, next) => {
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

        const post = await Post.findByIdAndUpdate(
            req.params.post_id,
            {
                ...req.body
            },
            { new: true }
        );
        fMsg(res, "Post updated successfully", post, 200);
    } catch (error) {
        console.log(error)
        next(error);
    }
};

//this will delete the post and if the post is an announcement, it will remove the post id from the class's announcements array
export const deletePost = async (req, res, next) => {
    try {
        // Find and delete the post in one operation
        const post = await Post.findByIdAndDelete(req.params.post_id);
        if (!post) {
            return next(new Error("Post not found"));
        }

        // If the post is an announcement, remove the post id from the class's announcements array
        if (post.contentType === 'announcement' && post.classId) {
            await Class.findByIdAndUpdate(post.classId, { $pull: { announcements: post._id } });
        }

        // Respond with a success message
        fMsg(res, "Post deleted successfully", post, 200);
    } catch (error) {
        next(error);
    }
};

