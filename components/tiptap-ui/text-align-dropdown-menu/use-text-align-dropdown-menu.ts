"use client"

import { useMemo } from "react"
import { type Editor } from "@tiptap/react"
import { 
  TextAlign, 
  textAlignIcons, 
  textAlignLabels,
  isTextAlignActive,
  canSetTextAlign,
  shouldShowButton
} from "@/components/tiptap-ui/text-align-button"

interface UseTextAlignDropdownMenuProps {
  editor: Editor | null
  types: TextAlign[]
  hideWhenUnavailable?: boolean
}

export function useTextAlignDropdownMenu({
  editor,
  types,
  hideWhenUnavailable = false,
}: UseTextAlignDropdownMenuProps) {
  const activeAlign = useMemo(() => {
    return types.find((type) => isTextAlignActive(editor, type)) || "left"
  }, [editor, types])

  const canToggle = useMemo(() => {
    return types.some((type) => canSetTextAlign(editor, type))
  }, [editor, types])

  const isVisible = useMemo(() => {
    return types.some((type) => shouldShowButton({ editor, align: type, hideWhenUnavailable }))
  }, [editor, types, hideWhenUnavailable])

  const filteredAligns = useMemo(() => {
    return types.map((type) => ({
      type,
      label: textAlignLabels[type],
    }))
  }, [types])

  return {
    filteredAligns,
    canToggle,
    isActive: !!activeAlign && activeAlign !== "left",
    isVisible,
    Icon: textAlignIcons[activeAlign],
  }
}
