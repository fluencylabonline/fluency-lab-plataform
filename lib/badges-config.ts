export interface BadgeLevel {
  code: string;
  label: string;
  character: string;
  show: string;
  emoji: string;
  description: string;
  quote: string;
}

export interface LanguageBadgeConfig {
  badgeMapping: Record<string, string>;
  levelsInfo: (t: (key: string) => string) => BadgeLevel[];
}

export const BADGES_CONFIG: Record<string, LanguageBadgeConfig> = {
  en: {
    badgeMapping: {
      "A1": "joelsantana.png",
      "A2": "naldobenny.png",
      "B1": "richarlisson.png",
      "B2": "sabrinasato.png",
      "C1": "alcione.png",
      "C2": "nabote.png",
    },
    levelsInfo: (t) => [
      {
        code: "A1",
        label: "Beginner",
        character: "Joel Santana",
        show: "Meme Lore",
        emoji: "⚽",
        description: t("en_A1_desc"),
        quote: t("en_A1_quote"),
      },
      {
        code: "A2",
        label: "Elementary",
        character: "Naldo Benny",
        show: "USA Memes",
        emoji: "🧢",
        description: t("en_A2_desc"),
        quote: t("en_A2_quote"),
      },
      {
        code: "B1",
        label: "Intermediate",
        character: "Richarlisson",
        show: "World Cup",
        emoji: "🐦",
        description: t("en_B1_desc"),
        quote: t("en_B1_quote"),
      },
      {
        code: "B2",
        label: "Upper Intermediate",
        character: "Sabrina Sato",
        show: "TV Personality",
        emoji: "🎤",
        description: t("en_B2_desc"),
        quote: t("en_B2_quote"),
      },
      {
        code: "C1",
        label: "Advanced",
        character: "Alcione",
        show: "Brazilian Music Queen",
        emoji: "👑",
        description: t("en_C1_desc"),
        quote: t("en_C1_quote"),
      },
      {
        code: "C2",
        label: "Proficient",
        character: "Nabote",
        show: "Fluent Master",
        emoji: "😂",
        description: t("en_C2_desc"),
        quote: t("en_C2_quote"),
      },
    ],
  },
  pt: {
    badgeMapping: {
      "A1": "michaelscott.png",
      "A2": "spongeboob.png",
      "B1": "forrestgump.png",
      "B2": "joey.png",
      "C1": "walterwhite.png",
      "C2": "morganfreeman.png",
    },
    levelsInfo: (t) => [
      {
        code: "A1",
        label: "Beginner",
        character: "Michael Scott",
        show: "The Office",
        emoji: "😬",
        description: t("pt_A1_desc"),
        quote: t("pt_A1_quote"),
      },
      {
        code: "A2",
        label: "Elementary",
        character: "SpongeBob",
        show: "SpongeBob SquarePants",
        emoji: "🧽",
        description: t("pt_A2_desc"),
        quote: t("pt_A2_quote"),
      },
      {
        code: "B1",
        label: "Intermediate",
        character: "Forrest Gump",
        show: "Forrest Gump (1994)",
        emoji: "🏃",
        description: t("pt_B1_desc"),
        quote: t("pt_B1_quote"),
      },
      {
        code: "B2",
        label: "Upper Intermediate",
        character: "Joey Tribbiani",
        show: "Friends",
        emoji: "🍕",
        description: t("pt_B2_desc"),
        quote: t("pt_B2_quote"),
      },
      {
        code: "C1",
        label: "Advanced",
        character: "Walter White",
        show: "Breaking Bad",
        emoji: "⚗️",
        description: t("pt_C1_desc"),
        quote: t("pt_C1_quote"),
      },
      {
        code: "C2",
        label: "Proficient",
        character: "Morgan Freeman",
        show: "Narrator of the Universe",
        emoji: "🎙️",
        description: t("pt_C2_desc"),
        quote: t("pt_C2_quote"),
      },
    ],
  },
};
