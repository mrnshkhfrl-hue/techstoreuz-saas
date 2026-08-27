import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file buffer to a specified Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  fileBuffer: Buffer | ArrayBuffer,
  bucket: string,
  filename: string,
  contentType: string = "image/jpeg"
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`Supabase upload error for ${filename}:`, error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

export async function uploadProductImage(file: File | Blob, extension: string): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
  
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(filename, file, {
      upsert: true,
    });

  if (error) {
    console.error(`Supabase upload error for ${filename}:`, error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(data.path);

  return publicUrl;
}
