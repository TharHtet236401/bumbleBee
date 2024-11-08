import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const initializeSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Key is missing");
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const createBucketsIfNotExist = async () => {
    try {
      const bucketsToCreate = ["profile-pictures", "documents","posts","chat-documents","chat-images"];
      for (const bucketName of bucketsToCreate) {
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        if (listError) {
          console.error(`Error listing buckets: ${listError}`);
          return;
        }

        if (!buckets.some((bucket) => bucket.name === bucketName)) {
          const { data, error } = await supabase.storage.createBucket(
            bucketName,
            {
              public: true, // Set to true if you want the bucket to be publicly accessible
            }
          );
          if (error) {
            console.error(`Error creating ${bucketName} bucket: ${error}`);
            console.error(`Error details: ${JSON.stringify(error, null, 2)}`);
          } else {
            console.log(`${bucketName} bucket created successfully`);
          }
        } else {
          // console.log(`${bucketName} bucket already exists`);
        }
      }
    } catch (error) {
      console.error(`Unexpected error in createBucketsIfNotExist: ${error}`);
    }
  };

  createBucketsIfNotExist();

  // console.log('Supabase URL:', supabaseUrl);
  // console.log('Supabase Service Key length:', supabaseServiceKey.length);
  console.log("Supabase client initialized:", !!supabase);

  return supabase;
};

export default initializeSupabase;
