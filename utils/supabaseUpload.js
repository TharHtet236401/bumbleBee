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

    return true;
  } catch (error) {
    console.error(
      "Detailed Supabase delete error:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
};

//may be one time used function and one of my mistakes to create it
export const createProfilePicturesBucketIfNotExists = async () => {
  try {
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();
    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }

    if (!buckets.some((bucket) => bucket.name === "profile-pictures")) {
      const { data, error } = await supabase.storage.createBucket(
        "profile-pictures",
        {
          public: true, // Set to true if you want profile pictures to be publicly accessible
        }
      );
      if (error) {
        console.error("Error creating profile-pictures bucket:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } else {
        console.log("Profile-pictures bucket created successfully");
      }
    } else {
      console.log("Profile-pictures bucket already exists");
    }
  } catch (error) {
    console.error(
      "Unexpected error in createProfilePicturesBucketIfNotExists:",
      error
    );
  }
};

//this is for uploading documents to supabase which is used for creating posts
export const uploadDocumentToSupabase = async (file, bucketName) => {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  if (!file) {
    throw new Error("No file provided");
  }

  if (!bucketName) {
    throw new Error("Bucket name is required");
  }

  const fileExt = file.originalname.split(".").pop();
  const fileName = `${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}.${fileExt}`;

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

//this is for deleting documents from supabase which is used for deleting the documents of the post
export const deleteDocumentFromSupabase = async (fileUrl, bucketName) => {
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
      throw new Error(`Document deletion failed: ${error.message}`);
    }

    console.log(`Document ${fileName} deleted successfully from ${bucketName}`);
    return true;
  } catch (error) {
    console.error(
      "Detailed Supabase document delete error:",
      JSON.stringify(error, null, 2)
    );
    throw error;
  }
};


export const uploadImageToSupabaseWithProgress = async (file, bucketName, sendProgress) => {
  if (!supabase) {
    throw new Error("Supabase client not initialized");
  }

  if (!file) {
    throw new Error("No file provided");
  }

  if (!bucketName) {
    throw new Error("Bucket name is required");
  }

  const fileExt = file.originalname.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;

  try {

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
        onProgress: (progress) => {
          sendProgress(progress);
        },
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
