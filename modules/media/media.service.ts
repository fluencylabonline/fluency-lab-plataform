import "server-only";
import { env } from "@/env";
import { checkRateLimit } from "@/lib/rate-limit";
import admin from "firebase-admin";
import type { ImageCredit } from "@/modules/curriculum/curriculum.types";

const UNSPLASH_UTM = "utm_source=fluencylab&utm_medium=referral";
const withUtm = (url: string) => `${url}${url.includes("?") ? "&" : "?"}${UNSPLASH_UTM}`;

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

export const mediaService = {
  /**
   * Searches for a relevant image on Unsplash based on keywords.
   * Returns the URL of the most relevant image.
   */
  async searchImage(keywords: string, userId?: string): Promise<string | null> {
    const image = await this.searchImageWithCredit(keywords, userId);
    return image?.url ?? null;
  },

  /**
   * Same search, but also returns the credit data the Unsplash API guidelines require:
   * photographer and Unsplash links (with UTM) and the endpoint to trigger the download event.
   */
  async searchImageWithCredit(
    keywords: string,
    userId?: string
  ): Promise<{ url: string; credit: ImageCredit } | null> {
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
      const photo = data.results?.[0];
      if (!photo?.urls?.regular) return null;

      return {
        url: photo.urls.regular,
        credit: {
          photographer: photo.user?.name ?? "Unsplash",
          photographerUrl: withUtm(photo.user?.links?.html ?? "https://unsplash.com"),
          photoUrl: withUtm(photo.links?.html ?? "https://unsplash.com"),
          downloadLocation: photo.links?.download_location,
        },
      };
    } catch (error) {
      console.error("Unsplash Search Failed:", error);
      return null;
    }
  },

  /**
   * Triggers the Unsplash "download" event for a photo that a student is actually using
   * (required by the API guidelines). Only api.unsplash.com photo endpoints are accepted.
   */
  async trackImageDownload(downloadLocation: string): Promise<boolean> {
    let url: URL;
    try {
      url = new URL(downloadLocation);
    } catch {
      return false;
    }
    if (url.protocol !== "https:" || url.hostname !== "api.unsplash.com" || !/^\/photos\/[\w-]+\/download$/.test(url.pathname)) {
      return false;
    }

    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Searches for videos on YouTube.
   */
  async searchYouTube(query: string, maxResults: number = 6): Promise<YouTubeVideo[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&maxResults=${maxResults}&type=video&key=${env.YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        console.error("YouTube API Error:", await response.text());
        return [];
      }

      const data = await response.json();
      return (data.items || []).map((item: { 
        id: { videoId: string }; 
        snippet: { 
          title: string; 
          channelTitle: string; 
          thumbnails: { 
            medium?: { url: string }; 
            default?: { url: string } 
          } 
        } 
      }) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      }));
    } catch (error) {
      console.error("YouTube Search Failed:", error);
      return [];
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
