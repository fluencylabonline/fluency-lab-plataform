"use client";

interface AvatarProps {
  seed: string;
  name?: string | null;
  size?: number;
  photoUrl?: string | null;
}

export function Avatar({ seed, name, size = 40, photoUrl }: AvatarProps) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name || "Avatar"}
        className="shrink-0 rounded-full object-cover border border-border/10 select-none"
        style={{ width: size, height: size }}
      />
    );
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 50) % 360;

  // Extract initials if name is available, otherwise default to phone digits
  let label = "WA";
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      label = (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts[0]) {
      label = parts[0].slice(0, 2).toUpperCase();
    }
  } else {
    label = seed.replace(/\D/g, "").slice(-4) || "WA";
  }

  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center text-white font-semibold select-none shadow-sm"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.33,
        background: `linear-gradient(135deg, hsl(${h1},68%,58%), hsl(${h2},80%,42%))`,
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </div>
  );
}
