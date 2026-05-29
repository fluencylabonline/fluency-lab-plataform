export interface QuizQuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestionExplanations {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
  general?: string;
  [key: string]: string | undefined;
}

export type QuizQuestionType = "multiple-choice" | "written";
export type QuizQuestionCategory = "comprehension" | "grammar" | "vocabulary" | "review";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  category: QuizQuestionCategory;
  questionText: string;
  options?: QuizQuestionOption[];
  correctOptionId?: string;
  correctWrittenAnswer?: string;
  explanations: QuizQuestionExplanations;
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface QuizNodeAttributes {
  nodeId: string;
  questions: QuizQuestion[];
  studentAnswers: Record<string, string>;
  submitted: boolean;
}
