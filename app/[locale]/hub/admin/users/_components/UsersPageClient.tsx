"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Mail, Shield, Circle } from "lucide-react";
import { CreateUserVault } from "./CreateUserVault";
import { Header } from "@/components/layout/header";
import { hasPermission, Role } from "@/lib/rbac";
import type { User } from "@/modules/user/user.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyResults } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UsersPageClientProps {
  initialData: User[];
  currentUser: User;
}

export function UsersPageClient({ initialData, currentUser }: UsersPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const t = useTranslations("UserManagement");
  const tNav = useTranslations("Navigation");
  const tRoles = useTranslations("UserRoles");
  const tCommon = useTranslations("Common");

  const filteredUsers = useMemo(() => {
    return initialData.filter((user) => {
      const matchesSearch =
        search === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const statusValue = user.isActive ? "active" : "inactive";
      const matchesStatus = statusFilter === "all" || statusValue === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [initialData, search, roleFilter, statusFilter]);


  return (
    <div>
      <Header
        title={tNav("users")}
        subtitle={t("createUserDescription")}
        user={currentUser}
        onSearchChange={setSearch}
        action={hasPermission(currentUser, "user.create") ? {
          label: t("createUser"),
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setIsOpen(true)
        } : undefined}
      />

      <main className="container">
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="w-full md:w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tCommon("allCaughtUp") === "Tudo em dia" ? "Todos os Cargos" : "All Roles"}</SelectItem>
                <SelectItem value="admin">{tRoles("admin")}</SelectItem>
                <SelectItem value="teacher">{tRoles("teacher")}</SelectItem>
                <SelectItem value="student">{tRoles("student")}</SelectItem>
                <SelectItem value="manager">{tRoles("manager")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`card p-5 flex flex-col gap-4 transition-all hover:ring-1 hover:ring-primary/20 ${!user.isActive ? "opacity-70 grayscale-[0.5]" : ""
                  }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={user.photoUrl || ""} alt={user.name} />
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {user.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground leading-tight">
                        {user.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <Badge variant={user.isActive ? "default" : "secondary"} className="text-[10px] uppercase tracking-wider font-bold">
                    {user.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between pt-2 border-t mt-auto">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary/60" />
                    {tRoles(user.role as Role)}
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Circle className={`w-2 h-2 ${user.isActive ? "fill-green-500 text-green-500" : "fill-slate-400 text-slate-400"}`} />
                    {user.id.substring(0, 8)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyResults searchQuery={search} />
        )}
      </main>

      <CreateUserVault open={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
}
