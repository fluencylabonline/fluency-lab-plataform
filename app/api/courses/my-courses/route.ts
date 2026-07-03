import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { courseService } from "@/modules/course/course.service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const courses = await courseService.getUserCourses(user);
    return NextResponse.json(courses);
  } catch (error) {
    console.error("[GET /api/courses/my-courses] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
