"use client";

import {
    Vault,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultContent,
    VaultTrigger
} from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { Plus, Search, BookOpen } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AddLessonVaultProps {
    availableLessons: Array<{
        id: string;
        title: string;
        difficulty: string;
    }>;
    onAdd: (lessonId: string) => void;
    isAdding: boolean;
}

export function AddLessonVault({ availableLessons, onAdd, isAdding }: AddLessonVaultProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredLessons = availableLessons.filter(lesson =>
        lesson.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = (lessonId: string) => {
        onAdd(lessonId);
        setOpen(false);
    };

    return (
        <Vault open={open} onOpenChange={setOpen}>
            <VaultTrigger asChild>
                <Button className="rounded-2xl gap-2 font-bold px-6">
                    <Plus className="w-5 h-5" />
                    Add Lesson
                </Button>
            </VaultTrigger>
            <VaultContent>
                <VaultHeader>
                    <VaultTitle>Add Lesson to Path</VaultTitle>
                    <VaultDescription>
                        Select a &quot;Ready&quot; lesson from the curriculum to add to this learning plan.
                    </VaultDescription>
                </VaultHeader>

                <div className="p-6 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search lessons by title..."
                            className="h-12 pl-10 rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                        {filteredLessons.length > 0 ? (
                            filteredLessons.map((lesson) => (
                                <button
                                    key={lesson.id}
                                    onClick={() => handleAdd(lesson.id)}
                                    disabled={isAdding}
                                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-primary/5 dark:hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-2xl transition-all group text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                                            <BookOpen className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-gray-100 truncate">
                                                {lesson.title}
                                            </p>
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 lowercase font-medium">
                                                Level {lesson.difficulty}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                                </button>
                            ))
                        ) : (
                            <div className="py-12 text-center">
                                <p className="text-gray-500">No matching lessons found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </VaultContent>
        </Vault>
    );
}
