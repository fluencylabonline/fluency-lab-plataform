"use client";

import useSWR from "swr";
import { type StudentCourse } from "@/modules/course/course.types";

export class FetchError extends Error {
  info: unknown;
  status: number;

  constructor(message: string, status: number, info: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.info = info;
  }
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new FetchError("An error occurred while fetching the data.", res.status, info);
  }
  return res.json();
};

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
