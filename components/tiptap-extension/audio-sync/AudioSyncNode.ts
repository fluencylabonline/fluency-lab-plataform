import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { AudioSyncView } from "./AudioSyncView";
export interface AudioNodeAttributes {
  nodeId: string;
  url: string;
  title: string;
  transcription: string;
}

function generateNodeId(): string {
  return `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Estende a tipagem de comandos do Tiptap para incluir o nosso comando customizado
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    audioSync: {
      insertAudioSync: (
        attrs: Omit<AudioNodeAttributes, "nodeId"> & Partial<Pick<AudioNodeAttributes, "nodeId">>
      ) => ReturnType;
    };
  }
}

export const AudioSyncNode = Node.create({
  name: "audioSync",
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
      url: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-url"),
        renderHTML: (attrs) => ({ "data-url": attrs.url }),
      },
      title: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-title"),
        renderHTML: (attrs) => ({ "data-title": attrs.title }),
      },
      transcription: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-transcription"),
        renderHTML: (attrs) => ({ "data-transcription": attrs.transcription }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio-sync"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "audio-sync" }),
    ];
  },

  addCommands() {
    return {
      insertAudioSync:
        (attrs: Omit<AudioNodeAttributes, "nodeId"> & Partial<Pick<AudioNodeAttributes, "nodeId">>) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              nodeId: attrs.nodeId ?? generateNodeId(),
              url: attrs.url,
              title: attrs.title,
              transcription: attrs.transcription,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioSyncView);
  },
});
