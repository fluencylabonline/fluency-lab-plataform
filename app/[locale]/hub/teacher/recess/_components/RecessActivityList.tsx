"use client";

import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { motion } from "framer-motion";
import { RecessActivityCard } from "./RecessActivityCard";

interface RecessActivityListProps {
  activities: LessonSummary[];
}

export function RecessActivityList({ activities }: RecessActivityListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <RecessActivityCard activity={activity} />
        </motion.div>
      ))}
    </div>
  );
}
