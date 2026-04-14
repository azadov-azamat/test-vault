"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/teacher/dashboard"); }, [router]);
  return null;
}
