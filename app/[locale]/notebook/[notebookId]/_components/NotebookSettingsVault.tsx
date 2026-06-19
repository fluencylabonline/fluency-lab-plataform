"use client";

import { useEffect, useState } from "react";
import { 
  Settings, 
  Camera, 
  CameraOff, 
  Mic, 
  MicOff, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  AlertTriangle 
} from "lucide-react";
import { useLanguages } from "@/hooks/data/use-languages";
import { useTranslations } from "next-intl";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

interface NotebookSettingsVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotebookSettingsVault({ open, onOpenChange }: NotebookSettingsVaultProps) {
  const { languages, isLoading: isLoadingLanguages } = useLanguages();
  const t = useTranslations("NotebookSettings");
  
  const [readerLanguage, setReaderLanguage] = useState<string>("");
  const [readerSpeed, setReaderSpeed] = useState<number>(1);

  // Estados do Diagnóstico de Permissões
  const [cameraState, setCameraState] = useState<PermissionState | "unknown">("unknown");
  const [microphoneState, setPermissionState] = useState<PermissionState | "unknown">("unknown");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "failed">("idle");
  const [activeBrowserTab, setActiveBrowserTab] = useState<string>("chrome");
  const [showInstructions, setShowInstructions] = useState(false);

  // Carrega as configurações do localStorage de forma assíncrona para evitar renderização em cascata
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handle = setTimeout(() => {
        setReaderLanguage(localStorage.getItem("reader_language") || "");
        
        const savedSpeed = localStorage.getItem("reader_speed");
        if (savedSpeed) {
          setReaderSpeed(parseFloat(savedSpeed) || 1);
        }
      }, 0);
      
      return () => clearTimeout(handle);
    }
  }, []);

  // Monitora permissões em tempo real quando o Vault está aberto
  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    let camStatusObj: PermissionStatus | null = null;
    let micStatusObj: PermissionStatus | null = null;

    const handleCamChange = () => {
      if (camStatusObj) setCameraState(camStatusObj.state);
    };
    const handleMicChange = () => {
      if (micStatusObj) setPermissionState(micStatusObj.state);
    };

    const initPermissions = async () => {
      if (!navigator.permissions) return;
      try {
        camStatusObj = await navigator.permissions.query({ name: "camera" as PermissionName });
        setCameraState(camStatusObj.state);
        camStatusObj.addEventListener("change", handleCamChange);
      } catch (e) {
        console.warn("Permissions API not supported for camera:", e);
      }

      try {
        micStatusObj = await navigator.permissions.query({ name: "microphone" as PermissionName });
        setPermissionState(micStatusObj.state);
        micStatusObj.addEventListener("change", handleMicChange);
      } catch (e) {
        console.warn("Permissions API not supported for microphone:", e);
      }
    };

    initPermissions();

    return () => {
      if (camStatusObj) {
        camStatusObj.removeEventListener("change", handleCamChange);
      }
      if (micStatusObj) {
        micStatusObj.removeEventListener("change", handleMicChange);
      }
    };
  }, [open]);

  // Auto-detecta o navegador do usuário no client-side (com setTimeout para evitar renderização em cascata)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handle = setTimeout(() => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes("safari") && !userAgent.includes("chrome") && !userAgent.includes("android")) {
          setActiveBrowserTab("safari");
        } else if (userAgent.includes("firefox")) {
          setActiveBrowserTab("firefox");
        } else if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("android")) {
          setActiveBrowserTab("mobile");
        }
      }, 0);

      return () => clearTimeout(handle);
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setReaderLanguage(lang);
    if (typeof window !== "undefined") {
      if (lang) {
        localStorage.setItem("reader_language", lang);
      } else {
        localStorage.removeItem("reader_language");
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setReaderSpeed(speed);
    if (typeof window !== "undefined") {
      localStorage.setItem("reader_speed", speed.toString());
    }
  };

  const testMediaAccess = async () => {
    setTestStatus("testing");
    let camOk = false;
    let micOk = false;
    let errorMsg = "";

    // Testar câmera
    try {
      const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      camStream.getTracks().forEach((track) => track.stop());
      setCameraState("granted");
      camOk = true;
    } catch (err) {
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraState("denied");
      }
      errorMsg = error.message || "Erro ao acessar câmera";
    }

    // Testar microfone
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.getTracks().forEach((track) => track.stop());
      setPermissionState("granted");
      micOk = true;
    } catch (err) {
      const error = err as Error;
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setPermissionState("denied");
      }
      if (!errorMsg) {
        errorMsg = error.message || "Erro ao acessar microfone";
      }
    }

    if (camOk && micOk) {
      setTestStatus("success");
      notify.success(t("toastSuccess"));
    } else {
      setTestStatus("failed");
      setShowInstructions(true);
      if (cameraState === "denied" || microphoneState === "denied") {
        notify.error(t("toastBlocked"));
      } else {
        notify.error(t("toastFailed", { error: errorMsg }));
      }
    }
  };

  const renderStatusBadge = (state: PermissionState | "unknown") => {
    switch (state) {
      case "granted":
        return (
          <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {t("allowed")}
          </span>
        );
      case "denied":
        return (
          <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {t("blocked")}
          </span>
        );
      case "prompt":
        return (
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {t("pending")}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {t("notTested")}
          </span>
        );
    }
  };

  const speechSpeeds = [
    { label: "0.5x", value: 0.5 },
    { label: "0.75x", value: 0.75 },
    { label: t("normalSpeed"), value: 1 },
    { label: "1.25x", value: 1.25 },
    { label: "1.5x", value: 1.5 },
    { label: "2x", value: 2 },
  ];

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="sm:max-w-md">
        <VaultHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <VaultTitle className="text-left font-bold">{t("title")}</VaultTitle>
          </div>
          <VaultDescription className="text-left">
            {t("description")}
          </VaultDescription>
        </VaultHeader>
        <VaultBody className="p-6 space-y-5">
          {/* Seleção de Idioma */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              {t("languageLabel")}
            </label>
            <Select
              value={readerLanguage || "auto"}
              onValueChange={(val) => handleLanguageChange(val === "auto" ? "" : val)}
              disabled={isLoadingLanguages}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectLanguage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">{t("autoDetect")}</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.code}>
                    {lang.name} ({lang.code.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground leading-normal">
              {t("languageDesc")}
            </p>
          </div>

          {/* Seleção de Velocidade */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              {t("speedLabel")}
            </label>
            <Select
              value={readerSpeed.toString()}
              onValueChange={(val) => handleSpeedChange(parseFloat(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectSpeed")} />
              </SelectTrigger>
              <SelectContent>
                {speechSpeeds.map((s) => (
                  <SelectItem key={s.value} value={s.value.toString()}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground leading-normal">
              {t("speedDesc")}
            </p>
          </div>

          {/* Diagnóstico de Mídia e Permissões */}
          <div className="space-y-4 pt-5 border-t border-border">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-foreground">
                {t("devicePermissions")}
              </label>
              <p className="text-xs text-muted-foreground leading-normal">
                {t("devicePermissionsDesc")}
              </p>
            </div>

            {/* Grid de Dispositivos */}
            <div className="grid grid-cols-2 gap-3">
              {/* Câmera Card */}
              <div className="flex flex-col justify-between p-3.5 rounded-lg bg-muted/40 border border-border/80 min-h-[92px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{t("camera")}</span>
                  {cameraState === "granted" ? (
                    <Camera className="w-4 h-4 text-emerald-500" />
                  ) : cameraState === "denied" ? (
                    <CameraOff className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Camera className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-2">
                  {renderStatusBadge(cameraState)}
                </div>
              </div>

              {/* Microfone Card */}
              <div className="flex flex-col justify-between p-3.5 rounded-lg bg-muted/40 border border-border/80 min-h-[92px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{t("microphone")}</span>
                  {microphoneState === "granted" ? (
                    <Mic className="w-4 h-4 text-emerald-500" />
                  ) : microphoneState === "denied" ? (
                    <MicOff className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Mic className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-2">
                  {renderStatusBadge(microphoneState)}
                </div>
              </div>
            </div>

            {/* Botão de Teste */}
            <Button
              type="button"
              variant={testStatus === "success" ? "outline" : "default"}
              className="w-full flex items-center justify-center gap-2"
              onClick={testMediaAccess}
              disabled={testStatus === "testing"}
            >
              {testStatus === "testing" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  {t("testingDevices")}
                </>
              ) : testStatus === "success" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
                  {t("devicesReady")}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("testDevicesBtn")}
                </>
              )}
            </Button>

            {/* Link/Botão de Dica */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs text-primary font-medium hover:underline flex items-center gap-1.5 focus:outline-none"
              >
                <HelpCircle className="w-3.5 h-3.5 mr-2" />
                {showInstructions ? t("hideReset") : t("howToReset")}
              </button>
            </div>

            {/* Painel de Instruções Manuais */}
            {showInstructions && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border/60 animate-in fade-in-50 duration-200">
                <div className="flex items-start gap-2.5 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-500">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 mr-2" />
                  <p className="text-[11px] leading-snug font-medium">
                    {t("securityWarning")}
                  </p>
                </div>

                {/* Seletor de Abas de Navegador */}
                <div className="flex rounded-md bg-muted p-0.5 gap-0.5 border border-border/50">
                  {[
                    { id: "chrome", label: t("chrome") },
                    { id: "safari", label: t("safari") },
                    { id: "firefox", label: t("firefox") },
                    { id: "mobile", label: t("mobile") },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveBrowserTab(tab.id)}
                      className={cn(
                        "flex-1 py-1 text-[11px] font-semibold rounded transition-all text-center",
                        activeBrowserTab === tab.id
                          ? "bg-background text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Conteúdo de Acordo com o Navegador */}
                <div className="space-y-2.5 text-xs text-foreground/90 leading-relaxed pl-1">
                  {activeBrowserTab === "chrome" && (
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li dangerouslySetInnerHTML={{ __html: t("chromeStep1") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("chromeStep2") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("chromeStep3") }} />
                    </ol>
                  )}
                  {activeBrowserTab === "safari" && (
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li dangerouslySetInnerHTML={{ __html: t("safariStep1") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("safariStep2") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("safariStep3") }} />
                    </ol>
                  )}
                  {activeBrowserTab === "firefox" && (
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li dangerouslySetInnerHTML={{ __html: t("firefoxStep1") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("firefoxStep2") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("firefoxStep3") }} />
                    </ol>
                  )}
                  {activeBrowserTab === "mobile" && (
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li dangerouslySetInnerHTML={{ __html: t("mobileStep1") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("mobileStep2") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("mobileStep3") }} />
                      <li dangerouslySetInnerHTML={{ __html: t("mobileStep4") }} />
                    </ol>
                  )}
                </div>

                {/* Botão de Recarregar */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 border-border/80 hover:bg-muted/50 text-[11px]"
                  onClick={() => typeof window !== "undefined" && window.location.reload()}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t("reloadBtn")}
                </Button>
              </div>
            )}
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
