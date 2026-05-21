"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface FileTextIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface FileTextIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

const LINE_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 0.3,
    },
  },
  animate: (custom: number) => ({
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      delay: custom * 0.1,
      duration: 0.4,
    },
  }),
};

const FileTextIcon = forwardRef<FileTextIconHandle, FileTextIconProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
      isControlledRef.current = true;

      return {
        startAnimation: () => controls.start("animate"),
        stopAnimation: () => controls.start("normal"),
      };
    });

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseEnter?.(e);
        } else {
          controls.start("animate");
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (isControlledRef.current) {
          onMouseLeave?.(e);
        } else {
          controls.start("normal");
        }
      },
      [controls, onMouseLeave]
    );

    return (
      <div
        className={cn(className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          fill="none"
          height={size}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width={size}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main file paper body */}
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          
          {/* Paper folded corner */}
          <path d="M14 2v4a2 2 0 0 0 2 2h4" />
          
          {/* Text lines */}
          <motion.path
            animate={controls}
            custom={0}
            d="M10 9H8"
            initial="normal"
            variants={LINE_VARIANTS}
          />
          <motion.path
            animate={controls}
            custom={1}
            d="M16 13H8"
            initial="normal"
            variants={LINE_VARIANTS}
          />
          <motion.path
            animate={controls}
            custom={2}
            d="M16 17H8"
            initial="normal"
            variants={LINE_VARIANTS}
          />
        </svg>
      </div>
    );
  }
);

FileTextIcon.displayName = "FileTextIcon";

export { FileTextIcon };
