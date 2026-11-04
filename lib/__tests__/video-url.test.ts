import { describe, it, expect } from "vitest";
import { parseVideoUrl } from "../video-url";

describe("parseVideoUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10", "youtube", "https://www.youtube.com/embed/dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "youtube", "https://www.youtube.com/embed/dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "youtube", "https://www.youtube.com/embed/dQw4w9WgXcQ"],
    ["https://drive.google.com/file/d/1AbC-def_GH/view?usp=sharing", "drive", "https://drive.google.com/file/d/1AbC-def_GH/preview"],
    ["https://drive.google.com/open?id=1AbC-def_GH", "drive", "https://drive.google.com/file/d/1AbC-def_GH/preview"],
  ])("%s", (input, provider, embedUrl) => {
    expect(parseVideoUrl(input)).toMatchObject({ provider, embedUrl });
  });

  it.each([
    "Teste auditoria",
    "a".repeat(500),
    "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=curto",
    "javascript:alert(1)",
    `https://youtu.be/dQw4w9WgXcQ?${"x".repeat(2100)}`,
  ])("rejeita %s", (input) => {
    expect(parseVideoUrl(input)).toBeNull();
  });
});
