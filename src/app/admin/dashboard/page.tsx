import React from "react";
import { createClient } from "@/utils/supabase/server";
import AdminDashboard from "./AdminDashboard";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Fetch Analytics Counts
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: activeItems } = await supabase
    .from("lost_found_items")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: completedSessions } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("status", "completed");

  const { count: totalPosts } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  // 2. Fetch Flagged reports
  const { data: reports } = await supabase
    .from("moderation_reports")
    .select("*, reporter:profiles(*)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const stats = {
    totalUsers: totalUsers || 0,
    activeItems: activeItems || 0,
    completedSessions: completedSessions || 0,
    totalPosts: totalPosts || 0,
  };

  return <AdminDashboard reports={(reports || []) as any} stats={stats} />;
}
