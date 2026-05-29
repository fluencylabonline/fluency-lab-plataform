import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { LyricsSyncView } from "./LyricsSyncView";

export interface LyricsSyncNodeAttributes {
  nodeId: string;
  videoUrl: string;
  track: string;
  artist: string;
  lrc: string;
  pauseEvery: 1 | 2;
}

function generateNodeId(): string {
  return `lyrics_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lyricsSync: {
      insertLyricsSync: (
        attrs?: Partial<LyricsSyncNodeAttributes>
      ) => ReturnType;
    };
  }
}

export const LyricsSyncNode = Node.create({
  name: "lyricsSync",
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
      videoUrl: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-video-url"),
        renderHTML: (attrs) => ({ "data-video-url": attrs.videoUrl }),
      },
      track: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-track"),
        renderHTML: (attrs) => ({ "data-track": attrs.track }),
      },
      artist: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-artist"),
        renderHTML: (attrs) => ({ "data-artist": attrs.artist }),
      },
      lrc: {
        default: "",
        parseHTML: (el) => el.getAttribute("data-lrc"),
        renderHTML: (attrs) => ({ "data-lrc": attrs.lrc }),
      },
      pauseEvery: {
        default: 1,
        parseHTML: (el) => {
          const val = el.getAttribute("data-pause-every");
          return val ? (parseInt(val, 10) as 1 | 2) : 1;
        },
        renderHTML: (attrs) => ({ "data-pause-every": String(attrs.pauseEvery) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="lyrics-sync"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "lyrics-sync" }),
    ];
  },

  addCommands() {
    return {
      insertLyricsSync:
        (attrs?: Partial<LyricsSyncNodeAttributes>) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              nodeId: generateNodeId(),
              videoUrl: attrs?.videoUrl ?? "",
              track: attrs?.track ?? "",
              artist: attrs?.artist ?? "",
              lrc: attrs?.lrc ?? "",
              pauseEvery: attrs?.pauseEvery ?? 1,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(LyricsSyncView);
  },
});
