"use client";

import useSWR from "swr";
import { type StudentCourse } from "@/modules/course/course.types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMyCourses() {
  const { data, error, isLoading, mutate } = useSWR<StudentCourse[]>(
    "/api/courses/my-courses",
    fetcher
  );

  return {
    courses: data,
    isLoading,
    isError: error,
    mutate,
  };
}
