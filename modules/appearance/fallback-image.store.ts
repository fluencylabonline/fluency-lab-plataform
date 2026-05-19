import Cookies from "js-cookie";

export const getOrSetFallbackImage = (images: string[]) => {
  if (images.length === 0) return null;

  const saved = Cookies.get("fluency-lab-fallback-avatar");
  if (saved && images.includes(saved)) return saved;

  const randomImage = images[Math.floor(Math.random() * images.length)];
  Cookies.set("fluency-lab-fallback-avatar", randomImage, { expires: 365, secure: true, sameSite: "lax" });
  return randomImage;
};