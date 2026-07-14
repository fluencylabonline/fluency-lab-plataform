"use client";

import { WhatsAppConversation, WhatsAppLabel } from "../communication.types";
import { Avatar } from "./Avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const LABEL_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  blue: { bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", hex: "#0070f3" },
  orange: { bg: "bg-orange-500/10 dark:bg-orange-500/15", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", hex: "#f5a623" },
  green: { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-[#00a884] dark:text-emerald-400", border: "border-emerald-500/20", hex: "#00a884" },
  red: { bg: "bg-red-500/10 dark:bg-red-500/15", text: "text-red-600 dark:text-red-400", border: "border-red-500/20", hex: "#ff0055" },
  purple: { bg: "bg-purple-500/10 dark:bg-purple-500/15", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20", hex: "#7928ca" },
  yellow: { bg: "bg-yellow-500/10 dark:bg-yellow-500/15", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-500/20", hex: "#e3b300" },
};

interface ConvItemProps {
  conv: WhatsAppConversation;
  isSelected: boolean;
  onClick: () => void;
}

export function ConvItem({ conv, isSelected, onClick }: ConvItemProps) {
  const displayName = conv.contactName || conv.studentName || `+${conv.waId}`;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3.5 flex items-center gap-3 transition-colors text-left border-b border-border/30 relative",
        "hover:bg-muted/50 active:bg-muted/80",
        isSelected && "bg-primary/8 border-l-[3px] border-l-primary"
      )}
    >
      <Avatar seed={conv.waId} photoUrl={conv.photoUrl} name={displayName} size={44} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <span
            className={cn(
              "text-[13.5px] truncate text-foreground",
              conv.unreadCount > 0 ? "font-bold" : "font-medium"
            )}
          >
            {displayName}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
            {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), "HH:mm") : ""}
          </span>
        </div>

        {/* Labels list */}
        {conv.labels && conv.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1 animate-in fade-in duration-200">
            {conv.labels.map((lbl: WhatsAppLabel) => {
              const colors = LABEL_COLORS[lbl.color] || LABEL_COLORS.blue;
              return (
                <span
                  key={lbl.id}
                  className={cn(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-md border",
                    colors.bg,
                    colors.text,
                    colors.border
                  )}
                >
                  {lbl.name}
                </span>
              );
            })}
          </div>
        )}

        <p
          className={cn(
            "text-xs truncate",
            conv.unreadCount > 0
              ? "text-foreground font-medium"
              : "text-muted-foreground italic"
          )}
        >
          {conv.lastMessageContent || "Sem mensagens"}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <div className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
          {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
        </div>
      )}
    </button>
  );
}
