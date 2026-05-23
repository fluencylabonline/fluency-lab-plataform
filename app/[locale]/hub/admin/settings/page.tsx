import { getCurrentUser, checkUserHasPassword } from "@/lib/auth-server";
import { adminAuth } from "@/lib/firebase-admin";
import { userService } from "@/modules/user/user.service";
import { redirect } from "next/navigation";
import { SettingsPageContent } from "@/modules/user/_components/SettingsPageContent";
import type { NotificationPrefs } from "@/modules/user/user.schema";
import { getTranslations } from "next-intl/server";

export default async function AdminSettingsPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/signin");

  const user = await userService.getUser(sessionUser.id);
  const tc = await getTranslations("Common");

  if (!user) return <div>{tc("notFound")}</div>;

  const prefs = (user.notificationPrefs as NotificationPrefs) || {
    streak: true,
    roadmap: true,
    classes: true,
    marketing: false,
    whatsapp: true,
  };

  const [hasPassword, firebaseUser] = await Promise.all([
    checkUserHasPassword(sessionUser.id),
    adminAuth.getUser(sessionUser.id),
  ]);

  const emailVerified = firebaseUser.emailVerified;

  return (
    <SettingsPageContent
      initialData={{
        user: userService.sanitizeUserForSettings(user),
        emailVerified,
        initialNotificationPrefs: prefs,
        hasPassword,
      }}
    />
  );
}
