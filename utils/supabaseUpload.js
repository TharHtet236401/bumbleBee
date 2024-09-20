import initializeSupabase from "../config/connectSupaBase.js";

const supabase = initializeSupabase();

//this is for uploading images to supabase which is used for creating posts
export const uploadImageToSupabase = async (file, bucketName) => {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
    
  }

  if (!file) {
    throw new Error("No file provided");
  }

  if (!bucketName) {
    throw new Error("Bucket name is required ");
  }

  const fileExt = file.originalname.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error(
        "Supabase upload error:",
        JSON.stringify(uploadError, null, 2)
      );
      throw new Error(`File upload failed: ${uploadError.message}`);
    }

    const { data: urlData, error: urlError } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (urlError) {
      console.error(
        "Error getting public URL:",
        JSON.stringify(urlError, null, 2)
      );
      throw new Error("Failed to get public URL for uploaded file");
    }

    return urlData.publicUrl;
  } catch (error) {
    console.error(
      "Detailed Supabase upload error:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
};

//this is for deleting images from supabase which is used for updating images and deleting the posts or deleting the image only
export const deleteImageFromSupabase = async (fileUrl, bucketName) => {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  if (!fileUrl) {
    throw new Error("No file URL provided");
  }

  if (!bucketName) {
    throw new Error("Bucket name is required");
  }

  try {
    const fileName = fileUrl.split("/").pop();
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      console.error("Supabase delete error:", JSON.stringify(error, null, 2));
      throw new Error(`File deletion failed: ${error.message}`);
    }

    console.log(`File ${fileName} deleted successfully from ${bucketName}`);
    return true;
  } catch (error) {
    console.error(
      "Detailed Supabase delete error:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
};
