import { userService } from "@/modules/user/user.service";
import type { User } from "@/modules/user/user.schema";
import type { PlacementTest } from "@/modules/placement/placement.schema";

export interface StudentProficiency {
  language: string;
  code: string;
  score: number;
  date: Date;
}

/**
 * Extracts the latest proficiency level for each language from the placement history.
 * Only includes completed tests.
 */
export function getStudentProficiencies(
  user: User,
  placementHistory: (PlacementTest & { language: { code: string } })[]
): StudentProficiency[] {
  // Map of latest scores per language
  const latestScores = placementHistory
    .filter((t) => t.status === "completed" && t.finalEloScore)
    .reduce((acc, t) => {
      const langCode = t.language.code.toLowerCase();
      
      if (!acc[langCode] || new Date(t.completedAt!) > acc[langCode].date) {
        acc[langCode] = {
          score: t.finalEloScore!,
          date: new Date(t.completedAt!),
        };
      }
      return acc;
    }, {} as Record<string, { score: number; date: Date }>);

  // If user has a currentEloScore and it's newer/higher than what's in history for English, use it.
  // We assume currentEloScore is for English (primary language) by default in the platform.
  if (user.currentEloScore > 600) { // 600 is default, so > 600 means they actually have some progress
     const enDate = user.lastPlacementTestDate ? new Date(user.lastPlacementTestDate) : new Date(0);
     if (!latestScores.en || enDate >= latestScores.en.date) {
        latestScores.en = { score: user.currentEloScore, date: enDate };
     }
  }

  // Convert to array and map to CEFR codes
  return Object.entries(latestScores).map(([lang, data]) => ({
    language: lang,
    code: userService.getLevelInfo(data.score).code,
    score: data.score,
    date: data.date,
  }));
}
