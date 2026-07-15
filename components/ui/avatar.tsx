"use client";

import * as React from "react";
import Image from "next/image";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { twMerge } from "tailwind-merge";
import { getFallbackImages } from "@/modules/appearance/fallback-images.actions";
import { getOrSetFallbackImage } from "@/modules/appearance/fallback-image.store";

const sizeClasses = {
    xs: "h-8 w-8",
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-20 w-20",
    xl: "h-24 w-24",
    "2xl": "h-32 w-32",
};

const Avatar = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & { size?: keyof typeof sizeClasses }
>(({ className, size = "md", ...props }, ref) => (
    <AvatarPrimitive.Root
        ref={ref}
        className={twMerge("relative flex shrink-0 overflow-hidden rounded-2xl", sizeClasses[size], className)}
        {...props}
    />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Image>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
        ref={ref}
        className={twMerge("aspect-square h-full w-full object-cover", className)}
        {...props}
    />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
    React.ComponentRef<typeof AvatarPrimitive.Fallback>,
    React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
        name?: string;
    }
>(({ className, name, children, ...props }, ref) => {
    const [src, setSrc] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadImages() {
            const images = await getFallbackImages();
            if (images.length > 0) {
                setSrc(getOrSetFallbackImage(images, name));
            }
        }
        loadImages();
    }, [name]);

    return (
        <AvatarPrimitive.Fallback
            ref={ref}
            className={twMerge("flex h-full w-full items-center justify-center bg-muted animate-in fade-in duration-300", className)}
            {...props}
        >
            {src ? (
                <Image src={src} alt="Avatar" width={100} height={100} className="object-cover" priority loading="eager" />
            ) : (
                children || (
                    <span className="text-muted-foreground uppercase font-medium">
                        {name?.charAt(0) || "?"}
                    </span>
                )
            )}
        </AvatarPrimitive.Fallback>
    );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

const AvatarGroup = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={twMerge("flex -space-x-2 items-center justify-center", className)}
        {...props}
    />
));
AvatarGroup.displayName = "AvatarGroup";

const AvatarGroupCount = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { size?: keyof typeof sizeClasses }
>(({ className, size = "md", ...props }, ref) => (
    <span
        ref={ref}
        className={twMerge(
            "flex items-center justify-center rounded-2xl bg-muted text-xs font-semibold ring-1 ring-background shrink-0",
            sizeClasses[size],
            className
        )}
        {...props}
    />
));
AvatarGroupCount.displayName = "AvatarGroupCount";

const AvatarBadge = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        className={twMerge(
            "absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full ring-1 ring-background",
            className
        )}
        {...props}
    />
));
AvatarBadge.displayName = "AvatarBadge";

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge };