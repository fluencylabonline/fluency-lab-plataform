"use client";

import { useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { LogOut, RefreshCw } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Shimmer } from "@shimmer-from-structure/react";

import { authClient } from "@/lib/auth-client";
import { storage } from "@/lib/firebase";
import { useUserStore } from "../user.store";
import { syncUserAction } from "@/modules/user/user.actions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { notify } from "@/components/ui/toaster";
import { User } from "../user.schema";
import { Button } from "@/components/ui/button";

interface ProfileCardProps {
  user?: User | null;
  isLoading?: boolean;
}

const mockUser: Partial<User> = {
  name: "Loading Name...",
  email: "loading@email.com",
  role: "student",
  photoUrl: null,
};

export function ProfileCard({ user, isLoading = false }: ProfileCardProps) {
  const t = useTranslations("Hub.Profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user: storedUser, setUser, hasHydrated } = useUserStore();

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify.error(t("error") || "File too large");
      return;
    }

    try {
      setIsUploading(true);

      const storageRef = ref(storage, `avatars/${user.id}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const result = await syncUserAction({ photoUrl: downloadURL });

      if (result?.data?.success) {
        notify.success(t("success") || "Profile updated");
        setUser({ ...user, photoUrl: downloadURL });
      } else {
        const errorKey = result?.data?.error;
        notify.error(errorKey === "rateLimitExceeded" ? t("rateLimitExceeded") : t("error"));
      }
    } catch (error) {
      console.error("[ProfileCard.handleFileChange] Error:", error);
      notify.error(t("error") || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onLogout = async () => {
    await authClient.signOut();
  };

  const displayUser = user || (hasHydrated ? storedUser : null) || mockUser;
  const userRoleLabel = t(`roles.${displayUser.role}`) || displayUser.role;

  return (
    <Shimmer loading={isLoading && !storedUser} templateProps={{ user: mockUser }}>
      <div className="card p-4 flex flex-row justify-between items-center">
        <div className="flex flex-row items-center sm:items-start gap-4">
          <div className="relative">
            <Avatar size="xl">
              <AvatarImage
                src={displayUser.photoUrl || ""}
                alt={displayUser.name || t("profilePicture")}
              />
              <AvatarFallback name={displayUser.name} />
            </Avatar>
            <button
              onClick={handleAvatarClick}
              disabled={isUploading || isLoading}
              className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 ring-4 ring-background"
              title={t("changeProfilePicture")}
              data-shimmer-ignore
            >
              {isUploading ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div className="flex flex-col items-start mt-0 sm:mt-2">
            <p className="font-semibold text-lg capitalize text-foreground">
              {displayUser.name}
            </p>
            <p className="text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-none">
              {displayUser.email}
            </p>
            <Badge variant="default" className="mt-2 px-3">
              {userRoleLabel}
            </Badge>
          </div>
        </div>

        <button
          onClick={onLogout}
          disabled={isLoading}
          className="hidden sm:block p-3 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors shrink-0 disabled:opacity-50"
          title={t("logout")}
          data-shimmer-ignore
        >
          <LogOut className="w-5 h-5" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          disabled={isUploading || isLoading}
        />
      </div>

      <Button>
        Botão de teste
      </Button>
    </Shimmer>
  );
}
