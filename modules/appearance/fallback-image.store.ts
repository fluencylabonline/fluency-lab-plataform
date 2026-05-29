import Cookies from "js-cookie";

export const getOrSetFallbackImage = (images: string[], identifier?: string) => {
  if (images.length === 0) return null;

  // If we have an identifier, deterministically choose the fallback image.
  // This guarantees each user gets a fixed, unique fallback avatar that is visible
  // consistently across all clients.
  if (identifier) {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % images.length;
    return images[index];
  }

  const saved = Cookies.get("fluency-lab-fallback-avatar");
  if (saved && images.includes(saved)) return saved;

  const randomImage = images[Math.floor(Math.random() * images.length)];
  Cookies.set("fluency-lab-fallback-avatar", randomImage, { expires: 365, secure: true, sameSite: "lax" });
  return randomImage;
};