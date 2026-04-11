import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 after:absolute after:left-1/2 after:top-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:h-[max(100%,44px)] after:w-[max(100%,44px)] after:content-['']",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "bg-transparent border-transparent text-foreground hover:bg-white/20 hover:text-foreground focus-visible:ring-ring",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline !p-0 !h-auto",
      },
      size: {
        default: "h-10 gap-2 px-4",
        xs: "h-7 gap-1 rounded-md px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 text-base [&_svg:not([class*='size-'])]:size-5",
        icon: "size-10",
      },
      fullWidth: {
        true: "w-full",
      },
      animation: {
        scale: "active:scale-[0.98]",
        bounce: "hover:animate-bounce",
        pulse: "hover:animate-pulse",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "scale",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof ButtonPrimitive>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<React.ElementRef<typeof ButtonPrimitive>, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      animation,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const showLeftIcon = !isLoading && leftIcon;
    const showRightIcon = !isLoading && rightIcon;
    const isIconOnly = size === "icon";
    const showChildren = !isIconOnly || !isLoading;

    return (
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        disabled={isLoading || disabled}
        className={cn(buttonVariants({ variant, size, fullWidth, animation, className }))}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin relative z-10"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {showLeftIcon && (
          <span className="shrink-0 relative z-10 flex items-center justify-center">
            {leftIcon}
          </span>
        )}

        {showChildren && (
          <span
            className={cn(
              "flex items-center justify-center relative z-10",
              (showLeftIcon || showRightIcon || isLoading) && "truncate"
            )}
          >
            {children}
          </span>
        )}

        {showRightIcon && (
          <span className="shrink-0 relative z-10 flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </ButtonPrimitive>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }