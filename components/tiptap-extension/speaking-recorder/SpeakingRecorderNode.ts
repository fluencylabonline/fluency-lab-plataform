import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SpeakingRecorderView } from "./SpeakingRecorderView";

export interface SpeakingNodeAttributes {
  nodeId: string;
  audioUrl: string;
  filePath: string;
}

function generateNodeId(): string {
  return `speaking_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    speaking: {
      insertSpeaking: (
        attrs?: Partial<SpeakingNodeAttributes>
      ) => ReturnType;
    };
  }
}

export const SpeakingRecorderNode = Node.create({
  name: "speaking",
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
      audioUrl: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-audio-url"),
        renderHTML: (attrs) => ({ "data-audio-url": attrs.audioUrl }),
      },
      filePath: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-file-path"),
        renderHTML: (attrs) => ({ "data-file-path": attrs.filePath }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="speaking-recorder"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "speaking-recorder" }),
    ];
  },

  addCommands() {
    return {
      insertSpeaking:
        (attrs?: Partial<SpeakingNodeAttributes>) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              nodeId: attrs?.nodeId ?? generateNodeId(),
              audioUrl: attrs?.audioUrl ?? "",
              filePath: attrs?.filePath ?? "",
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpeakingRecorderView);
  },
});
