"use client";

import { useEffect, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

interface CollaboratorsAvatarGroupProps {
  user: {
    uid?: string;
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
  awareness?: Awareness | null;
}

interface CaretState {
  user?: {
    uid: string;
    name: string;
    color: string;
    photoUrl?: string | null;
  };
  [key: string]: unknown;
}

export function CollaboratorsAvatarGroup({
  user,
  awareness,
}: CollaboratorsAvatarGroupProps) {
  const [onlineUsers, setOnlineUsers] = useState<
    { uid: string; name: string; color: string; photoUrl?: string | null }[]
  >([]);

  useEffect(() => {
    if (!awareness) return;

    const updateUsers = () => {
      const states = awareness.getStates() as Map<number, CaretState>;
      const usersMap = new Map<
        string,
        { uid: string; name: string; color: string; photoUrl?: string | null }
      >();

      states.forEach((state) => {
        if (state.user && state.user.uid) {
          usersMap.set(state.user.uid, state.user);
        }
      });

      setOnlineUsers(Array.from(usersMap.values()));
    };

    updateUsers();
    awareness.on("change", updateUsers);
    return () => {
      awareness.off("change", updateUsers);
    };
  }, [awareness]);

  const handleAvatarClick = (userName: string, userColor: string) => {
    if (!userName) return;

    // Search for the collaboration caret label containing the clicked user's name
    const labels = document.querySelectorAll(".collaboration-carets__label");
    const targetLabel = Array.from(labels).find(
      (label) => label.textContent?.trim() === userName.trim()
    );

    if (targetLabel) {
      // Smoothly scroll the user's caret into the center of the viewport
      targetLabel.scrollIntoView({ behavior: "smooth", block: "center" });

      // Apply a premium, soft pulsing color ring matching their presence color
      const parentCaret = targetLabel.parentElement;
      if (parentCaret) {
        const originalTransition = parentCaret.style.transition;
        const originalBoxShadow = parentCaret.style.boxShadow;
        
        let rgbaColor = "rgba(99, 102, 241, 0.5)";
        if (userColor.startsWith("#")) {
          const hex = userColor.replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          rgbaColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
        }

        parentCaret.style.transition = "all 0.3s ease";
        parentCaret.style.boxShadow = `0 0 0 10px ${rgbaColor}`;
        parentCaret.style.borderRadius = "2px";

        setTimeout(() => {
          parentCaret.style.boxShadow = originalBoxShadow;
          setTimeout(() => {
            parentCaret.style.transition = originalTransition;
          }, 300);
        }, 1500);
      }
    }
  };

  if (onlineUsers.length === 0) return null;

  // We will display up to 3 avatars, and group the rest
  const maxVisible = 3;
  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const extraCount = onlineUsers.length - maxVisible;

  return (
    <AvatarGroup className="mr-2">
      {visibleUsers.map((onlineUser) => {
        const isMe = onlineUser.uid === user.uid;
        
        return (
          <div 
            key={onlineUser.uid} 
            className="relative group cursor-pointer"
            title={`${onlineUser.name} ${isMe ? "(Você) - Clique para focar" : "- Clique para focar no cursor"}`}
            onClick={() => !isMe && handleAvatarClick(onlineUser.name, onlineUser.color)}
          >
            <Avatar
              size="xs"
              className="hover:z-10 transition-all duration-200 hover:-translate-y-0.5"
              style={{ border: `0.5px solid ${onlineUser.color}` }}
            >
              {onlineUser.photoUrl && (
                <AvatarImage
                  src={onlineUser.photoUrl}
                  alt={onlineUser.name || ""}
                />
              )}
              <AvatarFallback name={onlineUser.name || ""} />
            </Avatar>
            <span 
              className="absolute bottom-0 right-0 block h-2 w-2 rounded-full" 
              style={{ backgroundColor: onlineUser.color }}
            />
          </div>
        );
      })}

      {extraCount > 0 && (
        <AvatarGroupCount 
          size="xs" 
          className="ring-2 ring-background cursor-pointer hover:bg-muted/80 transition-colors font-semibold"
          title={`Outros online: ${onlineUsers.slice(maxVisible).map(u => u.name).join(", ")}`}
        >
          +{extraCount}
        </AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}
