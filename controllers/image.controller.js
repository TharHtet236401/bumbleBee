import User from "../models/user.model.js";
import { uploadImageToSupabaseWithProgress } from "../utils/supabaseUpload.js";
import { fMsg, fError } from "../utils/libby.js";

export const profilePictureUpload = async (req, res, next) => {
	try {
		const userObject = req.user;
		const user = await User.findById(userObject._id);
		if (!user) {
			return fError(res, "User not found", {}, 404);
		}

		if (!req.file) {
			return fError(res, "No file uploaded", {}, 400);
		}

		const file = req.file;

		// Set headers for streaming response
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

		// Send success message
		res.write(`data: ${JSON.stringify({ status: 'complete', profilePicture: imageUrl })}\n\n`);
		res.end();
	} catch (error) {
		next(error);
	}
};
