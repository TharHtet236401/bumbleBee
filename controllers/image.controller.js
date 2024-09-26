import User from "../models/user.model.js";
import { uploadImageToSupabaseWithProgress } from "../utils/supabaseUpload.js";
import { fMsg, fError } from "../utils/libby.js";

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

		console.log("Starting file upload...");

		// Set up SSE for real-time progress updates
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		});

		const sendProgress = (progress) => {
			res.write(`data: ${JSON.stringify({ progress })}\n\n`);
			console.log(`Sending upload progress: ${progress}%`);
			// Flush the response to ensure the client receives the update immediately
			
		};

		const imageUrl = await uploadImageToSupabaseWithProgress(file, "profile-pictures", sendProgress);

		console.log("File upload completed. URL:", imageUrl);

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


