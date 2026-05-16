"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultBody,
  VaultIcon,
} from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { syncUserPhotoAction } from "../user.actions";
import { notify } from "@/components/ui/toaster";
import { getCroppedImg } from "@/utils/image-crop";

interface AvatarUploadVaultProps {
  userId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AvatarUploadVault({ userId, isOpen, onOpenChange }: AvatarUploadVaultProps) {
  const t = useTranslations("Settings");
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!image || !croppedAreaPixels) return;

    const promise = (async () => {
      setIsUploading(true);
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        const storageRef = ref(storage, `avatars/${userId}`);
        
        const response = await fetch(croppedImage);
        const blob = await response.blob();

        await uploadBytes(storageRef, blob);
        const photoUrl = await getDownloadURL(storageRef);

        const result = await syncUserPhotoAction({ photoUrl });
        
        if (result?.data?.success) {
          onOpenChange(false);
          setImage(null);
          return t("uploadSuccess");
        }
        
        throw new Error(result?.data?.error || "Erro ao sincronizar foto");
      } finally {
        setIsUploading(false);
      }
    })();

    notify.promise(promise, {
      loading: t("processingImage") || "Processando imagem...",
      success: (msg) => msg,
      error: (err: unknown) => (err as Error).message || "Erro ao processar imagem",
    });
  };

  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="user" />
          <VaultTitle>{t("avatar")}</VaultTitle>
        </VaultHeader>

        <VaultBody>
          <div className="flex flex-col gap-6">
            {!image ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-12 bg-muted/50 hover:bg-muted transition-colors relative group">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={handleFileChange}
                />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-center text-sm font-medium">
                  {t("uploadAvatar")}
                </p>
                <p className="text-center text-xs text-muted-foreground mt-1">
                  JPG, PNG ou WebP (Máx. 5MB)
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative h-72 w-full bg-zinc-950 rounded-md overflow-hidden border">
                  <Cropper
                    image={image}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">Zoom</span>
                    <span className="text-xs font-mono">{zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setImage(null)} disabled={isUploading}>
                    {t("changeAvatar")}
                  </Button>
                  <Button className="flex-1" onClick={handleUpload} isLoading={isUploading}>
                    {t("cropAndSave")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
