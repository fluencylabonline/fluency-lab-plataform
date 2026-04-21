const ELO_MIN = 100;
const ELO_MAX = 1100;

// Dynamic K-Factors to cover the entire scale (0 to ~1200) in 25 questions
const getStudentKFactor = (questionsAnswered: number) => {
  if (questionsAnswered < 5) return 64; // Exploration phase (long jumps)
  if (questionsAnswered < 15) return 48; // Approach phase
  return 32; // Fine-tuning phase
};

const getQuestionKFactor = (timesAnswered: number) => {
  if (timesAnswered < 20) return 32; // New AI generated question needs fast calibration
  if (timesAnswered < 100) return 16;
  return 8; // Stabilized question
};

export function calculateElo(
  studentScore: number,
  questionDifficulty: number,
  isCorrect: boolean,
  studentQuestionsAnswered: number,
  questionTimesAnswered: number
) {
  const expectedStudentWin =
    1 / (1 + Math.pow(10, (questionDifficulty - studentScore) / 400));
  const expectedQuestionWin = 1 - expectedStudentWin;

  const actualStudentResult = isCorrect ? 1 : 0;
  const actualQuestionResult = isCorrect ? 0 : 1;

  const kStudent = getStudentKFactor(studentQuestionsAnswered);
  const kQuestion = getQuestionKFactor(questionTimesAnswered);

  const newStudentScore =
    studentScore + kStudent * (actualStudentResult - expectedStudentWin);
  const newQuestionDifficulty =
    questionDifficulty + kQuestion * (actualQuestionResult - expectedQuestionWin);

  return {
    newStudentScore: Math.min(
      ELO_MAX,
      Math.max(ELO_MIN, Math.round(newStudentScore))
    ),
    newQuestionDifficulty: Math.round(newQuestionDifficulty),
  };
}

/**
 * Helper to map an Elo score to a CEFR level based on our defined ranges.
 */
export function mapEloToCEFR(elo: number): string {
  if (elo < 275) return "A1"; // Base 200 (100 - 300)
  if (elo < 425) return "A2"; // Base 350 (275 - 425)
  if (elo < 575) return "B1"; // Base 500 (425 - 575)
  if (elo < 725) return "B2"; // Base 650 (575 - 725)
  if (elo < 875) return "C1"; // Base 800 (725 - 875)
  return "C2"; // Base 950 (875 - 1050)
}
