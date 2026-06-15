"use client"

import { useCallback, useState } from "react"
import { type Editor } from "@tiptap/react"
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"
import { ChevronDownIcon } from "@/components/tiptap-icons/chevron-down-icon"
import { Button } from "@/components/tiptap-ui-primitive/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/tiptap-ui-primitive/dropdown-menu"
import {
  Table as TableIcon,
  Plus,
  Trash2,
  Merge,
  Split,
  Heading,
} from "lucide-react"

export interface TableDropdownMenuProps {
  editor?: Editor
  modal?: boolean
}

export function TableDropdownMenu({
  editor: providedEditor,
  modal = true,
}: TableDropdownMenuProps) {
  const { editor } = useTiptapEditor(providedEditor)
  const [isOpen, setIsOpen] = useState(false)

  const handleOnOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  if (!editor || !editor.isEditable) return null

  const isInsideTable = editor.isActive("table")

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  return (
    <DropdownMenu modal={modal} open={isOpen} onOpenChange={handleOnOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          data-active-state={isInsideTable ? "on" : "off"}
          aria-label="Table options"
          tooltip={isInsideTable ? "Editar Tabela" : "Inserir Tabela"}
        >
          <TableIcon className="tiptap-button-icon" />
          <ChevronDownIcon className="tiptap-button-dropdown-small" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        {!isInsideTable ? (
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={insertTable} className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-muted-foreground" />
              <span>Inserir Tabela (3x3)</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-muted-foreground rotate-90" />
                <span>Adicionar Linha Acima</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
                <span>Adicionar Linha Abaixo</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Linha</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
                <span>Adicionar Coluna Esquerda</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
                <span>Adicionar Coluna Direita</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Coluna</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().mergeCells().run()}
                className="flex items-center gap-2"
              >
                <Merge className="w-4 h-4 text-muted-foreground" />
                <span>Mesclar Células</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().splitCell().run()}
                className="flex items-center gap-2"
              >
                <Split className="w-4 h-4 text-muted-foreground" />
                <span>Dividir Célula</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                className="flex items-center gap-2"
              >
                <Heading className="w-4 h-4 text-muted-foreground" />
                <span>Alternar Linha de Cabeçalho</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir Tabela</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TableDropdownMenu
