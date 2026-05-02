"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, BookOpen, Clock, Tag, Edit2 } from "lucide-react";
import Link from "next/link";

interface RecessActivityCardProps {
  activity: {
    id: string;
    title: string;
    teacherId?: string | null;
    difficulty: string;
    contentText?: string | null;
    language?: { name: string } | null;
    createdAt?: Date | string | null;
  };
}

export function RecessActivityCard({ activity }: RecessActivityCardProps) {
  return (
    <Card className="h-full flex flex-col overflow-hidden group hover:border-primary/50 transition-colors border-border/50">
      <CardHeader className="p-4 pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <Badge variant={activity.teacherId ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5 font-medium uppercase tracking-wider">
            {activity.teacherId ? "Minha Atividade" : "Global"}
          </Badge>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Tag className="w-3 h-3" />
            <span className="text-[10px] font-medium uppercase tracking-wider">{activity.difficulty}</span>
          </div>
        </div>
        <CardTitle className="text-base font-bold line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {activity.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-1 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground line-clamp-3 italic">
          {activity.contentText || "Nenhuma descrição disponível."}
        </p>
        
        <div className="flex items-center gap-4 mt-auto pt-2">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{activity.language?.name || "Idioma"}</span>
          </div>
          {activity.createdAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{new Date(activity.createdAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 gap-2">
        <Button variant="ghost" className="flex-1 justify-between h-9 text-xs font-semibold group/btn" size="sm">
          Visualizar Detalhes
          <Activity className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
        </Button>
        {activity.teacherId && (
          <Link href={`/hub/teacher/recess/${activity.id}`}>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
              <Edit2 className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
