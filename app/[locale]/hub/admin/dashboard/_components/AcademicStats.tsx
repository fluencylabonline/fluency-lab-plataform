"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AttendanceStats, PopularCourse } from "@/modules/dashboard/dashboard.types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";

interface AcademicStatsProps {
  attendance: AttendanceStats;
  popularCourses: PopularCourse[];
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border bg-card px-3 py-2 shadow-lg text-sm">
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: d.payload.color }} />
        <span className="text-muted-foreground">{d.name}</span>
        <span className="font-semibold ml-1">{d.value}</span>
      </div>
    </div>
  );
}

const MEDAL_COLORS = ["text-amber-500", "text-zinc-400", "text-orange-700"];

export function AcademicStats({ attendance, popularCourses }: AcademicStatsProps) {
  const t = useTranslations("Dashboard.academic");

  const ATTENDANCE_COLORS = [
    { label: t("completed"), color: "hsl(var(--primary))", bg: "bg-primary/10", text: "text-primary" },
    { label: t("noShow"), color: "hsl(var(--destructive))", bg: "bg-destructive/10", text: "text-destructive" },
    { label: t("canceledStudent"), color: "#f59e0b", bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400" },
    { label: t("canceledTeacher"), color: "#6366f1", bg: "bg-indigo-100 dark:bg-indigo-950/40", text: "text-indigo-600 dark:text-indigo-400" },
  ];

  const attendanceRaw = [
    { name: t("completed"), value: attendance.completed, color: ATTENDANCE_COLORS[0].color },
    { name: t("noShow"), value: attendance.noShow, color: ATTENDANCE_COLORS[1].color },
    { name: t("canceledStudent"), value: attendance.canceledStudent, color: ATTENDANCE_COLORS[2].color },
    { name: t("canceledTeacher"), value: attendance.canceledTeacher, color: ATTENDANCE_COLORS[3].color },
  ];
  const attendanceData = attendanceRaw.filter((d) => d.value > 0);
  const total = attendanceData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pie card */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="px-6 pt-6 pb-3">
          <CardTitle className="text-base font-semibold">{t("attendanceTitle")}</CardTitle>
          <CardDescription>{t("attendanceDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {attendanceData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative h-[180px] w-[180px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold tabular-nums">{total}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{t("classes")}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2.5 min-w-0 w-full">
                {attendanceData.map((entry, idx) => {
                  const cfg = ATTENDANCE_COLORS.find((c) => c.label === entry.name)!;
                  const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                  return (
                    <div key={entry.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground truncate">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-semibold tabular-nums">{entry.value}</span>
                        <span className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.text}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px] gap-2 text-muted-foreground">
              <BookOpen className="h-8 w-8 opacity-30" />
              <span className="text-sm">{t("emptyClasses")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular courses card */}
      <Card className="border bg-card shadow-sm">
        <CardHeader className="px-6 pt-6 pb-3">
          <CardTitle className="text-base font-semibold">{t("coursesTitle")}</CardTitle>
          <CardDescription>{t("coursesDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {popularCourses.length > 0 ? (
            <div className="space-y-1">
              {popularCourses.map((course, idx) => {
                const maxEnrollments = popularCourses[0].enrollments;
                const pct = maxEnrollments > 0 ? (course.enrollments / maxEnrollments) * 100 : 0;

                return (
                  <div key={course.id} className="group">
                    <div className="flex items-center justify-between py-2.5 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-bold ${idx < 3 ? MEDAL_COLORS[idx] : "text-muted-foreground"
                            }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium truncate">{course.title}</span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums flex-shrink-0">
                        {course.enrollments}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden -mt-1 mb-1">
                      <div
                        className="h-full bg-primary/60 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px] gap-2 text-muted-foreground">
              <BookOpen className="h-8 w-8 opacity-30" />
              <span className="text-sm">{t("emptyCourses")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}