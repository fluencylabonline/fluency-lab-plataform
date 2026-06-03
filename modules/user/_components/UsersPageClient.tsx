"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Mail, Shield, Sparkles, Skull } from "lucide-react";
import { CreateUserVault } from "./CreateUserVault";
import { Header } from "@/components/layout/header";
import { hasPermission, Role, UserRoles } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import type { User, AdminUserDTO } from "@/modules/user/user.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyResults } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { RoleGuard } from "@/components/ui/role-guard";

interface UsersPageClientProps {
  initialData: AdminUserDTO[];
  currentUser: User;
  basePath: string;
}

export function UsersPageClient({ initialData, currentUser, basePath }: UsersPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("student");
  const [statusFilter, setStatusFilter] = useState<string>("active");

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
        actions={hasPermission(currentUser, "user.create") ? [{
          label: t("createUser"),
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setIsOpen(true)
        }] : undefined}
        className="contents"
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

          <div className="flex-1" />

          <RoleGuard roles={[UserRoles.ADMIN, UserRoles.MANAGER]}>
            <Link
              href={basePath.replace("/users", "/students/onboarding")}
              className={cn(buttonVariants({ variant: "outline" }), "shrink-0 border-primary/20 text-primary hover:bg-primary/5")}
            >
              <Sparkles className="mr-2 h-4 w-4 fill-primary/10" /> Perfil Adaptativo
            </Link>
          </RoleGuard>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <Link
                key={user.id}
                href={`${basePath}/${user.id}`}
                className={`card p-5 flex flex-col gap-4 transition-all hover:ring-1 hover:ring-primary/20 ${!user.isActive ? "opacity-70 grayscale-[0.5]" : ""
                  }`}
              >
                <div className="flex flex-wrap items-start justify-between">
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
                        {user.isActive ? (<>
                          <Mail className="w-3 h-3" />
                          <span className="text-truncate max-w-60">{user.email}</span>
                        </>) : (
                          <>
                            <Skull className="w-3 h-3" />
                            <span className="text-truncate max-w-60">{user.id}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                </div>

                <div className="flex items-center justify-between pt-2 border-t mt-auto">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Shield className="w-3.5 h-3.5 text-primary/60" />
                    {tRoles(user.role as Role)}
                  </div>
                  <Badge variant={user.isActive ? "default" : "secondary"} className="text-[10px] uppercase tracking-wider font-bold">
                    {user.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </Link>
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
