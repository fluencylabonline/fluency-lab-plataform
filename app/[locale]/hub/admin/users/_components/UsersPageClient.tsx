"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateUserVault } from "./CreateUserVault";
import { PermissionGuard } from "@/components/ui/permission-guard";

export function UsersPageClient() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("UserManagement");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PermissionGuard permission="user.create">
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="w-5 h-5 mr-2" />
            {t("createUser")}
          </Button>
        </PermissionGuard>
      </div>

      <CreateUserVault open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
