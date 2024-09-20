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

  // console.log('Supabase URL:', supabaseUrl);
  // console.log('Supabase Service Key length:', supabaseServiceKey.length);
  console.log("Supabase client initialized:", !!supabase);

  return supabase;
};

export default initializeSupabase;
