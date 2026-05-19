"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, User, Video } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface NextClassCardProps {
  nextClass: {
    id: string;
    startsAt: Date;
    endsAt: Date;
    teacherName: string;
    teacherPhoto: string | null;
    topic?: string | null;
  } | null;
  studentId: string;
}

export function NextClassCard({ nextClass, studentId }: NextClassCardProps) {
  const t = useTranslations("Hub.StudentProfile.NextClass");
  const format = useFormatter();
  const [activeCall, setActiveCall] = useState<{ callId: string; notebookId: string } | null>(null);

  useEffect(() => {
    if (!studentId) return;

    const docRef = doc(db, "users", studentId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.callId && data?.notebookId) {
            setActiveCall({
              callId: data.callId,
              notebookId: data.notebookId,
            });
          } else {
            setActiveCall(null);
          }
        } else {
          setActiveCall(null);
        }
      },
      (error) => {
        console.error("[NextClassCard] Error listening to user call status:", error);
      }
    );

    return () => unsubscribe();
  }, [studentId]);

  if (!nextClass) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center text-center h-full">
        <div className="p-3 rounded-full bg-muted/50 mb-4 text-muted-foreground">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{t("empty_title")}</h3>
        <p className="text-sm text-muted-foreground mt-2 mb-6 max-w-[200px]">
          {t("empty_desc")}
        </p>
      </div>
    );
  }

  const isSoon = new Date().getTime() + 15 * 60 * 1000 > nextClass.startsAt.getTime() && new Date() < nextClass.endsAt;

  return (
    <div className="card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="p-2.5 rounded-md bg-primary/10 text-primary">
          <Calendar className="w-5 h-5" />
        </div>
        {isSoon && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {t("starting_soon")}
          </span>
        )}
      </div>

      <div className="flex-1">
        <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
          {t("next_session")}
        </p>
        <h3 className="text-xl font-black text-foreground mb-4 line-clamp-2 leading-tight">
          {nextClass.topic || t("default_topic")}
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <div className="p-1.5 rounded-md bg-muted/50">
              <Clock className="w-4 h-4" />
            </div>
            <span className="capitalize">
              {format.dateTime(nextClass.startsAt, {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
              <span className="text-foreground ml-1">{t("at")} {format.dateTime(nextClass.startsAt, {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
            <div className="p-1.5 rounded-md bg-muted/50">
              <User className="w-4 h-4" />
            </div>
            <span>{nextClass.teacherName}</span>
          </div>
        </div>
      </div>

      {activeCall && (
        <div className="mt-8">
          <Link
            href={`/notebook/${activeCall.notebookId}`}
            className={buttonVariants({
              className: "w-full h-12 rounded-md shadow-none font-bold"
            })}
          >
            <Video className="w-5 h-5 mr-2" />
            {t("join_class")}
          </Link>
        </div>
      )}
    </div>
  );
}
