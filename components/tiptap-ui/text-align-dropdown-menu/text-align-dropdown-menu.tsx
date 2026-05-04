"use client"

import { useCallback, useState } from "react"
import { type Editor } from "@tiptap/react"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { TextAlignButton, type TextAlign } from "@/components/tiptap-ui/text-align-button"
import { useTextAlignDropdownMenu } from "./use-text-align-dropdown-menu"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
} from "@/components/tiptap-ui-primitive/dropdown-menu"

export interface TextAlignDropdownMenuProps {
  editor?: Editor
  types?: TextAlign[]
  hideWhenUnavailable?: boolean
  modal?: boolean
}

export function TextAlignDropdownMenu({
  editor: providedEditor,
  types = ["left", "center", "right", "justify"],
  hideWhenUnavailable = false,
  modal = true,
}: TextAlignDropdownMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = useState(false)

  const { filteredAligns, canToggle, isActive, isVisible, Icon } =
    useTextAlignDropdownMenu({
      editor,
      types,
      hideWhenUnavailable,
    })

  const handleOnOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  if (!isVisible) return null

  return (
    <DropdownMenu modal={modal} open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          data-active-state={isActive ? "on" : "off"}
          disabled={!canToggle}
          aria-label="Text alignment"
          tooltip="Alignment"
        >
          <Icon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {filteredAligns.map((option) => (
            <DropdownMenuItem key={option.type} asChild>
              <TextAlignButton
                editor={editor}
                align={option.type}
                text={option.label}
                showShortcut={false}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TextAlignDropdownMenu
