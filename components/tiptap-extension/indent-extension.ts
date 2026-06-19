import { Extension } from "@tiptap/core"
import type { EditorState } from "@tiptap/pm/state"
import { getSelectedNodesOfType, updateNodesAttr } from "@/lib/tiptap-utils"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType
      outdent: () => ReturnType
    }
  }
}

export interface IndentOptions {
  /**
   * Node types that should support indentation style
   * @default ["paragraph", "heading", "blockquote"]
   */
  types: string[]
  /**
   * Minimum indentation level
   * @default 0
   */
  minLevel: number
  /**
   * Maximum indentation level
   * @default 8
   */
  maxLevel: number
}

/**
 * Checks if the selection is inside a list item (e.g. listItem or taskItem)
 */
function isSelectionInsideList(state: EditorState): boolean {
  const { $from } = state.selection
  for (let depth = $from.depth; depth > 0; depth--) {
    const nodeName = $from.node(depth).type.name
    if (nodeName === "listItem" || nodeName === "taskItem") {
      return true
    }
  }
  return false
}

export const Indent = Extension.create<IndentOptions>({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading", "blockquote"],
      minLevel: 0,
      maxLevel: 8,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: null,

            parseHTML: (element: HTMLElement) => {
              const level = element.style.getPropertyValue("--tt-indent-level")
              return level ? parseInt(level, 10) : null
            },

            renderHTML: (attributes) => {
              const level = attributes.indent as number | null
              if (!level || level <= 0) return {}

              return {
                "data-indent": "",
                style: `--tt-indent-level: ${level}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ state, tr, dispatch }) => {
          if (isSelectionInsideList(state)) {
            return false
          }

          const targets = getSelectedNodesOfType(state.selection, this.options.types)
          if (targets.length === 0) return false

          if (dispatch) {
            updateNodesAttr(tr, targets, "indent", (prev: unknown) => {
              const current = typeof prev === "number" ? prev : 0
              const next = current + 1
              return next <= this.options.maxLevel ? next : current
            })
          }

          return true
        },

      outdent:
        () =>
        ({ state, tr, dispatch }) => {
          if (isSelectionInsideList(state)) {
            return false
          }

          const targets = getSelectedNodesOfType(state.selection, this.options.types)
          if (targets.length === 0) return false

          if (dispatch) {
            updateNodesAttr(tr, targets, "indent", (prev: unknown) => {
              const current = typeof prev === "number" ? prev : 0
              const next = current - 1
              return next > this.options.minLevel ? next : undefined
            })
          }

          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      "Shift-Tab": () => this.editor.commands.outdent(),
    }
  },
})
