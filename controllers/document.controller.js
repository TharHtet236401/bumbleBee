import { uploadMultipleDocumentsToSupabase } from "../utils/supabaseUpload.js";
import { fMsg, fError } from "../utils/libby.js";

export const uploadMultipleDocuments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return fError(res, "No files uploaded",400);
    }

    console.log("Starting multiple document upload...");

    // Set up SSE for real-time progress updates
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const sendProgress = (progress) => {
      res.write(`data: ${JSON.stringify({ progress })}\n\n`);
      console.log(`Sending upload progress: ${progress}%`);
    };

    const uploadedUrls = await uploadMultipleDocumentsToSupabase(req.files, "documents", sendProgress);

    console.log("All documents uploaded successfully.");

    // Send final success message
    res.write(`data: ${JSON.stringify({ status: 'complete', documentUrls: uploadedUrls })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error in uploadMultipleDocuments:", error);
    next(error);
  }
};