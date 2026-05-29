import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { YouTubeSyncView } from "./YoutubeSyncView";

export interface YouTubeNodeAttributes {
  nodeId: string;
  url: string;
}

function generateNodeId(): string {
  return `yt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Extend Tiptap Commands type to include our custom command
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    youtubeSync: {
      insertYouTubeSync: (
        attrs?: Partial<YouTubeNodeAttributes>
      ) => ReturnType;
    };
  }
}

export const YouTubeSyncNode = Node.create({
  name: "youtubeSync",
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
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="youtube-sync"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "youtube-sync" }),
    ];
  },

  addCommands() {
    return {
      insertYouTubeSync:
        (attrs?: Partial<YouTubeNodeAttributes>) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              nodeId: generateNodeId(),
              url: attrs?.url ?? "",
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeSyncView);
  },
});
