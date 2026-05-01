import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "@/modules/user/user.service";
import { redirect } from "next/navigation";
import { SettingsPageContent } from "@/modules/user/_components/SettingsPageContent";
import type { NotificationPrefs } from "@/modules/user/user.schema";
import { getTranslations } from "next-intl/server";

export default async function TeacherSettingsPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await userService.getUser(sessionUser.id);
  const tc = await getTranslations("Common");

  if (!user) return <div>{tc("notFound")}</div>;

  const prefs = (user.notificationPrefs as NotificationPrefs) || {
    streak: true,
    roadmap: true,
    classes: true,
    marketing: false,
  };

  return <SettingsPageContent initialNotificationPrefs={prefs} />;
}
