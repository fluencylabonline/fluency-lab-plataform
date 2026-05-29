import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { QuizView } from "./QuizView";
import type { QuizNodeAttributes } from "./quiz.types";

function generateNodeId(): string {
  return `quiz_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    quiz: {
      insertQuiz: (attrs?: Partial<QuizNodeAttributes>) => ReturnType;
    };
  }
}

export const QuizNode = Node.create({
  name: "quiz",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      nodeId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-node-id"),
        renderHTML: (attrs) => ({ "data-node-id": attrs.nodeId }),
      },
      questions: {
        default: [],
        parseHTML: (el) => {
          const val = el.getAttribute("data-questions");
          try {
            return val ? JSON.parse(val) : [];
          } catch {
            return [];
          }
        },
        renderHTML: (attrs) => ({ "data-questions": JSON.stringify(attrs.questions) }),
      },
      studentAnswers: {
        default: {},
        parseHTML: (el) => {
          const val = el.getAttribute("data-student-answers");
          try {
            return val ? JSON.parse(val) : {};
          } catch {
            return {};
          }
        },
        renderHTML: (attrs) => ({ "data-student-answers": JSON.stringify(attrs.studentAnswers) }),
      },
      submitted: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-submitted") === "true",
        renderHTML: (attrs) => ({ "data-submitted": String(attrs.submitted) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="interactive-quiz"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "interactive-quiz" }),
    ];
  },

  addCommands() {
    return {
      insertQuiz:
        (attrs?: Partial<QuizNodeAttributes>) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              nodeId: generateNodeId(),
              questions: attrs?.questions ?? [],
              studentAnswers: attrs?.studentAnswers ?? {},
              submitted: attrs?.submitted ?? false,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuizView);
  },
});
