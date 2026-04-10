"use server";
import fs from "fs";
import path from "path";

export async function getFallbackImages() {
  const dir = path.join(process.cwd(), "public/fallback-images");
  if (!fs.existsSync(dir)) return [];
  const files = await fs.promises.readdir(dir);
  return files
    .filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f))
    .map((f) => `/fallback-images/${f}`);
}