"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AttendanceStats, PopularCourse } from "@/modules/dashboard/dashboard.types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface AcademicStatsProps {
  attendance: AttendanceStats;
  popularCourses: PopularCourse[];
}

export function AcademicStats({ attendance, popularCourses }: AcademicStatsProps) {
  const attendanceData = [
    { name: "Concluídas", value: attendance.completed, color: "hsl(var(--primary))" },
    { name: "No-show", value: attendance.noShow, color: "hsl(var(--destructive))" },
    { name: "Canc. Aluno", value: attendance.canceledStudent, color: "#f59e0b" },
    { name: "Canc. Prof", value: attendance.canceledTeacher, color: "#6366f1" },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="card border-none shadow-none">
        <CardHeader>
          <CardTitle>Status de Aulas</CardTitle>
          <CardDescription>Resumo de presença e cancelamentos</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          {attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Sem dados de aulas
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="card border-none shadow-none">
        <CardHeader>
          <CardTitle>Cursos em Destaque</CardTitle>
          <CardDescription>Cursos com maior número de matrículas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularCourses.length > 0 ? (
              popularCourses.map((course, idx) => (
                <div key={course.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium">{course.title}</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-semibold">
                    {course.enrollments} matrículas
                  </span>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                Nenhum curso matriculado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
