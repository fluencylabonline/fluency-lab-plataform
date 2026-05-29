"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Music, 
  UploadCloud, 
  Search, 
  Loader2, 
  FileAudio,
  Globe,
  Award,
} from "lucide-react";

// --- Vault & UI UI Components ---
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
} from "@/components/ui/vault";
import { Field } from "@/components/ui/field";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { notify } from "@/components/ui/toaster";

// --- Form Components ---
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Actions & Tiptap Editor ---
import { createAudioAction, listAudiosAction } from "@/modules/audio/audio.actions";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Firebase ---
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// --- Interfaces & Schemas ---
interface NotebookAudioSyncVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DBConfigAudio {
  id: string;
  title: string;
  language: string;
  level: string;
  transcription: string;
  fileUrl: string;
}

// 8MB max size em bytes
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg", 
  "audio/mp3", 
  "audio/wav", 
  "audio/ogg", 
  "audio/m4a", 
  "audio/x-m4a", 
  "audio/aac"
];

// Zod Schema para Validação do Formulário no Cliente
const uploadFormSchema = z.object({
  title: z.string()
    .min(1, "O título é obrigatório")
    .max(100, "O título deve ter no máximo 100 caracteres"),
  language: z.string().min(1, "O idioma é obrigatório"),
  level: z.string().min(1, "O nível é obrigatório"),
  transcription: z.string().min(1, "A transcrição é obrigatória"),
  file: z.any()
    .refine((files) => files && files.length > 0, "O arquivo de áudio é obrigatório")
    .refine(
      (files) => files && files[0]?.size <= MAX_FILE_SIZE, 
      "O arquivo deve ter no máximo 8MB"
    )
    .refine(
      (files) => files && ACCEPTED_AUDIO_TYPES.includes(files[0]?.type),
      "Formato inválido. Use MP3, WAV, M4A, OGG ou AAC"
    ),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

export function NotebookAudioSyncVault({ open, onOpenChange }: NotebookAudioSyncVaultProps) {
  const { editor } = useTiptapEditor();
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  // Estados da Biblioteca
  const [audios, setAudios] = useState<DBConfigAudio[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Estados de Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      title: "",
      language: "",
      level: "",
      transcription: "",
    },
  });

  const selectedFiles = watch("file");
  const selectedFile = selectedFiles && selectedFiles[0] ? selectedFiles[0] : null;

  // ── Buscar Áudios da Biblioteca ───────────────────────────────────────────
  const fetchLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const result = await listAudiosAction(undefined);
      if (result?.data?.success) {
        setAudios(result.data.audios as DBConfigAudio[]);
      } else {
        notify.error("Erro ao carregar biblioteca de áudios.");
      }
    } catch (error) {
      console.error("Failed to load audio library:", error);
      notify.error("Erro ao conectar ao servidor.");
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  useEffect(() => {
    if (open && activeTab === "library") {
      fetchLibrary();
    }
  }, [open, activeTab]);

  // ── Submissão e Upload do Áudio ─────────────────────────────────────────────
  const onSubmit = async (values: UploadFormValues) => {
    if (!editor) return;

    setIsUploading(true);
    setUploadProgress(0);

    const file = values.file[0] as File;
    const userId = ((globalThis as Record<string, unknown>).__userId as string) ?? "anonymous";

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = `notebooks/audio/${userId}/${fileName}`;
    const storageRef = ref(storage, filePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Firebase Storage Upload Error:", error);
        notify.error("Falha ao fazer upload do arquivo para o Storage.");
        setIsUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          // Criar registro no banco Neon
          const dbResult = await createAudioAction({
            title: values.title.trim(),
            language: values.language,
            level: values.level,
            transcription: values.transcription.trim(),
            fileUrl: downloadUrl,
            filePath: filePath,
          });

          if (dbResult?.data?.success && dbResult.data.audio) {
            // Inserir node no Tiptap
            editor.chain().focus().insertAudioSync({
              url: downloadUrl,
              title: values.title.trim(),
              transcription: values.transcription.trim(),
            }).run();

            notify.success("Áudio criado e inserido com sucesso!");
            reset();
            onOpenChange(false);
          } else {
            notify.error(dbResult?.serverError || "Erro ao salvar metadados do áudio.");
          }
        } catch (error) {
          console.error("Failed to complete audio creation:", error);
          notify.error("Falha ao salvar no banco de dados.");
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      }
    );
  };

  // ── Escolher Áudio da Biblioteca ──────────────────────────────────────────
  const handleSelectFromLibrary = (audio: DBConfigAudio) => {
    if (!editor) return;

    editor.chain().focus().insertAudioSync({
      url: audio.fileUrl,
      title: audio.title,
      transcription: audio.transcription,
    }).run();

    notify.success(`Áudio "${audio.title}" inserido!`);
    onOpenChange(false);
  };

  // Filtrar áudios na biblioteca local
  const filteredAudios = audios.filter((audio) => {
    const query = searchQuery.toLowerCase();
    return (
      audio.title.toLowerCase().includes(query) ||
      audio.language.toLowerCase().includes(query) ||
      audio.level.toLowerCase().includes(query)
    );
  });

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="sm:max-w-2xl max-h-[85vh]">
        <VaultHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-full text-amber-600">
              <Music className="w-5 h-5" />
            </div>
            <VaultTitle className="text-left font-bold">
              Áudio Sincronizado
            </VaultTitle>
          </div>
          <VaultDescription className="text-left">
            Incorpore uma trilha de áudio com transcrição integrada e controle síncrono em tempo real.
          </VaultDescription>
        </VaultHeader>

        {/* Abas */}
        <div className="flex border-b px-6 bg-muted/20">
          <button
            onClick={() => {
              setActiveTab("library");
              setSearchQuery("");
            }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "library"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Escolher da Biblioteca
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === "upload"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload de Áudio
          </button>
        </div>

        <VaultBody className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === "library" ? (
            <div className="space-y-4">
              
              {/* Barra de Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, idioma ou nível..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full pl-9 pr-4 py-2 border rounded-xl text-sm"
                />
              </div>

              {/* Lista/Biblioteca */}
              {isLoadingLibrary ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-sm text-muted-foreground">Carregando biblioteca global...</p>
                </div>
              ) : filteredAudios.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredAudios.map((audio) => (
                    <button
                      key={audio.id}
                      onClick={() => handleSelectFromLibrary(audio)}
                      className="item text-left p-4 border rounded-xl hover:border-amber-500/50 transition-all flex flex-col gap-2 relative bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-bold text-sm text-foreground line-clamp-1">
                          {audio.title}
                        </h5>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full capitalize">
                          <Globe className="w-3 h-3 text-amber-500" />
                          {audio.language}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                          <Award className="w-3 h-3 text-amber-500" />
                          {audio.level}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8">
                  <Empty className="border-none py-8">
                    <EmptyHeader>
                      <EmptyTitle>Nenhum áudio encontrado</EmptyTitle>
                      <EmptyDescription>
                        {searchQuery
                          ? "Tente buscar por termos diferentes ou confira o idioma/nível."
                          : "Ainda não existem áudios na biblioteca. Clique na aba Upload para cadastrar o primeiro!"}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              )}
            </div>
          ) : (
            
            // Formulário de Upload
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Drag and Drop / Input de arquivo */}
              <Field label="Arquivo de Áudio" required error={errors.file?.message as string}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
                    selectedFile 
                      ? "border-amber-500/50 bg-amber-500/5" 
                      : "border-muted-foreground/20 hover:border-amber-500/30 hover:bg-muted/10"
                  }`}
                >
                  <input
                    type="file"
                    accept="audio/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setValue("file", e.target.files, { shouldValidate: true });
                      }
                    }}
                  />
                  {selectedFile ? (
                    <>
                      <FileAudio className="w-10 h-10 text-amber-500" />
                      <div>
                        <p className="text-sm font-bold text-foreground truncate max-w-md">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB de 8 MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-10 h-10 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          Clique para selecionar ou arraste o áudio aqui
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Formatos suportados: MP3, WAV, M4A, OGG, AAC (Máximo 8MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Field>

              {/* Título do Áudio */}
              <Field label="Título do Áudio" required error={errors.title?.message}>
                <Input
                  type="text"
                  placeholder="Ex: Diálogo sobre direções em Nova York"
                  className="w-full border rounded-xl"
                  {...register("title")}
                />
              </Field>

              {/* Idioma e Nível Lado a Lado */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Idioma" required error={errors.language?.message}>
                  <Select onValueChange={(val) => setValue("language", val, { shouldValidate: true })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">Inglês</SelectItem>
                      <SelectItem value="es">Espanhol</SelectItem>
                      <SelectItem value="fr">Francês</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="de">Alemão</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Nível Aproximado" required error={errors.level?.message}>
                  <Select onValueChange={(val) => setValue("level", val, { shouldValidate: true })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 (Iniciante)</SelectItem>
                      <SelectItem value="A2">A2 (Básico)</SelectItem>
                      <SelectItem value="B1">B1 (Intermediário)</SelectItem>
                      <SelectItem value="B2">B2 (Intermediário Avançado)</SelectItem>
                      <SelectItem value="C1">C1 (Avançado)</SelectItem>
                      <SelectItem value="C2">C2 (Fluente)</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {/* Transcrição Escrita */}
              <Field label="Transcrição Completa" required error={errors.transcription?.message}>
                <Textarea
                  placeholder="Insira aqui todo o texto falado no áudio para o acompanhamento do aluno..."
                  rows={4}
                  className="w-full border rounded-xl min-h-[100px]"
                  {...register("transcription")}
                />
              </Field>

              {/* Barra de Progresso do Upload */}
              {isUploading && (
                <div className="space-y-1.5 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                  <div className="flex justify-between text-xs font-semibold text-amber-700">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Fazendo upload do áudio...
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <VaultFooter className="p-0 pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    onOpenChange(false);
                  }}
                  disabled={isUploading}
                  className="btn px-4 py-2 border rounded-xl text-sm font-medium hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="btn px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Cadastrar e Inserir"
                  )}
                </button>
              </VaultFooter>
            </form>
          )}
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
