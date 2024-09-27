import User from "../models/user.model.js";
import { uploadImageToSupabaseWithProgress, deleteImageFromSupabase, uploadImageToSupabase } from "../utils/supabaseUpload.js";
import { fMsg, fError } from "../utils/libby.js";


//if you use this, you need to use SSE to get the progress
export const profilePictureUpload = async (req, res, next) => {
	try {
		const userObject = req.user;
		const user = await User.findById(userObject._id);
		if (!user) {
			return fError(res, "User not found", 404);
		}

		if (!req.file) {
			return fError(res, "No file uploaded", 400);
		}

		const file = req.file;

		// Delete existing profile picture if it exists
		if (user.profilePicture) {
			await deleteImageFromSupabase(user.profilePicture, "profile-pictures");
		}

		// Set up SSE for real-time progress updates
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});

		const sendProgress = (progress) => {
			res.write(`data: ${JSON.stringify({ progress })}\n\n`);
		};

		const imageUrl = await uploadImageToSupabaseWithProgress(file, "profile-pictures", sendProgress);

		// Update user's profile with the new image URL
		await User.updateOne(
			{ _id: user._id },
			{ profilePicture: imageUrl }
		);

		// Send final success message
		res.write(`data: ${JSON.stringify({ status: 'complete', profilePicture: imageUrl })}\n\n`);
		res.end();
	} catch (error) {
		console.error("Error in profilePictureUpload:", error);
		next(error);
	}
};

// this is for the simple upload without progress
export const profilePictureUploadSimple = async (req, res, next) => {
	try {
		const userObject = req.user;
		const user = await User.findById(userObject._id);
		if (!user) {
			return fError(res, "User not found", 404);
		}

		if (!req.file) {
			return fError(res, "No file uploaded", 400);
		}

		const file = req.file;

		

		// Delete existing profile picture if it exists
		if (user.profilePicture) {
			await deleteImageFromSupabase(user.profilePicture, "profile-pictures");
		}

		const imageUrl = await uploadImageToSupabase(file, "profile-pictures");

		

		// Update user's profile with the new image URL
		await User.updateOne(
			{ _id: user._id },
			{ profilePicture: imageUrl }
		);

		// Send final success message
		fMsg(res, "Profile picture uploaded successfully",{profilePicture: imageUrl}, 200);
	} catch (error) {
		console.error("Error in profilePictureUploadSimple:", error);
		next(error);
	}
};

