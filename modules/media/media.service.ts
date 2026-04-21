import { env } from "@/env";
import { checkRateLimit } from "@/lib/rate-limit";
import admin from "firebase-admin";

export const mediaService = {
  /**
   * Searches for a relevant image on Unsplash based on keywords.
   * Returns the URL of the most relevant image.
   */
  async searchImage(keywords: string, userId?: string): Promise<string | null> {
    if (userId) {
      const limit = await checkRateLimit("unsplash_search", userId, 100);
      if (!limit.success) {
        console.warn(`Rate limit exceeded for Unsplash: ${userId}`);
        return null;
      }
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keywords)}&per_page=1&orientation=squarish`,
        {
          headers: {
            Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Unsplash API Error:", await response.text());
        return null;
      }

      const data = await response.json();
      return data.results[0]?.urls?.regular || null;
    } catch (error) {
      console.error("Unsplash Search Failed:", error);
      return null;
    }
  },

  /**
   * Helper to upload a buffer to Firebase Storage and get a download URL.
   * This is used in Step 1/Step 5 if needed.
   */
  async uploadToStorage(
    path: string,
    buffer: Buffer,
    contentType: string,
    userId: string
  ): Promise<string> {
    // Apply Rate Limit: 10 uploads per hour per user
    const limit = await checkRateLimit("media_upload", userId, 10, 3600 * 1000);
    if (!limit.success) throw new Error("Rate limit exceeded for media uploads");

    const bucket = admin.storage().bucket(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const file = bucket.file(path);

    await file.save(buffer, {
      metadata: { contentType },
    });

    // Generate a signed URL or use the standard public URL if the bucket is public
    // For FluencyLab, we'll use public URLs for lesson media if possible, 
    // or signed URLs for protected student items.
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Long term or permanent
    });

    return url;
  },

  /**
   * Generates a signed URL for client-side direct upload to Firebase Storage.
   */
  async getSignedUploadUrl(path: string, contentType: string, userId: string): Promise<string> {
    const limit = await checkRateLimit("media_upload", userId, 10, 3600 * 1000);
    if (!limit.success) throw new Error("Rate limit exceeded for media uploads");

    const bucket = admin.storage().bucket(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const file = bucket.file(path);

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    return url;
  },

  /**
   * Checks if the user is allowed to perform a heavy AI action.
   */
  async checkAiRateLimit(userId: string) {
    // 20 AI requests per hour
    return await checkRateLimit("ai_action", userId, 20, 3600 * 1000);
  }
};
