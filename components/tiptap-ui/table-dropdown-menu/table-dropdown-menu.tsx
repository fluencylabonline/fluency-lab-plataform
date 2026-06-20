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
            <DropdownMenuItem asChild>
              <Button
                type="button"
                variant="ghost"
                onClick={insertTable}
                showTooltip={false}
              >
                <TableIcon className="tiptap-button-icon text-muted-foreground" />
                <span className="tiptap-button-text">Inserir Tabela (3x3)</span>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        ) : (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  showTooltip={false}
                >
                  <Plus className="tiptap-button-icon text-muted-foreground rotate-90" />
                  <span className="tiptap-button-text">Adicionar Linha Acima</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  showTooltip={false}
                >
                  <Plus className="tiptap-button-icon text-muted-foreground" />
                  <span className="tiptap-button-text">Adicionar Linha Abaixo</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  showTooltip={false}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="tiptap-button-icon" />
                  <span className="tiptap-button-text">Excluir Linha</span>
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                  showTooltip={false}
                >
                  <Plus className="tiptap-button-icon text-muted-foreground" />
                  <span className="tiptap-button-text">Adicionar Coluna Esquerda</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  showTooltip={false}
                >
                  <Plus className="tiptap-button-icon text-muted-foreground" />
                  <span className="tiptap-button-text">Adicionar Coluna Direita</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  showTooltip={false}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="tiptap-button-icon" />
                  <span className="tiptap-button-text">Excluir Coluna</span>
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  showTooltip={false}
                >
                  <Merge className="tiptap-button-icon text-muted-foreground" />
                  <span className="tiptap-button-text">Mesclar Células</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().splitCell().run()}
                  showTooltip={false}
                >
                  <Split className="tiptap-button-icon text-muted-foreground" />
                  <span className="tiptap-button-text">Dividir Célula</span>
                </Button>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                  showTooltip={false}
                >
                  <Heading className="tiptap-button-icon text-muted-foreground" />
                  <span className="tiptap-button-text">Alternar Linha de Cabeçalho</span>
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  showTooltip={false}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="tiptap-button-icon" />
                  <span className="tiptap-button-text">Excluir Tabela</span>
                </Button>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TableDropdownMenu
