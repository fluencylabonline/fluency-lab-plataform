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
>(({ className, name, ...props }, ref) => {
    const [src, setSrc] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadImages() {
            // Busca as imagens direto da Action
            const images = await getFallbackImages();
            if (images.length > 0) {
                setSrc(getOrSetFallbackImage(images));
            }
        }
        loadImages();
    }, []);

    return (
        <AvatarPrimitive.Fallback
            ref={ref}
            className={twMerge("flex h-full w-full items-center justify-center bg-muted animate-in fade-in duration-300", className)}
            {...props}
        >
            {src ? (
                <Image src={src} alt="Avatar" width={100} height={100} className="object-cover" unoptimized />
            ) : (
                <span className="text-muted-foreground uppercase font-medium">
                    {name?.charAt(0) || "?"}
                </span>
            )}
        </AvatarPrimitive.Fallback>
    );
});
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };