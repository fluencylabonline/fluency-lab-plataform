"use client";

import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url: string;
  provider: "youtube" | "drive" | "storage";
  className?: string;
}

export function VideoPlayer({ url, provider, className }: VideoPlayerProps) {
  const getEmbedUrl = (url: string, provider: string) => {
    if (provider === "youtube") {
      let videoId = "";
      if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      }
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    if (provider === "drive") {
      // Convert view link to embed link
      // From: https://drive.google.com/file/d/ID/view
      // To: https://drive.google.com/file/d/ID/preview
      return url.replace("/view", "/preview");
    }

    return url;
  };

  const embedUrl = getEmbedUrl(url, provider);

  return (
    <div className={cn("relative aspect-video w-full bg-black rounded-2xl overflow-hidden", className)}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
