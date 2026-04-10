"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PhoneMockupProps {
    children?: React.ReactNode;
}

export function PhoneMockup({ children }: PhoneMockupProps) {
    const [currentTime, setCurrentTime] = useState<string>("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const formattedTime = `${hours}:${minutes.toString().padStart(2, "0")}`;
            setCurrentTime(formattedTime);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 100, rotate: 10 }}
            animate={{ opacity: 1, y: 0, rotate: -6 }}
            whileHover={{ rotate: 0, scale: 1.02 }}
            transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1,
                delay: 0.2,
            }}
            className="relative z-10 w-[410px] md:w-[620px] lg:w-[530px] -translate-y-22 translate-x-5 lg:translate-y-0 lg:mt-0 cursor-pointer"
        >
            <div className="w-full h-[100vh] bg-gray-100 dark:bg-gray-900 rounded-[3rem] border-[6px] border-gray-100 dark:border-gray-800 ring-1 ring-gray-900/5 flex flex-col overflow-hidden relative">
                <div className="absolute top-0 w-full h-6 z-99 flex justify-between px-6 p-6 items-center mt-3">
                    <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
                        {currentTime || "9:41"}
                    </div>
                    <div className="flex gap-1">
                        <div className="w-6 h-2.5 bg-green-500 rounded-md" />
                    </div>
                </div>

                <div className="flex-1 bg-gray-100 dark:bg-gray-950 pt-10 px-5 pb-6 flex flex-col gap-4 overflow-hidden">
                    {children}
                </div>
            </div>
        </motion.div>
    );
}