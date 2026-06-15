"use client"

import { forwardRef, useState } from "react"
import { type Editor } from "@tiptap/react"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { Baseline as BaselineIcon, Ban as BanIcon } from "lucide-react"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/tiptap-ui-primitive/popover"
import { Separator } from "@/components/tiptap-ui-primitive/separator"
import {
  Card,
  CardBody,
  CardItemGroup,
} from "@/components/tiptap-ui-primitive/card"
import { ButtonGroup } from "@/components/tiptap-ui-primitive/button-group"

// --- Styles ---
import "./text-color-button.scss"

export const TEXT_COLORS = [
  { label: "Padrão", value: "inherit", colorValue: "currentColor" },
  { label: "Cinza", value: "#6b7280", colorValue: "#6b7280" },
  { label: "Marrom", value: "#92400e", colorValue: "#92400e" },
  { label: "Laranja", value: "#ea580c", colorValue: "#ea580c" },
  { label: "Amarelo", value: "#ca8a04", colorValue: "#ca8a04" },
  { label: "Verde", value: "#16a34a", colorValue: "#16a34a" },
  { label: "Azul", value: "#2563eb", colorValue: "#2563eb" },
  { label: "Roxo", value: "#9333ea", colorValue: "#9333ea" },
  { label: "Rosa", value: "#db2777", colorValue: "#db2777" },
  { label: "Vermelho", value: "#dc2626", colorValue: "#dc2626" },
]

export interface TextColorPopoverProps extends Omit<ButtonProps, "type"> {
  editor?: Editor | null
}

export const TextColorPopover = forwardRef<HTMLButtonElement, TextColorPopoverProps>(
  ({ editor: providedEditor, ...props }, ref) => {
    const { editor } = useTiptapEditor(providedEditor)
    const [isOpen, setIsOpen] = useState(false)
    const isMobile = useIsBreakpoint()

    if (!editor || !editor.isEditable) return null

    // Determine if any custom text color is currently active
    const activeColor = TEXT_COLORS.find(
      (c) => c.value !== "inherit" && editor.isActive("textStyle", { color: c.value })
    )
    const hasActiveColor = !!activeColor

    const handleSelectColor = (color: string) => {
      if (color === "inherit") {
        editor.chain().focus().unsetColor().run()
      } else {
        editor.chain().focus().setColor(color).run()
      }
      setIsOpen(false)
    }

    const handleClearColor = () => {
      editor.chain().focus().unsetColor().run()
      setIsOpen(false)
    }

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            data-active-state={hasActiveColor ? "on" : "off"}
            aria-label="Cor do texto"
            tooltip="Cor do Texto"
            ref={ref}
            {...props}
          >
            <BaselineIcon className="tiptap-button-icon" />
          </Button>
        </PopoverTrigger>

        <PopoverContent aria-label="Cores do texto">
          <Card style={isMobile ? { boxShadow: "none", border: 0 } : {}}>
            <CardBody style={isMobile ? { padding: 0 } : {}}>
              <CardItemGroup orientation="horizontal">
                <ButtonGroup>
                  {TEXT_COLORS.map((color) => {
                    const isCurrentActive =
                      color.value === "inherit"
                        ? !hasActiveColor
                        : editor.isActive("textStyle", { color: color.value })

                    return (
                      <ButtonGroup key={color.value}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleSelectColor(color.value)}
                          data-active-state={isCurrentActive ? "on" : "off"}
                          aria-label={color.label}
                          tooltip={color.label}
                          style={
                            {
                              "--text-color-value": color.colorValue,
                            } as React.CSSProperties
                          }
                        >
                          <span className="tiptap-button-text-color-circle" />
                        </Button>
                      </ButtonGroup>
                    )
                  })}
                </ButtonGroup>
                <Separator />
                <ButtonGroup>
                  <Button
                    onClick={handleClearColor}
                    aria-label="Remover cor"
                    tooltip="Remover cor"
                    type="button"
                    variant="ghost"
                  >
                    <BanIcon className="tiptap-button-icon" />
                  </Button>
                </ButtonGroup>
              </CardItemGroup>
            </CardBody>
          </Card>
        </PopoverContent>
      </Popover>
    )
  }
)

TextColorPopover.displayName = "TextColorPopover"

export default TextColorPopover
