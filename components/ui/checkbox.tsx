"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  onCheckedChange?: (checked: boolean) => void;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}


const boxVariants = {
  unchecked: {
    scale: 1,
    boxShadow: "0 0 0 0px hsl(var(--primary) / 0)",
  },
  checked: {
    scale: [1, 0.88, 1.04, 1],
    boxShadow: "0 0 0 3px hsl(var(--primary) / 0.15)",
    transition: {
      scale: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] as const },
      boxShadow: { duration: 0.2 },
    },
  },
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, checked, defaultChecked, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(
      defaultChecked ?? false
    );

    const isChecked = checked !== undefined ? checked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.checked;
      if (checked === undefined) {
        setInternalChecked(next);
      }
      onChange?.(e);
      onCheckedChange?.(next);
    };

    return (
      <div className="relative inline-flex items-center justify-center">
        {/* Input nativo oculto — mantém acessibilidade */}
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed z-10"
          onChange={handleChange}
          {...props}
        />

        {/* Box animada */}
        <motion.div
          aria-hidden
          variants={boxVariants}
          animate={isChecked ? "checked" : "unchecked"}
          initial={false}
          className={cn(
            "pointer-events-none flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors",
            "focus-visible:outline-none",
            isChecked ? "bg-primary border-primary" : "bg-transparent border-input",
            props.disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          {isChecked && (
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <motion.path
                d="M1 4L3.5 6.5L9 1"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              />
            </motion.svg>
          )}
        </motion.div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };